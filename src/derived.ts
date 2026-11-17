// Builds the derived-colour section of theme.css: each state colour as a formula on its base token.
import { hexToOklch } from "./color.ts";
import type { Declaration } from "./stylesheets.ts";
import { SCOPED } from "./theme.ts";

/** A state token and the base token it is derived from. */
const DERIVED: [token: string, base: string][] = [
  ["color-action-fill-hover", "color-action-default"],
  ["color-action-active", "color-action-default"],
  ["color-action-hover", "color-action-text"],
  ["color-link-utility", "color-action-text"],
  ["color-surface-tint", "color-action-default"],
  ["color-surface-tint-strong", "color-action-default"],
  ["color-border-accent", "color-action-default"],
  ["color-accent-primary-hover", "color-accent-primary"],
  ["color-accent-primary-active", "color-accent-primary"],
  ["color-link-inverse-hover", "color-link-inverse"],
  ["color-focus-inverse", "color-link-inverse"],
  ["footer-focus", "color-link-inverse"],
  ["footer-link-hover", "footer-link"],
  ["color-feedback-error-inverse", "color-feedback-error-default"],
  ["color-feedback-success-inverse", "color-feedback-success-default"],
  ["color-feedback-warning-inverse", "color-feedback-warning-default"],
  ["color-feedback-info-inverse", "color-feedback-info-default"],
  ["badge-bundle-background", "badge-bundle-color"],
  ["fw-angular-background", "fw-angular-color"],
  ["fw-angular-border", "fw-angular-color"],
  ["fw-react-background", "fw-react-color"],
  ["fw-react-border", "fw-react-color"],
  ["fw-blazor-background", "color-accent-secondary"],
  ["fw-blazor-border", "color-accent-secondary"],
  ["fw-webcomponents-background", "color-action-default"],
  ["fw-webcomponents-border", "color-action-default"],
  ["fw-winforms-background", "color-action-default"],
  ["fw-winforms-border", "color-action-default"],
  ["fw-wpf-background", "color-action-default"],
  ["fw-wpf-border", "color-action-default"],
  ["table-mark-partial-background", "table-mark-partial-color"],
  ["footer-heading", "footer-text"],
  ["footer-link", "footer-text"],
  ["footer-strong", "footer-text"],
  ["color-text-inverse-muted", "color-text-inverse"],
];
/** A token that equals its base token. */
const SAME_AS: [token: string, base: string][] = [
  ["table-header-sub-highlight-color", "color-action-on"],
  ["color-link-utility-hover", "color-action-text"],
  ["color-focus-default", "color-action-text"],
  ["tile-1", "color-accent-primary"],
  ["tile-2", "color-accent-secondary"],
  ["tile-7", "color-action-default"],
  ["color-link-inverse", "color-accent-inverse"],
  ["footer-icon", "footer-text"],
];

// The theme switch: 0 in the light theme, 1 under [data-theme="dark"].
const DARK = "var(--theme-dark)";
// A colour with less OKLCH chroma than this is a grey: it has no hue to carry over.
const GREY_CHROMA = 0.005;
// A text colour lighter than this OKLCH lightness is not given a ceiling.
const TEXT_MAX_LIGHTNESS = 0.6;
// A background, surface or border lighter than this OKLCH lightness keeps its own lightness.
const LIGHT_FILL_MIN_LIGHTNESS = 0.8;

/** An OKLCH lightness rounded up to four decimals. */
const ceiling = (lightness: number) => Math.ceil(lightness * 1e4) / 1e4;

/**
 * The colour `from` as text in both themes: no lighter than `maxLightness` in the light theme, no darker than 0.74 in the dark one.
 * Mirrored by as-text() in guardSass() in src/contrast.ts, which computes the published value.
 */
export const textFormula = (from: string, maxLightness: number) => {
  // Light theme: 0.6 darker for each unit of lightness above the ceiling, 0.35 at the lowest.
  const light = `min(l, max(0.35, ${maxLightness} - 0.6 * max(0, l - ${maxLightness})))`;
  // Dark theme: 0.74 at least, 0.6 lighter for each unit of lightness below it, 0.92 at the highest.
  const dark = "max(l, min(0.92, 0.74 + 0.6 * max(0, 0.74 - l)))";
  return `oklch(from ${from} calc((1 - ${DARK}) * ${light} + ${DARK} * ${dark}) calc(c * ((1 - ${DARK}) * ${light} / max(l, 0.0001) + ${DARK} * min(1, (1 - ${dark}) / max(1 - l, 0.0001)))) h)`;
};

/** The formula that turns the colour `baseHex` into `tokenHex`, as CSS on var(--base) and as a record for the report. */
export const stateFormula = (
  token: string,
  base: string,
  tokenHex: string,
  baseHex: string,
) => {
  const from = hexToOklch(baseHex);
  const to = hexToOklch(tokenHex);
  const hasHue = from.c > GREY_CHROMA;
  const lightnessDelta = (to.l - from.l).toFixed(4);
  const chromaRatio = hasHue ? (to.c / from.c).toFixed(4) : "1";
  // The hue difference, wrapped to the range from -180 to 180 degrees.
  const hueDelta =
    hasHue && to.c > GREY_CHROMA
      ? (((to.h - from.h + 540) % 360) - 180).toFixed(2)
      : "0";
  const keepsLightness =
    to.l > LIGHT_FILL_MIN_LIGHTNESS &&
    /(background|surface|border)/.test(token) &&
    hasHue;
  // The dark-theme lightness of a light fill: 0.2 plus 1.3 times its distance from white, 0.42 at the highest.
  const darkLightness = Math.min(0.42, 0.2 + (1 - to.l) * 1.3).toFixed(4);
  const source = `oklch(from var(--${base})`;
  let value: string;
  // A light fill takes 2.5 times the chroma in the dark theme.
  if (keepsLightness)
    value = `${source} calc((1 - ${DARK}) * ${to.l.toFixed(4)} + ${DARK} * ${darkLightness}) calc(c * ${chromaRatio} * (1 + 1.5 * ${DARK})) calc(h + ${hueDelta}))`;
  else if (hasHue)
    value = `${source} calc(l + ${lightnessDelta}) calc(c * ${chromaRatio}) calc(h + ${hueDelta}))`;
  else
    value = `${source} calc(l + ${lightnessDelta}) ${to.c.toFixed(4)} ${to.h.toFixed(2)})`;
  return {
    value,
    record: keepsLightness
      ? { base, l: +to.l.toFixed(4), kc: +chromaRatio, dh: +hueDelta }
      : { base, dl: +lightnessDelta, kc: +chromaRatio, dh: +hueDelta },
  };
};

