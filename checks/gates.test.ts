// Each browser gate fails on a broken copy of dist/.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const dirs: string[] = [];

/** Copies dist/ to a temporary directory and rewrites theme.css there. */
const brokenDist = (edit: (theme: string) => string) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "igd-gate-"));
  dirs.push(dir);
  for (const f of ["tokens.css", "theme.css", "tokens.json"])
    fs.copyFileSync(path.join("dist", f), path.join(dir, f));
  const theme = path.join(dir, "theme.css");
  const before = fs.readFileSync(theme, "utf8");
  const after = edit(before);
  if (after === before) throw new Error("the edit did not change theme.css");
  fs.writeFileSync(theme, after);
  return dir;
};

const run = (gate: string, dir: string) => {
  const r = spawnSync(process.execPath, [`checks/${gate}`, dir], {
    encoding: "utf8",
  });
  return { code: r.status, out: r.stdout + r.stderr };
};

afterAll(() => {
  for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
});

describe("checks/gates-themes.ts", () => {
  it("fails a text colour that falls below its minimum", () => {
    const dir = brokenDist(
      (t) =>
        `${t}\n:root, [data-theme] { --igd-color-text-muted: var(--ig-gray-300); }\n`,
    );
    const r = run("gates-themes.ts", dir);
    expect(r.code).toBe(1);
    expect(r.out).toContain("color-text-muted");
  }, 60000);

  it("fails a pairing that is below its minimum in the dark theme only", () => {
    const dir = brokenDist(
      (t) => `${t}\n[data-theme="dark"] { --igd-color-text-muted: #333333; }\n`,
    );
    const r = run("gates-themes.ts", dir);
    expect(r.code).toBe(1);
    expect(r.out).toContain("dark: color-text-muted");
    expect(r.out).not.toContain("light: color-text-muted");
  }, 60000);

  it("fails the action label on a hover fill it does not read on", () => {
    const dir = brokenDist(
      (t) =>
        `${t}\n:root, [data-ig-scope], [data-theme] { --igd-color-action-fill-hover: #9ec1ff; }\n`,
    );
    const r = run("gates-themes.ts", dir);
    expect(r.code).toBe(1);
    expect(r.out).toContain("color-action-on on color-action-fill-hover");
  }, 60000);

  it("measures feedback text over its tint, and the tint over the page", () => {
    const dir = brokenDist(
      (t) => `${t}\n:root, [data-theme] { --igd-opacity-subtle: 0.3; }\n`,
    );
    const r = run("gates-themes.ts", dir);
    expect(r.code).toBe(1);
    expect(r.out).toContain(
      "light: color-feedback-error-default on color-feedback-error-surface",
    );
  }, 60000);
});

describe("checks/gates-derived.ts", () => {
  it("fails a state colour that no longer follows its base", () => {
    const dir = brokenDist(
      (t) =>
        `${t}\n:root, [data-ig-scope], [data-theme] { --igd-color-action-fill-hover: #123456; }\n`,
    );
    const r = run("gates-derived.ts", dir);
    expect(r.code).toBe(1);
    expect(r.out).toContain("color-action-fill-hover");
  }, 60000);
});

describe("checks/resolve.ts", () => {
  it("fails a token that points at a custom property that does not exist", () => {
    const dir = brokenDist(
      (t) =>
        `${t}\n:root, [data-ig-scope], [data-theme] { --igd-color-text-strong: var(--igd-missing); }\n`,
    );
    const r = run("resolve.ts", dir);
    expect(r.code).toBe(1);
    expect(r.out).toContain("--igd-color-text-strong resolves to nothing");
  }, 60000);

  it("fails a token that resolves to nothing in the dark theme only", () => {
    const dir = brokenDist(
      (t) =>
        `${t}\n[data-theme="dark"] { --igd-color-text-strong: var(--igd-missing); }\n`,
    );
    const r = run("resolve.ts", dir);
    expect(r.code).toBe(1);
    expect(r.out).toContain(
      "UNRESOLVED dark: --igd-color-text-strong resolves to nothing",
    );
    expect(r.out).not.toContain("UNRESOLVED light");
  }, 60000);

  it("fails a radius token whose value is not a length", () => {
    const dir = brokenDist(
      (t) => `${t}\n:root, [data-ig-scope] { --igd-radius-tile: red; }\n`,
    );
    const r = run("resolve.ts", dir);
    expect(r.code).toBe(1);
    expect(r.out).toContain("--igd-radius-tile is not a valid length");
  }, 60000);

  it("fails a spacing token whose live value differs from tokens.json", () => {
    const dir = brokenDist(
      (t) => `${t}\n:root, [data-ig-scope] { --igd-space-md: 2rem; }\n`,
    );
    const r = run("resolve.ts", dir);
    expect(r.code).toBe(1);
    expect(r.out).toContain(
      "--igd-space-md is 32px live and 16px in tokens.json",
    );
  }, 60000);
});
