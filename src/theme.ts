// Builds the text of theme.css: the engine layer, the live tokens, the type roles, the keyframes and the themes.
import {
  DARK_PALETTE,
  hexOf,
  isUnpublishedStep,
  SURFACE_ROLES,
} from "./engine-colors.ts";
import { type Rule, sectionSpace } from "./layout.ts";
import { sets } from "./palette-sets.ts";
import { compile } from "./sass.ts";
import {
  type ShadowEntry,
  TINTED_LEVELS,
  withActionColorToken,
  withShadowColorToken,
} from "./shadows.ts";
import { ALIAS, ALPHA, BREAKPOINT, DARK_STEP, TYPE } from "./spec.ts";
import type { GradientEntry } from "./tokens-json.ts";
import { isEngineSlot, type TypeScale } from "./typography.ts";

/** The selector of a block that a scope or a themed region declares again. */
export const SCOPED = ":root, [data-ig-scope], [data-theme]";

const HEADER = `/* Infragistics Design System — theme.css
   Loaded after tokens.css. This file is the live layer of the igniteui-theming engine:
   1. the engine's own variables (--ig-*): sizing, spacing, roundness, elevations, typography, contrast;
   2. the tokens that must stay live — spacing, sizes, radii, shadows, gradients, translucent colours —
      declared again with the same names as tokens.json, so --ig-size, --ig-spacing, --ig-radius-factor,
      --ig-elevation-factor and palette edits cascade. At the default dial values they equal tokens.json;
   3. the semantic type variables and classes (.igd-type-<role>), motion and keyframes.
   Element styles (body, headings, links, focus) are in base.css.
   Nothing in a component may carry a literal colour, length, font size, shadow or radius: it reads a token. */
`;

const SLOT_PROPERTIES = [
  "font-size",
  "font-weight",
  "font-style",
  "line-height",
  "letter-spacing",
  "text-transform",
];
const ROLE_PROPERTIES = [
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "text-transform",
];
const SET_PROPERTIES = ROLE_PROPERTIES.filter((p) => p !== "font-family");

/** The engine's type slot variables, for the slots the engine has. */
const slotVariables = (scale: TypeScale) =>
  TYPE.filter((row) => isEngineSlot(row.slot))
    .flatMap((row) => [
      `  --ig-${row.slot}-font-family: var(--font-${row.family});\n`,
      ...SLOT_PROPERTIES.map(
        (p) => `  --ig-${row.slot}-${p}: ${scale[row.slot][p]};\n`,
      ),
    ])
    .join("");

/**
 * The custom properties the engine's palette() emits for the light palette and tokens.css does not declare.
 * `declared` holds the names tokens.css declares.
 */
export const restOfPalette = (declared: Set<string>) => {
  const rest = [
    ...compile(
      `@use 'igniteui-theming' as *;\n$p: ${sets.light};\n@include palette($p);\n`,
    ).matchAll(/^\s*--(ig-[\w-]+): ([^;]+);/gm),
  ]
    .map(([, name, value]) => ({ name, value }))
    // Leaves out the WCAG threshold and contrast-level variables.
    .filter(
      (d) => !declared.has(d.name) && !/^ig-(wcag|contrast-level)/.test(d.name),
    );
  if (!rest.some((d) => d.name === "ig-primary-500-contrast"))
    throw new Error("palette(): no contrast variables emitted");
  return rest;
};

type EngineLayer = {
  /** The declarations of the compiled :root rules: the easing. */
  rootDeclarations: string;
  /** The compiled rule that reads the dials: sizable(), pad(), border-radius() and the neutral elevations. */
  dialed: Rule;
  typeScale: TypeScale;
  /** The declarations adaptive-contrast('aa') emits. */
  adaptiveContrast: string[];
  palette: { name: string; value: string }[];
  /** The compiled tinted elevations, by level, and the colour they are tinted with. */
  tinted: Record<string, string>;
  tintRgb: number[];
};

