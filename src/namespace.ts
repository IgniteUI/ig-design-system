// node src/namespace.ts
// Publishes every token the design system defines as --igd-*. The engine's own output keeps the engine's names
// (--ig-primary-500, --ig-size, …), so an Ignite UI component on the page follows the same palette and dials.
// The generator works in bare names; this step is the single place where the published prefix is applied.
import fs from "node:fs";
import { isMain } from "./main.ts";

export const ENGINE = "ig";
export const PUBLISHED = "igd";
// Mirrors the custom properties the engine emits without its prefix: sizable() and adaptive-contrast().
export const ENGINE_BARE = [
  "component-size",
  "is-large",
  "is-medium",
  "is-small",
  "y",
  "y-contrast",
];
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
