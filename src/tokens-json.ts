// Builds the content of dist/tokens.json: every token with its default value and its usage note.
import { hexToRgb } from "./color.ts";
import {
  isUnpublishedStep,
  LIGHT_PALETTE,
  SEED_FAMILIES,
  SHADE_FAMILIES,
  SURFACE_ROLES,
  unpublishedStepNote,
} from "./engine-colors.ts";
import type { ShadowEntry } from "./shadows.ts";
import { staticShadow, TINTED_LEVELS } from "./shadows.ts";
import * as spec from "./spec.ts";
import type { Font, Token, Tokens, TypeGroup, TypeSetStyle } from "./types.ts";
import { rem } from "./units.ts";

type ColorOf = (name: string) => string;

/** The three faces dist/fonts/ ships. Each file comes from the @fontsource-variable package of the same name. */
export const FONTS: Font[] = [
  {
    family: "Plus Jakarta Sans",
    file: "plus-jakarta-sans-latin-wght-normal.woff2",
    weight: "200 800",
    style: "normal",
  },
  {
    family: "DM Sans",
    file: "dm-sans-latin-wght-normal.woff2",
    weight: "100 1000",
    style: "normal",
  },
  {
    family: "JetBrains Mono",
    file: "jetbrains-mono-latin-wght-normal.woff2",
    weight: "100 800",
    style: "normal",
  },
];

/** The raw tier: every shade of the light palette, the seeds and the surface roles. */
export const paletteTokens = (): Token[] => {
  const shades = SHADE_FAMILIES.flatMap((family) =>
    Object.entries(LIGHT_PALETTE)
      // A shade of the family: <family>-<step> or <family>-A<step>.
      .filter(([step]) => new RegExp(`^${family}-A?\\d+$`).test(step))
      .map(([step, value]) => ({
        name: `ig-${step}`,
        value,
        usage: `Engine palette step \`${step.replace("-", " ")}\`, light variant. Each step is solved for contrast by igniteui-theming.`,
      })),
  );
  const seeds = SEED_FAMILIES.map((family) => ({
    name: `ig-${family}-seed`,
    value: LIGHT_PALETTE[`${family}-seed`],
    usage: `The exact seed colour the engine built the ${family} family from.`,
  }));
  const surfaces = SURFACE_ROLES.map((role) => ({
    name: `ig-surface-${role}`,
    value: LIGHT_PALETTE[`surface-${role}`],
    usage: `Engine surface role \`${role}\` (light variant).`,
  }));
  return [...shades, ...seeds, ...surfaces];
};

/** The semantic and component colours in ALIAS. A token on an unpublished step, or one the build computes, carries the colour itself. */
export const aliasTokens = (
  colorOf: ColorOf,
  published: Record<string, string>,
  ratioNotes: Record<string, string[]>,
): Token[] =>
  Object.entries(spec.ALIAS).map(([name, [step, usage]]) => ({
    name,
    value:
      published[name] ??
      (isUnpublishedStep(step) ? colorOf(step) : `{${step}}`),
    usage:
      usage +
      unpublishedStepNote(step) +
      (ratioNotes[name] ? ` Contrast ${ratioNotes[name].join(", ")}.` : ""),
  }));

const rgba = (colorOf: ColorOf, base: string, opacity: spec.OpacityName) => {
  const [r, g, b] = hexToRgb(colorOf(base));
  return `rgba(${r},${g},${b},${spec.OPACITY[opacity][0]})`;
};

/** The translucent colours in ALPHA, as rgba() at the default colours. */
export const alphaTokens = (colorOf: ColorOf): Token[] =>
  Object.entries(spec.ALPHA).map(([name, [base, opacity, usage]]) => ({
    name,
    value: rgba(colorOf, base, opacity),
    usage: `${usage} Live: \`${base}\` at \`${opacity}\`.`,
  }));

/** live is the value in theme.css, built on tokens; snapshot is the value in tokens.json. */
export type GradientEntry = { live: string; snapshot: string; usage: string };