const engineLayer = (layer: EngineLayer) => `
/* ===== 1. igniteui-theming engine layer ===== */
:root {
  /* The dials are left unset, so a site sets them for itself. Unset, the tokens resolve at their design values: --ig-size large, --ig-spacing 1, --ig-elevation-factor 1, and each radius role at its own value (--ig-radius-factor from 0, each role's minimum, to 1, its maximum). */
  /* one shadow colour behind every neutral elevation */
  --color-shadow: oklch(0 0 0);
  /* easing: compiled from the engine's easings */
${layer.rootDeclarations}
  /* typography: engine slot variables, compiled from the engine's typography() with the type scale in spec.ts */
  --ig-font-family: var(--font-body);
${slotVariables(layer.typeScale)}}
/* contrast colours, exactly as the engine's palette() emits them */
:root, [data-theme] {
${layer.adaptiveContrast.map((d) => `  ${d}`).join("\n")}
}
/* the rest of the engine's palette(): contrast colours, accent shades, surface shades and seeds */
${SCOPED} {
${layer.palette.map((d) => `  --${d.name}: ${d.value};`).join("\n")}
}
/* sizing, spacing, roundness and neutral elevations: compiled from the engine's sizable(), pad(), border-radius() and elevations() */
${layer.dialed.selector} {
${withShadowColorToken(layer.dialed.body)}
}
/* elevations tinted with the action colour: the engine's indigo preset compiled with its $color-1..3, published under the design system's own names */
${SCOPED} {
${TINTED_LEVELS.map((level) => `  --elevation-tint-${level}: ${withActionColorToken(layer.tinted[level], layer.tintRgb)};`).join("\n")}
}
`;

type LiveTokens = {
  shadows: Record<string, ShadowEntry>;
  /** The neutral elevation levels. */
  elevationLevels: string[];
  gradients: Record<string, GradientEntry>;
};

const liveTokens = ({ shadows, elevationLevels, gradients }: LiveTokens) => `
/* ===== 2. live tokens (same names as tokens.json) ===== */
${SCOPED} {
${[
  ...Object.entries(shadows).map(([name, { live }]) => `  --${name}: ${live};`),
  ...elevationLevels.map(
    (level) => `  --elevation-${level}: var(--ig-elevation-${level});`,
  ),
  ...Object.entries(gradients).map(
    ([name, { live }]) => `  --${name}: ${live};`,
  ),
  ...Object.entries(ALPHA).map(
    ([name, [base, opacity]]) =>
      `  --${name}: hsl(from var(--${base}) h s l / var(--${opacity}));`,
  ),
].join("\n")}
  --gradient-border-bundle: linear-gradient(var(--color-surface-card), var(--color-surface-card)) padding-box, linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary)) border-box;
  --gradient-emphasis: linear-gradient(180deg, hsl(from var(--color-accent-primary) h s l / var(--opacity-subtle)), hsl(from var(--color-accent-inverse) h s l / var(--opacity-faint)));
  --footer-card-background: linear-gradient(180deg, hsl(from var(--color-text-inverse) h s l / var(--opacity-faint)), transparent);
  --container-gutter: clamp(var(--space-lg), 4vw, var(--space-4xl)); /* @kind spacing */
  --space-section: ${sectionSpace()}; /* @kind spacing */
  --layout-split: 0.95fr 1.05fr; /* @kind other */
  --nav-backdrop-blur: blur(var(--space-sm));
}
`;

/** The variable a role property reads: its engine slot, or the compiled value when the engine has no slot for it. */
const roleValue = (
  row: (typeof TYPE)[number],
  property: string,
  scale: TypeScale,
) => {
  if (isEngineSlot(row.slot)) return `var(--ig-${row.slot}-${property})`;
  return property === "font-family"
    ? `var(--font-${row.family})`
    : scale[row.slot][property];
};

const typeSet = (set: string, scale: TypeScale) =>
  `/* type set "${set}": the same roles at other sizes. Put data-igd-type="${set}" on the page, or on a region. */\n[data-igd-type="${set}"] {\n${TYPE.flatMap(
    (row) =>
      SET_PROPERTIES.map(
        (p) =>
          `  --${isEngineSlot(row.slot) ? `ig-${row.slot}` : `type-${row.name}`}-${p}: ${scale[row.slot][p]};\n`,
      ),
  ).join("")}}\n`;

