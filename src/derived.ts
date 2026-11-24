// Builds the derived-colour section of theme.css: each state colour as a formula on its base token.
import { hexToOklch } from "./color.ts";
import { ALIAS, type AliasEntry, DARK_STEP } from "./spec.ts";
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
// A state token: the same element under the pointer, pressed or focused.
const STATE = /-(?:hover|active|pressed|focus)$/;

/** The engine family a token reads through its aliases, such as "primary" for ig-primary-600; a dark palette counts as its light family. */
const familyOf = (
  name: string,
  alias: Record<string, AliasEntry>,
): string | undefined => {
  const seen = new Set<string>();
  let step: string | undefined = name;
  while (step && !step.startsWith("ig-") && !seen.has(step)) {
    seen.add(step);
    step = alias[step]?.[0];
  }
  return step?.match(/^ig-(?:dark-)?([a-z]+)-/)?.[1];
};

/**
 * The state tokens that read another engine family than their base, as error messages. A state of an element stays on
 * its base's scale, so a link that is primary is primary when hovered, pressed or focused.
 */
export const stateFamilyErrors = (
  pairs: [token: string, base: string][],
  alias: Record<string, AliasEntry>,
) =>
  pairs
    .filter(([token]) => STATE.test(token))
    .flatMap(([token, base]) => {
      const [own, of] = [familyOf(token, alias), familyOf(base, alias)];
      return own && of && own !== of
        ? [
            `${token} is a state of ${base} and reads the ${own} family, but ${base} reads ${of}. A state stays in the family of its base: alias ${token} to a step of ig-${of} in ALIAS in src/spec.ts.`,
          ]
        : [];
    });

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
// A background, surface or border lighter than this OKLCH lightness keeps its own lightness.
const LIGHT_FILL_MIN_LIGHTNESS = 0.8;

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
 * `declarations` are those of tokens.css.
 */
export const derivedColors = (declarations: Declaration[]) => {
  const familyErrors = stateFamilyErrors(DERIVED, ALIAS);
  if (familyErrors.length) throw new Error(familyErrors.join("\n"));
  const declared = new Map<string, string>();
  for (const [name, value] of declarations)
    if (!declared.has(name)) declared.set(name, value);
  const hexOfToken = (name: string) => resolvedValue(declared, name);
  const record: Record<string, object> = {};
  const lines: string[] = [];

  lines.push("  /* semantic tokens that alias a ramp step */");
  // A token in DARK_STEP is declared by the themes and inherited by a scope.
  const declaredElsewhere = new Set([
    ...DERIVED.map(([token]) => token),
    ...SAME_AS.map(([token]) => token),
    ...Object.keys(DARK_STEP),
  ]);
  for (const [name, value] of declarations)
    if (
      /^[a-z0-9-]+$/.test(name) &&
      !name.startsWith("ig-") &&
      !declaredElsewhere.has(name) &&
      BRAND_STEP.test(value)
    )
      lines.push(`  --${name}: ${value};`);

  lines.push(
    "  /* state tokens: derived from their base. Override a base and its states follow. */",
  );
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
/* derived colours, declared again on each scope and theme */
${SCOPED} {
${lines.join("\n")}
}
[data-ig="icon-tile"] { --tile-fill: var(--tile-1); --tile-on: hsla(from color(from var(--tile-fill) var(--y-contrast)) h 0 l / 1); }
`;
  return { css, record };
};
