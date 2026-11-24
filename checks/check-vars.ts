// Gate: every var() points at a token that exists, or at a custom property a checked stylesheet declares.
// node checks/check-vars.ts <tokens.css> <theme.css> <dir or file> [...]
import fs from "node:fs";
import path from "node:path";
import { isMain } from "../src/main.ts";
import { ENGINE_BARE } from "../src/namespace.ts";
import { walk } from "./walk.ts";

/** Names of the custom properties a stylesheet declares, without the leading `--`. */
export const definedVars = (css: string) =>
  new Set([...css.matchAll(/--([\w-]+)\s*:/g)].map((m) => m[1]));

/** Names read through var() that are not defined. Engine names and built-up names ending in `-` are skipped. */
export const undefinedVars = (text: string, defined: Set<string>) =>
  [...text.matchAll(/var\(--([\w-]+)/g)]
    .map((m) => m[1])
    .filter(
      (n) =>
        !defined.has(n) &&
        !n.startsWith("ig-") &&
        !ENGINE_BARE.includes(n) &&
        !n.endsWith("-"),
    );

if (isMain(import.meta.url)) {
  const [css1, css2, ...dirs] = process.argv.slice(2);
  const files = [
    ...dirs.flatMap((d) =>
      fs.statSync(d).isDirectory() ? walk(d, /\.(jsx|html|css|mjs)$/) : [d],
    ),
    css2,
  ];
  // A custom property a checked stylesheet declares itself is defined, beside the tokens.
  const defd = definedVars(
    [css1, ...files.filter((f) => f.endsWith(".css"))]
      .map((f) => fs.readFileSync(f, "utf8"))
      .join("\n"),
  );
  const bad: Record<string, Set<string>> = {};
  for (const f of files)
    for (const n of undefinedVars(fs.readFileSync(f, "utf8"), defd)) {
      bad[n] ??= new Set();
      bad[n].add(path.basename(f));
    }
  for (const [k, v] of Object.entries(bad))
    console.log(`UNDEFINED --${k}`, [...v].slice(0, 3).join(","));
  const count = Object.keys(bad).length;
  console.log(
    count ? `undefined vars: ${count}` : "all var() references defined",
  );
  process.exit(count ? 1 : 0);
}
