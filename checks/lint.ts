// Gate: no hand-typed colour, size, duration or easing in a component source.
// node checks/lint.ts <dir>
import fs from "node:fs";
import path from "node:path";
import { isMain } from "../src/main.ts";

const PROPS =
  "width|height|minWidth|maxWidth|minHeight|maxHeight|padding\\w*|margin\\w*|gap|rowGap|columnGap|fontSize|lineHeight|letterSpacing|borderRadius|border\\w*|top|left|right|bottom|inset|zIndex|fontWeight|opacity|flexBasis|boxShadow|transition\\w*|animation\\w*|outline\\w*|verticalAlign|fontFamily";
const rules: [name: string, pattern: RegExp][] = [
  ["hex colour", /(?<![\w&])#[0-9a-fA-F]{3,8}\b(?![^<]*<\/)/g],
  ["rgb/hsl literal", /\b(rgba?|hsla?|oklch|color-mix)\(/g],
  ["px/rem/ms literal", /(?<![\w.-])-?\d*\.?\d+(px|rem|ms)\b/g],
  ["em literal (except 1em)", /(?<![\w.-])(?!1em\b)-?\d*\.?\d+em\b/g],
  [
    "easing literal",
    /cubic-bezier|(?<![-\w])ease(?![-\w])|ease-out|ease-in(?!-out)\b/g,
  ],
  [
    "numeric design prop",
    new RegExp(`\\b(${PROPS}):\\s*-?(?!0\\b|1\\b)\\d+(\\.\\d+)?\\b`, "g"),
  ],
  ["font shorthand", /\bfont:\s*['"`]\d/g],
];

export type Literal = { rule: string; match: string };

/** Lists the literals in one source line. Comments, SVG path data and URLs are skipped. */
export const findLiterals = (line: string): Literal[] => {
  const t = line
    .replace(/\/\/.*$/, "")
    .replace(/\/\*.*?\*\//g, "")
    .replace(/d="[^"]*"/g, "")
    .replace(/https?:\/\/[^\s'"`)]+/g, "");
  const found: Literal[] = [];
  for (const [rule, re] of rules) {
    for (const m of t.matchAll(re)) {
      if (
        rule === "easing literal" &&
        /ease-in-out/.test(m[0]) &&
        /animation/.test(t)
      )
        continue;
      found.push({ rule, match: m[0] });
    }
  }
  return found;
};

if (isMain(import.meta.url)) {
  const files: string[] = [];
  const walk = (d: string): void => {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (/\.(jsx|js)$/.test(f) && !/bundle\.js$/.test(f)) files.push(p);
    }
  };
  walk(process.argv[2]);
  let n = 0;
  for (const f of files) {
    fs.readFileSync(f, "utf8")
      .split("\n")
      .forEach((line, i) => {
        for (const { rule, match } of findLiterals(line)) {
          n++;
          console.log(
            `${path.relative(process.argv[2], f)}:${i + 1}  ${rule}: ${match}`,
          );
        }
      });
  }
  console.log(n ? `${n} literal(s) found` : "literal lint: clean");
  process.exit(n ? 1 : 0);
}
