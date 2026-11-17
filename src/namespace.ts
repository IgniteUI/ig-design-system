// Adds the --igd- prefix to every custom property in dist/*.css that is not engine output.
// Usage: node src/namespace.ts
import fs from "node:fs";
import { isMain } from "./main.ts";

export const ENGINE = "ig";
export const PUBLISHED = "igd";
// Mirrors the custom properties the engine's adaptive-contrast() emits without its prefix.
export const ENGINE_BARE = ["y", "y-contrast"];
const own = new RegExp(
  `(?<![\\w-])--(?!${ENGINE}-|${PUBLISHED}-|(?:${ENGINE_BARE.join("|")})(?![\\w-]))(?=[a-z])`,
  "g",
);

/** Adds the published prefix to every custom property that is not engine output. */
export const ns = (t: string) => t.replace(own, `--${PUBLISHED}-`);

/** The custom property of a token name: engine names keep theirs, the rest get the published prefix. */
export const cssVar = (name: string) =>
  name.startsWith(`${ENGINE}-`) ? `--${name}` : `--${PUBLISHED}-${name}`;

if (isMain(import.meta.url)) {
  let n = 0;
  for (const f of ["dist/tokens.css", "dist/theme.css", "dist/base.css"]) {
    const t = fs.readFileSync(f, "utf8");
    const u = ns(t);
    if (u !== t) {
      fs.writeFileSync(f, u);
      n++;
    }
  }
  console.log(
    `namespace: design system tokens published as --${PUBLISHED}-* in ${n} file(s)`,
  );
}
