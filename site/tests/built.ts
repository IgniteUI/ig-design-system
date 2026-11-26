// Reads the built site in dist/ for the tests.
import fs from "node:fs";
import path from "node:path";

export const DIST = path.join(import.meta.dirname, "../dist");
export const ROOT = path.join(import.meta.dirname, "../..");

if (!fs.existsSync(path.join(DIST, "index.html")))
  throw new Error(
    "site/dist is not built. Run npm run build in site/ before the tests.",
  );

/** The HTML of a page, from its path from the site root, such as "tokens/". */
export const page = (route: string) =>
  fs.readFileSync(path.join(DIST, route, "index.html"), "utf8");

/** Every page of the built site, as its route from the site root. */
export const ROUTES = [
  "",
  "concepts/",
  "tokens/",
  "tokens/colour/",
  "tokens/type/",
  "tokens/spacing/",
  "tokens/radius/",
  "tokens/shadow/",
  "tokens/gradient/",
  "tokens/size/",
  "tokens/other/",
  "engine/",
  "logo/",
  "guide/",
  "guide/component/",
  "guide/rules/",
  "adopting/",
  "migration/",
  "changelog/",
];

/** The pages of the Guide, as their routes from the site root. */
export const GUIDE_ROUTES = [
  "guide/",
  "guide/component/",
  "guide/rules/",
  "adopting/",
  "migration/",
  "changelog/",
];

/** The family pages of Tokens, as their routes from the site root. */
export const TOKEN_ROUTES = ROUTES.filter((r) => /^tokens\/.+/.test(r));

/** The HTML of every family page of Tokens, joined, for a test about the tokens wherever they are listed. */
export const tokenPages = () => TOKEN_ROUTES.map((r) => page(r)).join("\n");

/** The text of a file in the repository. */
export const source = (file: string) =>
  fs.readFileSync(path.join(ROOT, file), "utf8");
