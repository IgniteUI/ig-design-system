#!/usr/bin/env node
// Checks a site against the design system.
// Usage: ig-design-system check <dir or file> [...] [--ignore <text>] [--strict]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CHECKS, SOURCES } from "./rules.ts";
import { checkText, declaredNames } from "./site.ts";
import { walk } from "./walk.ts";

const SKIPPED = new Set(["node_modules", "dist", ".astro", ".git", "build"]);

const HELP = `ig-design-system check <dir or file> [...] [--ignore <text>] [--strict]

Rules:
${CHECKS.map((c) => `  ${c.id.padEnd(18)}${c.reports}${c.strict ? " (only with --strict)" : ""}`).join("\n")}

Options:
  --ignore <text>   skip every path that contains <text>; repeat it for more
  --strict          also report colour literals
`;

/** The stylesheets of the package, beside the compiled command or under dist/ in the repository. */
const packageCss = () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  for (const dir of [path.join(here, "../.."), path.join(here, "../dist")]) {
    const files = ["tokens.css", "theme.css"].map((f) => path.join(dir, f));
    if (files.every((f) => fs.existsSync(f)))
      return files.map((f) => fs.readFileSync(f, "utf8")).join("\n");
  }
  throw new Error(
    "tokens.css and theme.css were not found beside the command. Reinstall ig-design-system.",
  );
};

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

const [command, ...rest] = process.argv.slice(2);
if (!command || command === "--help" || rest.includes("--help")) {
  console.log(HELP);
  process.exit(0);
}
if (command !== "check")
  fail(`Unknown command "${command}". The only command is check.\n\n${HELP}`);

const ignore: string[] = [];
const targets: string[] = [];
let strict = false;
for (let i = 0; i < rest.length; i++) {
  const arg = rest[i];
  if (arg === "--strict") strict = true;
  else if (arg === "--ignore" || arg.startsWith("--ignore=")) {
    const text = arg === "--ignore" ? rest[++i] : arg.slice("--ignore=".length);
    if (!text || text.startsWith("--"))
      fail("--ignore needs a value, for example --ignore src/vendor.");
    ignore.push(text);
  } else if (arg.startsWith("--"))
    fail(`Unknown option ${arg}. Valid options: --ignore, --strict, --help.`);
  else targets.push(arg);
}
if (!targets.length)
  fail(
    "Nothing to check. Pass a directory or a file, for example: ig-design-system check src.",
  );

const skipped = (p: string) =>
  SKIPPED.has(path.basename(p)) || ignore.some((text) => p.includes(text));
const files = targets.flatMap((t) => {
  if (!fs.existsSync(t)) fail(`${t} does not exist.`);
  return walk(t, SOURCES, skipped);
});
if (!files.length)
  fail(
    `No source file to check under ${targets.join(", ")}. Check the path and the --ignore values; the command reads ${SOURCES.source
      .replace(/^\\\.\(|\)\$$/g, "")
      .split("|")
      .join(", ")} files.`,
  );

const texts = new Map(files.map((f) => [f, fs.readFileSync(f, "utf8")]));
const known = declaredNames(packageCss());
for (const text of texts.values())
  for (const name of declaredNames(text)) known.add(name);

let count = 0;
for (const [file, text] of texts)
  for (const f of checkText(text, known, strict)) {
    count++;
    console.log(`${file}:${f.line}  ${f.rule}: ${f.message}`);
  }
console.log(
  count
    ? `ig-design-system check: ${count} finding(s) in ${files.length} files`
    : `ig-design-system check: pass (${files.length} files)`,
);
process.exit(count ? 1 : 0);
