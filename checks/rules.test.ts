import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { CHECKS, NOT_CHECKED, SOURCES } from "./rules.ts";
import { checkText, declaredNames } from "./site.ts";

const known = declaredNames(
  ["dist/tokens.css", "dist/theme.css"]
    .map((f) => fs.readFileSync(f, "utf8"))
    .join("\n"),
);

// One line that breaks each rule of the check command.
const BREAKS: Record<(typeof CHECKS)[number]["id"], string> = {
  "unknown-token": ".a { color: var(--igd-color-txt); }",
  "raw-palette": ".a { color: var(--ig-gray-700); }",
  "palette-override": ".a { --ig-primary-500: red; }",
  "spacing-role": ".a { padding: var(--igd-space-md); }",
  "colour-literal": ".a { color: #1a5fff; }",
};

describe("the rules of the check command", () => {
  it.each(CHECKS.map((c) => [c.id, c]))(
    "reports %s on a line that breaks it, and only with --strict when the rule says so",
    (id, check) => {
      const rules = (strict: boolean) =>
        checkText(BREAKS[id], known, strict).map((f) => f.rule);
      expect(rules(true)).toContain(id);
      expect(rules(false).includes(id)).toBe(!check.strict);
    },
  );

  it("lists every rule the checker reports", () => {
    const reported = new Set(
      Object.values(BREAKS).flatMap((line) =>
        checkText(line, known, true).map((f) => f.rule),
      ),
    );
    expect([...reported].sort()).toEqual(CHECKS.map((c) => c.id).sort());
  });

  it("prints every rule in the help of the command", () => {
    const help = execFileSync("node", ["checks/cli.ts", "--help"], {
      encoding: "utf8",
    });
    for (const c of CHECKS) expect(help).toContain(`${c.id} `);
    for (const c of CHECKS) expect(help).toContain(c.reports);
  });
});

describe("what the check command does not report", () => {
  it.each(NOT_CHECKED.map((n) => [n.text, n]))(
    "passes %s",
    (_, { example, file }) => {
      if (file === "md") expect(SOURCES.test("README.md")).toBe(false);
      else expect(checkText(example, known, true)).toEqual([]);
    },
  );
});