const motionAndType = (
  typeScale: TypeScale,
  typeSets: Record<string, TypeScale>,
) => `
/* ===== 3. motion, type variables and classes ===== */
:root {
  /* motion */
  --duration-chip: 140ms;
  --duration-fast: 160ms;
  --duration-button: 180ms;
  --duration-slow: 320ms;
  --duration-float: 5000ms;
  --duration-spin: 800ms;
  --easing-linear: linear;
  --transition-default: all var(--duration-fast) var(--easing-default);
}
/* type roles, declared again on a region that picks a type set */
:root, [data-igd-type] {
${TYPE.flatMap((row) =>
  ROLE_PROPERTIES.map(
    (p) => `  --type-${row.name}-${p}: ${roleValue(row, p, typeScale)};\n`,
  ),
).join("")}}
${TYPE.map(
  (row) =>
    `.igd-type-${row.name} { ${ROLE_PROPERTIES.map((p) => `${p}: var(--type-${row.name}-${p});`).join(" ")} }\n`,
).join("")}${Object.entries(typeSets)
  .map(([set, scale]) => typeSet(set, scale))
  .join("")}`;

const KEYFRAMES_AND_UTILITIES = `
/* ===== 4. keyframes and utility classes ===== */
@keyframes igd-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(calc(-1 * var(--space-xs))); }
}
@keyframes igd-app-shimmer {
  0%, 100% { filter: drop-shadow(0 var(--space-xs) var(--space-md) hsl(from var(--color-accent-primary) h s l / var(--opacity-heavy))); opacity: 1; }
  50%      { filter: drop-shadow(0 var(--space-xs) var(--space-xl) hsl(from var(--color-accent-inverse) h s l / var(--opacity-heavy))); opacity: 1; }
}

/* Breakpoints (media queries cannot read custom properties; generated from tokens.json breakpoint family) */
@media (max-width: ${BREAKPOINT["breakpoint-md"][0]}px) { .igd-hide-below-md { display: none !important; } }
`;

const GRAY_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

/** The light and dark themes. The dark theme sets the gray ramp and the surface roles to the dark palette's values, and each text token in DARK_STEP to its dark step. */
const themes = () => {
  const neutralRoles = Object.entries(ALIAS).filter(
    ([name, [step]]) =>
      /^ig-(gray|surface)-/.test(step) && name !== "color-action-on",
  );
  return `
/* ===== 6. themes ===== */
:root, [data-theme="light"] { --theme-dark: 0; }
[data-theme="light"] { color-scheme: light; }
/* neutral roles, declared again so a themed region or a scope resolves them against its own grey and surface ramps */
${SCOPED} {
${neutralRoles.map(([name, [step]]) => `  --${name}: var(--${step});`).join("\n")}
}
/* dark: the light grey and surface ramps are swapped for the engine's dark palette (palette() with a dark surface and a light grey).
   Every semantic name keeps its meaning. Brand fills keep the seed; text in a brand or status colour reads a lighter engine step; tints and hairlines switch through --theme-dark. */
[data-theme="dark"] {
  --theme-dark: 1; color-scheme: dark;
${[
  ...GRAY_STEPS.map(
    (step) => `  --ig-gray-${step}: ${DARK_PALETTE[`gray-${step}`]};`,
  ),
  ...SURFACE_ROLES.map(
    (role) => `  --ig-surface-${role}: ${DARK_PALETTE[`surface-${role}`]};`,
  ),
  // A step of an unpublished palette is written as its colour.
  ...Object.entries(DARK_STEP).map(
    ([name, step]) =>
      `  --${name}: ${isUnpublishedStep(step) ? hexOf(step) : `var(--${step})`};`,
  ),
].join("\n")}
}
[data-theme] { background-color: var(--color-surface-page); color: var(--color-text-primary); }
`;
};

export type ThemeParts = EngineLayer &
  LiveTokens & {
    typeSets: Record<string, TypeScale>;
    /** The derived-colour section, built by derivedColors(). */
    derivedCss: string;
  };

/** The text of theme.css, before the --igd- prefix is applied. */
export const themeCss = (parts: ThemeParts) =>
  HEADER +
  engineLayer(parts) +
  liveTokens(parts) +
  motionAndType(parts.typeScale, parts.typeSets) +
  KEYFRAMES_AND_UTILITIES +
  parts.derivedCss +
  themes();
