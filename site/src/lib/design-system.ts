// The one door from the site to the package: its token data, its manifest and the facts the package's own generators share.

import tokensJson from "@root/dist/tokens.json";
import cardCss from "@root/docs/examples/card.css?raw";
import cardHtml from "@root/docs/examples/card.html?raw";
import manifest from "@root/package.json";
import type { Tokens } from "@root/src/types.ts";

export { CHECKS, NOT_CHECKED } from "@root/checks/rules.ts";
export {
  EMPHASIS,
  EXAMPLES,
  NEW_NAME_STEPS,
  NOT_USED,
  PARTS,
  PROPERTIES,
  STATES,
} from "@root/src/naming.ts";
export { RULES } from "@root/src/rules.ts";

export type { Token, Tokens, TypeStyle } from "@root/src/types.ts";
export {
  checkCommand,
  DIALS,
  installCommand,
  STYLESHEETS,
} from "@root/src/usage.ts";

/** Every token, as dist/tokens.json lists them. */
export const tokens = tokensJson as unknown as Tokens;

/** The example card of the package: its stylesheet and its page, as docs/examples holds them. */
export const CARD_CSS: string = cardCss;
export const CARD_HTML: string = cardHtml;

/** The name of the npm package. */
export const packageName: string = manifest.name;

/** The version of the npm package. */
export const packageVersion: string = manifest.version;

/** The URL of the repository, without the git+ prefix and the .git suffix. */
export const repository: string = manifest.repository.url
  .replace(/^git\+/, "")
  .replace(/\.git$/, "");

// Mirrors ENGINE and PUBLISHED in src/namespace.ts of the package.
const ENGINE = "ig";
const PUBLISHED = "igd";

/** The custom property of a token name: engine names keep theirs, the rest get the published prefix. */
export const cssVar = (name: string) =>
  name.startsWith(`${ENGINE}-`) ? `--${name}` : `--${PUBLISHED}-${name}`;

/** The prefix of a custom property, such as "--igd-", which a token name shows dimmed. */
export const prefixOf = (property: string) =>
  property.match(/^--igd?-/)?.[0] ?? "--";