type Glow = {
  base: string;
  opacity: spec.OpacityName;
  stop: number;
  usage: string;
};
// stop is where the glow reaches transparent, in percent of its radius.
const GLOWS: Record<string, Glow> = {
  "glow-brand": {
    base: "color-accent-brand",
    opacity: "opacity-muted",
    stop: 62,
    usage:
      "Ambient radial glow behind hero and section content, bleeding off the edges, `pointer-events:none`.",
  },
  "glow-ai": {
    base: "color-accent-ai",
    opacity: "opacity-muted",
    stop: 62,
    usage: "Ambient radial glow partnered with `glow-brand` on light sections.",
  },
  "glow-footer": {
    base: "color-accent-ai",
    opacity: "opacity-heavy",
    stop: 62,
    usage: "Footer glow only (top-right of the dark footer).",
  },
  "glow-inverse": {
    base: "tile-3",
    opacity: "opacity-muted",
    stop: 62,
    usage: "Ambient glow for the dark AI and enterprise bands only.",
  },
  "glow-inverse-partner": {
    base: "color-accent-inverse-2",
    opacity: "opacity-soft",
    stop: 68,
    usage: "Ambient glow for the dark AI and enterprise bands and the footer.",
  },
};

/** The gradients and glows, by token name, in the order tokens.json lists them. */
export const gradients = (colorOf: ColorOf): Record<string, GradientEntry> => ({
  "footer-background-gradient": {
    snapshot: `linear-gradient(155deg, ${colorOf("color-background-inverse-raised")} 0%, ${colorOf("ig-dark-surface-400")} 42%, ${colorOf("footer-background")} 100%)`,
    live: `linear-gradient(155deg, var(--color-background-inverse-raised) 0%, ${colorOf("ig-dark-surface-400")} 42%, var(--footer-background) 100%)`,
    usage:
      "The site footer’s own 155° gradient — one of the two dark surfaces in the system.",
  },
  "gradient-brand": {
    snapshot: `linear-gradient(92deg, ${colorOf("color-accent-brand")}, ${colorOf("color-accent-ai")})`,
    live: "linear-gradient(92deg, var(--color-accent-brand), var(--color-accent-ai))",
    usage:
      "The 92° blue→violet, clipped to one headline fragment per section. Never a background fill, button or tile.",
  },
  "gradient-hero": {
    snapshot: `linear-gradient(180deg, ${colorOf("color-background-subtle")}, ${colorOf("color-background-page")})`,
    live: "linear-gradient(180deg, var(--color-background-subtle), var(--color-background-page))",
    usage: "The hero wash behind the homepage hero.",
  },
  ...Object.fromEntries(
    Object.entries(GLOWS).map(([name, { base, opacity, stop, usage }]) => [
      name,
      {
        snapshot: `radial-gradient(circle, ${rgba(colorOf, base, opacity)}, transparent ${stop}%)`,
        live: `radial-gradient(circle, hsl(from var(--${base}) h s l / var(--${opacity})), transparent ${stop}%)`,
        usage,
      },
    ]),
  ),
});

export type TokenParts = {
  colors: Token[];
  typeGroups: TypeGroup[];
  typeSets: Record<string, TypeSetStyle[]>;
  shadows: Record<string, ShadowEntry>;
  /** The compiled neutral elevations, by level. */
  elevations: Record<string, string>;
  /** The compiled tinted elevations, by level. */
  tinted: Record<string, string>;
  gradients: Record<string, GradientEntry>;
};

