// Builds dist/ and reports/ from the vocabulary in spec.ts and the igniteui-theming engine.
// Usage: node src/make.ts
import fs from "node:fs";
import { hexToRgb } from "./color.ts";
import {
  actionOnColor,
  assertPairingsPass,
  compiledGuard,
  failingPairings,
  measuredContrast,
  ratioNotes,
  themePairs,
} from "./contrast.ts";
import { derivedColors } from "./derived.ts";
import { hexOf } from "./engine-colors.ts";
import { compiledLayout } from "./layout.ts";
import { fromRoot } from "./paths.ts";
import { semanticShadows, siteShadows, tintedElevations } from "./shadows.ts";
import { BREAKPOINT } from "./spec.ts";
import {
  baseCss,
  fontsCss,
  tokenDeclarations,
  tokensCss,
} from "./stylesheets.ts";
import { restOfPalette, themeCss } from "./theme.ts";
import {
  aliasTokens,
  alphaTokens,
  FONTS,
  gradients,
  paletteTokens,
  tokensJson,
} from "./tokens-json.ts";
import {
  defaultTypeScale,
  typeGroups,
  typeSetScales,
  typeSetStyles,
} from "./typography.ts";

const DIST = fromRoot("dist");
const REPORTS = fromRoot("reports");
const CACHE = fromRoot(".cache");
for (const dir of [DIST, `${DIST}/fonts`, REPORTS, CACHE])
  fs.mkdirSync(dir, { recursive: true });

/** Copies each face and its licence from its @fontsource-variable package to dist/fonts/. */
const copyFonts = () => {
  for (const font of FONTS) {
    const name = font.file.replace(/-latin-wght-normal\.woff2$/, "");
    const pkg = fromRoot("node_modules/@fontsource-variable", name);
    fs.copyFileSync(`${pkg}/files/${font.file}`, `${DIST}/fonts/${font.file}`);
    fs.copyFileSync(`${pkg}/LICENSE`, `${DIST}/fonts/${name}-LICENSE.txt`);
  }
};

/** The reference components' stylesheet with each {{breakpoint-*}} placeholder replaced by its pixel value. */
const referenceComponentsCss = () =>
  fs
    .readFileSync(fromRoot("reference/components.css"), "utf8")
    .replace(
      /\{\{(breakpoint-[a-z]+)\}\}/g,
      (_, name: string) => `${BREAKPOINT[name][0]}px`,
    );

const typeScale = defaultTypeScale();
const typeSets = typeSetScales();
const layout = compiledLayout();
const tintRgb = hexToRgb(hexOf("ig-primary-600"));
const tinted = tintedElevations(tintRgb);
const shadows = semanticShadows(siteShadows(), tinted, layout.elevations[20]);
copyFonts();

const guard = compiledGuard();
// The colours the build computes in place of the alias in the spec.
const published = { "color-action-on": actionOnColor(guard) };
const colorOf = (name: string) => hexOf(name, published);
const contrast = measuredContrast(colorOf);
const gradientTable = gradients(colorOf);

const tokens = tokensJson({
  colors: [
    ...paletteTokens(),
    ...aliasTokens(colorOf, published, ratioNotes(contrast)),
    ...alphaTokens(colorOf),
  ],
  typeGroups: typeGroups(typeScale),
  typeSets: typeSetStyles(typeSets),
  shadows,
  elevations: layout.elevations,
  tinted,
  gradients: gradientTable,
});
fs.writeFileSync(`${DIST}/tokens.json`, `${JSON.stringify(tokens, null, 2)}\n`);

const declarations = tokenDeclarations(tokens);
const tokensText = tokensCss(declarations);
fs.writeFileSync(`${DIST}/tokens.css`, tokensText);
fs.writeFileSync(`${DIST}/fonts.css`, fontsCss(FONTS));

const allDeclarations = [...declarations.themed, ...declarations.root];
const derived = derivedColors(allDeclarations);
fs.writeFileSync(
  `${REPORTS}/derived-states.json`,
  JSON.stringify(derived.record, null, 2),
);
const themeText = themeCss({
  rootDeclarations: layout.root,
  sized: layout.sized,
  typeScale,
  typeSets,
  adaptiveContrast: guard.adaptiveContrast,
  palette: restOfPalette(new Set(allDeclarations.map(([name]) => name))),
  tinted,
  tintRgb,
  shadows,
  elevationLevels: Object.keys(layout.elevations),
  gradients: gradientTable,
  derivedCss: derived.css,
});
fs.writeFileSync(`${DIST}/theme.css`, themeText);
fs.writeFileSync(`${DIST}/base.css`, baseCss());
fs.writeFileSync(`${CACHE}/components.css`, referenceComponentsCss());
fs.writeFileSync(
  `${REPORTS}/contrast-pairs.json`,
  JSON.stringify(themePairs()),
);

console.log(
  "tokens: colors",
  tokens.color.tokens.length,
  "| shadows",
  tokens.shadow.tokens.length,
  "| spacing",
  tokens.spacing.tokens.length,
  "| size",
  tokens.size.tokens.length,
);
console.log(
  "theme.css bytes",
  themeText.length,
  "| tokens.css bytes",
  tokensText.length,
);
console.log(
  "contrast checks:",
  contrast.length,
  "failing:",
  failingPairings(contrast).length,
);
assertPairingsPass(contrast);
