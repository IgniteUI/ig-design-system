import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const CLI = path.resolve("dist/cli/checks/cli.js");
let dir: string;

const run = (...args: string[]) => {
  const r = spawnSync(process.execPath, [CLI, ...args], {
    cwd: dir,
    encoding: "utf8",
  });
  return { code: r.status, out: r.stdout + r.stderr };
};

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "igd-cli-"));
  fs.mkdirSync(path.join(dir, "src/vendor"), { recursive: true });
  fs.mkdirSync(path.join(dir, "empty"));
  fs.writeFileSync(
    path.join(dir, "src/clean.css"),
    "a { color: var(--igd-color-text-primary); padding: var(--igd-space-inset-md); }\n",
  );
  fs.writeFileSync(
    path.join(dir, "src/vendor/bad.css"),
    "a {\n  width: var(--igd-space-md);\n  color: var(--ig-gray-700);\n  padding: var(--igd-space-md);\n}\n",
  );
  fs.writeFileSync(path.join(dir, "src/hex.css"), "a { color: #155dfc; }\n");
  fs.writeFileSync(path.join(dir, "empty/notes.txt"), "nothing to read\n");
  fs.mkdirSync(path.join(dir, "rules"));
  const rule = (file: string, text: string) =>
    fs.writeFileSync(path.join(dir, "rules", file), text);
  rule("unknown.css", "a { color: var(--igd-typo); }\n");
  rule("read.css", "a { color: var(--ig-gray-700); }\n");
  rule("override.ts", 'export const style = { "--ig-primary-500": "red" };\n');
  rule("role.css", "a { margin-inline-start: var(--igd-space-md); }\n");
  rule("nostep.css", "a { padding: var(--igd-space-6xl); }\n");
  rule("nextline.css", "a {\n  color:\n    #155dfc;\n}\n");
  rule(
    "url.css",
    "a { background:url(//cdn.test/image); color:var(--igd-typo); }\n",
  );
});

afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

describe("ig-design-system check", () => {
  it("exits 0 on a clean file and says how many files it read", () => {
    const r = run("check", "src/clean.css");
    expect(r.code).toBe(0);
    expect(r.out).toContain("ig-design-system check: pass (1 files)");
  });

  it("exits 1 and prints file:line for each finding", () => {
    const r = run("check", "src/vendor");
    expect(r.code).toBe(1);
    expect(r.out).toContain("src/vendor/bad.css:3  raw-palette:");
    expect(r.out).toContain("2 finding(s) in 1 files");
  });

  it("reports a raw spacing step on the line of the spacing property, not of an earlier use", () => {
    const r = run("check", "src/vendor");
    expect(r.out).toContain("src/vendor/bad.css:4  spacing-role: padding uses");
    expect(r.out).not.toContain("bad.css:2");
  });

  it("skips a path that contains an --ignore text, in both spellings", () => {
    expect(run("check", "src", "--ignore", "vendor").code).toBe(0);
    expect(run("check", "src", "--ignore=vendor").code).toBe(0);
  });

  it("reports a hex colour only with --strict", () => {
    expect(run("check", "src/hex.css").code).toBe(0);
    const r = run("check", "src/hex.css", "--strict");
    expect(r.code).toBe(1);
    expect(r.out).toContain("colour-literal: #155dfc is typed in.");
  });

  it.each([
    ["unknown.css", "unknown.css:1  unknown-token: --igd-typo is not"],
    ["read.css", "read.css:1  raw-palette: --ig-gray-700 is a raw"],
    ["override.ts", "override.ts:1  palette-override: --ig-primary-500 is"],
    [
      "role.css",
      "role.css:1  spacing-role: margin-inline-start uses var(--igd-space-md); use var(--igd-space-gap-md).",
    ],
    ["nostep.css", "--igd-space-inset-6xl does not exist."],
    ["url.css", "url.css:1  unknown-token: --igd-typo is not"],
  ])("reports the finding in %s", (file, message) => {
    const r = run("check", `rules/${file}`);
    expect(r.code).toBe(1);
    expect(r.out).toContain(message);
  });

  it("reports a hex colour on the line after its property, with --strict", () => {
    const r = run("check", "rules/nextline.css", "--strict");
    expect(r.code).toBe(1);
    expect(r.out).toContain("nextline.css:3  colour-literal: #155dfc");
  });

  it("fails when no source file is found, so a wrong path cannot pass", () => {
    const r = run("check", "empty");
    expect(r.code).toBe(1);
    expect(r.out).toContain("No source file to check under empty.");
  });

  it("fails when every file is ignored", () => {
    expect(run("check", "src", "--ignore", "src").code).toBe(1);
  });

  it("says a path does not exist", () => {
    const r = run("check", "nope");
    expect(r.code).toBe(1);
    expect(r.out).toContain("nope does not exist.");
  });

  it("rejects an unknown option and lists the valid ones", () => {
    const r = run("check", "src", "--fast");
    expect(r.code).toBe(1);
    expect(r.out).toContain(
      "Unknown option --fast. Valid options: --ignore, --strict, --help.",
    );
  });

  it("rejects --ignore with no value, and with an option as its value", () => {
    expect(run("check", "src", "--ignore").code).toBe(1);
    const r = run("check", "src", "--ignore", "--strict");
    expect(r.code).toBe(1);
    expect(r.out).toContain("--ignore needs a value");
  });

  it("names an unknown command", () => {
    const r = run("chek", "src");
    expect(r.code).toBe(1);
    expect(r.out).toContain(
      'Unknown command "chek". The only command is check.',
    );
  });

  it("prints the help and exits 0 for --help, with or without the command", () => {
    for (const args of [["--help"], ["check", "--help"], []]) {
      const r = run(...args);
      expect(r.code).toBe(0);
      expect(r.out).toContain("Rules:");
    }
  });

  it("fails when called with the command and no path", () => {
    const r = run("check");
    expect(r.code).toBe(1);
    expect(r.out).toContain("Nothing to check.");
  });
});
