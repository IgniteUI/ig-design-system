import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { checkText, declaredNames } from "../checks/site.ts";
import { RULES } from "./rules.ts";

const known = declaredNames(
  ["dist/tokens.css", "dist/theme.css"]
    .map((f) => fs.readFileSync(f, "utf8"))
    .join("\n"),
);
// A declaration goes inside a rule, as a stylesheet holds it; markup and a whole rule stay as they are.
const inFile = (line: string) =>
  line.startsWith("<") || line.includes("{") ? line : `.a { ${line} }`;
const findings = (line: string) =>
  checkText(inFile(line), known, true).map((f) => f.rule);

describe("the rules for code that uses the tokens", () => {
  it.each(RULES.map((r) => [r.title, r]))(
    "%s: the good example passes the check command",
    (_, rule) => {
      expect(findings(rule.good)).toEqual([]);
    },
  );

  it.each(RULES.map((r) => [r.title, r]))(
    "%s: the check reports the bad example under the rule it names, and nothing when it names none",
    (_, rule) => {
      if (rule.check) expect(findings(rule.bad)).toContain(rule.check);
      else expect(findings(rule.bad)).toEqual([]);
    },
  );
});
