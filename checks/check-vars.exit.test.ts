import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const run = (file: string) =>
  spawnSync(
    process.execPath,
    ["checks/check-vars.ts", "dist/tokens.css", "dist/theme.css", file],
    { encoding: "utf8" },
  );

describe("checks/check-vars.ts as a gate", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "igd-vars-"));

  it("exits non-zero when a file reads a token that does not exist", () => {
    const file = path.join(dir, "bad.css");
    fs.writeFileSync(file, "a { color: var(--igd-does-not-exist); }\n");
    const r = run(file);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("UNDEFINED --igd-does-not-exist bad.css");
  });

  it("exits 0 when every token a file reads exists", () => {
    const file = path.join(dir, "good.css");
    fs.writeFileSync(file, "a { color: var(--igd-color-text-primary); }\n");
    expect(run(file).status).toBe(0);
  });
});