/** The whole of tokens.json. */
export const tokensJson = (parts: TokenParts): Tokens => ({
  name: "Infragistics Design System",
  version: 2,
  color: { themes: [{ id: "light", name: "Light" }], tokens: parts.colors },
  type: {
    fonts: FONTS,
    families: spec.FAMILIES,
    fluid: spec.TYPE_FLUID_RANGE,
    sets: parts.typeSets,
    groups: parts.typeGroups,
  },
  spacing: {
    note: "Two tiers. Steps (space-3xs … space-6xl) are the raw scale; the name is a size, not a pixel value, and the live value comes from the engine's pad() in theme.css, following --ig-spacing and --ig-size. Roles (space-inset-*, space-stack-*, space-gap-*) say what the space is for and are what components use.",
    tokens: [
      ...Object.entries(spec.SPACE).map(([step, px]) => ({
        name: `space-${step}`,
        value: rem(px),
        usage: `Raw spacing step. ${px}px at the default density.`,
      })),
      ...Object.entries(spec.SPACE_ROLES).flatMap(([role, [usage, sizes]]) =>
        sizes.map((size) => ({
          name: `space-${role}-${size}`,
          value: `{space-${size}}`,
          usage,
        })),
      ),
    ],
  },
  radius: {
    note: "Live values are produced by the engine's border-radius() in theme.css and follow --ig-radius-factor (unset = as listed, 0 = each role\u2019s minimum, 1 = each role\u2019s maximum).",
    tokens: Object.entries(spec.RADIUS).map(
      ([name, [px, usage, min = 0, max = px]]) => ({
        name,
        value: rem(px),
        usage: `${usage} Range ${min}px to ${max}px.`,
      }),
    ),
  },
  size: {
    note: "Live values are produced by the engine's sizable() in theme.css and step down for --ig-size small and medium.",
    tokens: [
      ...Object.entries(spec.SIZE).map(([name, [px, usage]]) => ({
        name,
        value: rem(px),
        usage,
      })),
      ...Object.entries(spec.TRACKING).map(([name, [em, usage]]) => ({
        name,
        value: em,
        usage,
      })),
    ],
  },
  shadow: {
    note: "`shadow-card-hover`, `shadow-screenshot`, `shadow-floating`, `shadow-popover`, `shadow-panel` and `shadow-chip` are the shadows www.infragistics.com ships, compiled with the engine's box-shadow(). The rest are resolved from igniteui-theming elevations (indigo preset) at --ig-elevation-factor 1; tinted levels use the same preset with `color-background-action` as umbra, penumbra and ambient colour. theme.css keeps them live.",
    tokens: [
      ...Object.entries(parts.shadows).map(([name, { snapshot, usage }]) => ({
        name,
        value: snapshot,
        usage,
      })),
      ...Object.entries(parts.elevations).map(([level, shadow]) => ({
        name: `elevation-${level}`,
        value: level === "0" ? "none" : staticShadow(shadow),
        usage: `Engine elevation ${level}, indigo preset.`,
      })),
      ...TINTED_LEVELS.map((level) => ({
        name: `elevation-tint-${level}`,
        value: staticShadow(parts.tinted[level]),
        usage: `Engine elevation ${level}, indigo preset, tinted with \`action\`.`,
      })),
    ],
  },
  opacity: {
    note: "Alpha steps for translucent colours; combined with a colour token as hsl(from <colour> h s l / <opacity>).",
    tokens: Object.entries(spec.OPACITY).map(([name, [value, usage]]) => ({
      name,
      value: String(value),
      usage,
    })),
  },
  weight: {
    tokens: Object.entries(spec.WEIGHT).map(([name, weight]) => ({
      name,
      value: String(weight),
      usage: `Font weight ${weight}.`,
    })),
  },
  gradient: {
    note: "Gradients and ambient glows. Three uses only: clipped headline text, the hero wash and glows, and the footer.",
    tokens: Object.entries(parts.gradients).map(
      ([name, { snapshot, usage }]) => ({ name, value: snapshot, usage }),
    ),
  },
  breakpoint: {
    note: "The layout only changes at these four; the container is fluid between them.",
    tokens: Object.entries(spec.BREAKPOINT).map(([name, [px, usage]]) => ({
      name,
      value: `${px}px`,
      usage,
    })),
  },
  zIndex: {
    note: "Eight named layers — never write a raw z-index.",
    tokens: Object.entries(spec.ZINDEX).map(([name, [value, usage]]) => ({
      name,
      value: String(value),
      usage,
    })),
  },
});
