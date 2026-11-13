// Gate: every var() points at a token that exists.
// node checks/check-vars.ts <tokens.css> <theme.css> <dir> [...]
import fs from "node:fs";
import path from "node:path";
import { isMain } from "../src/main.ts";
import { ENGINE_BARE } from "../src/namespace.ts";

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
  const defd = definedVars(
    fs.readFileSync(css1, "utf8") + fs.readFileSync(css2, "utf8"),
  );
  const files: string[] = [];
  const walk = (d: string): void => {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (/\.(jsx|html|css|mjs)$/.test(f)) files.push(p);
    }
  };
  dirs.forEach(walk);
  files.push(css2);
  const bad: Record<string, Set<string>> = {};
  for (const f of files)
    for (const n of undefinedVars(fs.readFileSync(f, "utf8"), defd)) {
      bad[n] ??= new Set();
      bad[n].add(path.basename(f));
    }
  for (const [k, v] of Object.entries(bad))
    console.log(`UNDEFINED --${k}`, [...v].slice(0, 3).join(","));
  console.log(
    Object.keys(bad).length
      ? `undefined vars: ${Object.keys(bad).length}`
      : "all var() references defined",
  );
}