/** Throws when a token listed as equal to its base has another colour in the engine. */
export const assertSameColor = (
  token: string,
  base: string,
  tokenValue: string,
  baseValue: string,
) => {
  if (tokenValue !== baseValue)
    throw new Error(`alias ${token} is not ${base} in the engine`);
};

// A reference to one custom property and nothing else: var(--name)
const VAR_ONLY = /^var\(--([a-z0-9-]+)\)$/;
// A reference to a brand ramp step or a seed, not to the gray, surface or dark ramps.
const BRAND_STEP = /^var\(--ig-(?!dark-|gray-|surface-)[a-z-]+-(?:\d+|seed)\)$/;
const HEX = /^#[0-9a-f]{6}$/;
// A token that is drawn as text: a text or link colour, a component's -color, or a feedback colour.
const TEXT_TOKEN =
  /^(color-text|color-link)|-color$|^color-feedback-[a-z]+-default$/;

/** The value a token has in tokens.css, following var() references to the end. Throws when a name is not declared. */
export const resolvedValue = (
  declared: Map<string, string>,
  name: string,
): string => {
  const value = declared.get(name);
  if (value === undefined) throw new Error(`no token ${name}`);
  const reference = value.trim().match(VAR_ONLY);
  return reference ? resolvedValue(declared, reference[1]) : value.trim();
};

/**
 * The derived-colour section and the record of each formula for reports/derived-states.json.
 * `declarations` are those of tokens.css, `accentStepTokens` the tokens that carry an accent palette colour,
 * `actionTextHex` the colour whose lightness is the ceiling of the action colour as text.
 */
export const derivedColors = (
  declarations: Declaration[],
  accentStepTokens: Set<string>,
  actionTextHex: string,
) => {
  const declared = new Map<string, string>();
  for (const [name, value] of declarations)
    if (!declared.has(name)) declared.set(name, value);
  const hexOfToken = (name: string) => resolvedValue(declared, name);
  const record: Record<string, object> = {};
  const lines: string[] = [];

  lines.push(
    "  /* semantic tokens that alias a ramp step, and the text colours taken from an accent palette */",
  );
  const derivedElsewhere = new Set([
    ...DERIVED.map(([token]) => token),
    ...SAME_AS.map(([token]) => token),
    "color-action-text",
  ]);
  for (const [name, value] of declarations) {
    const isStep = BRAND_STEP.test(value);
    if (
      !/^[a-z0-9-]+$/.test(name) ||
      name.startsWith("ig-") ||
      derivedElsewhere.has(name) ||
      !(isStep || (HEX.test(value) && accentStepTokens.has(name)))
    )
      continue;
    const own = hexToOklch(hexOfToken(name));
    const isText =
      TEXT_TOKEN.test(name) &&
      own.l < TEXT_MAX_LIGHTNESS &&
      own.c > GREY_CHROMA;
    if (isText)
      lines.push(`  --${name}: ${textFormula(value, ceiling(own.l))};`);
    else if (isStep) lines.push(`  --${name}: ${value};`);
  }

  lines.push(
    "  /* state tokens: derived from their base. Override a base and its states follow. */",
  );
  const actionTextMax = ceiling(hexToOklch(actionTextHex).l);
  lines.push(
    `  --color-action-text: ${textFormula("var(--color-action-default)", actionTextMax)};`,
  );
  record["color-action-text"] = {
    base: "color-action-default",
    maxL: actionTextMax,
  };
  for (const [token, base] of DERIVED) {
    const formula = stateFormula(
      token,
      base,
      hexOfToken(token),
      hexOfToken(base),
    );
    lines.push(`  --${token}: ${formula.value};`);
    record[token] = formula.record;
  }
  for (const [token, base] of SAME_AS) {
    assertSameColor(token, base, hexOfToken(token), hexOfToken(base));
    lines.push(`  --${token}: var(--${base});`);
    record[token] = { base, alias: true };
  }
  lines.push(
    "  /* label on the action fill: the engine's adaptive-contrast(), black or white by luminance at the WCAG AA threshold */",
    "  --color-action-on: hsla(from color(from var(--color-action-default) var(--y-contrast)) h 0 l / 1);",
  );
  const css = `
/* ===== 5. derived colour ===== */
/* everything below is re-declared on [data-ig-scope], so a region can carry its own base colours */
${SCOPED} {
${lines.join("\n")}
}
[data-ig="icon-tile"] { --tile-fill: var(--tile-1); --tile-on: hsla(from color(from var(--tile-fill) var(--y-contrast)) h 0 l / 1); }
`;
  return { css, record };
};
