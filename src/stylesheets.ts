// Builds the text of tokens.css, fonts.css and base.css.
import { FAMILIES } from "./spec.ts";
import { type Font, TOKEN_FAMILIES, type Tokens } from "./types.ts";

export type Declaration = [name: string, value: string];

/** A token value as CSS: a `{name}` reference becomes `var(--name)`. */
const cssValue = (value: string) =>
  /^\{(.+)\}$/.test(value) ? `var(--${value.slice(1, -1)})` : value;

// The families tokens.css declares on :root; colours and shadows go in the light theme block.
const ROOT_FAMILIES = TOKEN_FAMILIES.filter(
  (family) => family !== "color" && family !== "shadow",
);

/** The declarations of tokens.css: those of the light theme, then those of :root. */
export const tokenDeclarations = (tokens: Tokens) => {
  const themed: Declaration[] = [
    ...tokens.color.tokens,
    ...tokens.shadow.tokens,
  ].map((t) => [t.name, cssValue(t.value)]);
  const root: Declaration[] = [
    ...ROOT_FAMILIES.flatMap((family) =>
      tokens[family].tokens.map(
        (t): Declaration => [t.name, cssValue(String(t.value))],
      ),
    ),
    ...Object.entries(FAMILIES).map(
      ([name, stack]): Declaration => [`font-${name}`, stack],
    ),
  ];
  return { themed, root };
};

const block = (declarations: Declaration[]) =>
  declarations.map(([name, value]) => `  --${name}: ${value};\n`).join("");

/** The text of tokens.css, before the --igd- prefix is applied. */
export const tokensCss = (declarations: {
  themed: Declaration[];
  root: Declaration[];
}) =>
  `/* Infragistics Design System — generated from tokens.json */\n\n:root, [data-theme="light"] {\n${block(declarations.themed)}}\n\n:root {\n${block(declarations.root)}}\n`;

/** The text of fonts.css: one @font-face for each face in dist/fonts/. */
export const fontsCss = (fonts: Font[]) =>
  `/* Infragistics Design System — fonts.css\n   Optional. Loads the faces --igd-font-display, --igd-font-body and --igd-font-mono name, from dist/fonts/.\n   A site that already loads Plus Jakarta Sans, DM Sans and JetBrains Mono leaves it out. */\n\n${fonts.map((f) => `@font-face { font-family: '${f.family}'; src: url('fonts/${f.file}') format('woff2'); font-weight: ${f.weight}; font-style: ${f.style}; font-display: swap; }`).join("\n")}\n`;

/** The text of base.css: element styles built on the tokens. */
export const baseCss = () => `/* Infragistics Design System — base.css
   Optional. Element styles built on the tokens: the page, headings, links, code and keyboard focus.
   Load it after theme.css on a site that has no element styles of its own. A site with its own, such as a docs site, leaves it out. */

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--color-surface-page);
  font-family: var(--font-body);
  font-size: var(--type-body-md-font-size);
  line-height: var(--type-body-md-line-height);
  color: var(--color-text-primary);
  text-wrap: pretty;
}
a { color: var(--color-action-text); text-decoration: none; }
a:hover { color: var(--color-action-hover); }
h1, h2, h3, h4, h5, h6 { font-family: var(--font-display); color: var(--color-text-heading); margin: 0; }
code, pre { font-family: var(--font-mono); }

/* Keyboard focus. Mouse users never see this; keyboard users always do.
   Add data-on-dark to any dark section so the ring stays visible. */
:focus { outline: none; }
a:focus-visible, button:focus-visible, [tabindex]:focus-visible,
input:focus-visible, select:focus-visible, textarea:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-default);
  outline-offset: var(--focus-ring-offset);
}
[data-on-dark] a:focus-visible, [data-on-dark] button:focus-visible,
[data-on-dark] [tabindex]:focus-visible {
  outline-color: var(--color-focus-inverse);
}
`;
