// Compiles the site shadows and the tinted elevations, and lists every semantic shadow with its live and its static value.
import { hexToRgb } from "./color.ts";
import { hexOf } from "./engine-colors.ts";
import { elevationsOf } from "./layout.ts";
import { compile } from "./sass.ts";
import { OPACITY, type OpacityName, SHADOW } from "./spec.ts";

/** live is the value in theme.css, which follows the dials; snapshot is the value in tokens.json. */
export type ShadowEntry = { live: string; snapshot: string; usage: string };

/** The tinted elevation levels a semantic shadow reads. */
export const TINTED_LEVELS = [1, 13, 16];

/** The engine's indigo elevations with `rgb` as umbra, penumbra and ambient colour, by level. */
export const tintedElevations = (rgb: number[]) => {
  const tint = rgb.join(" ");
  return elevationsOf(
    compile(
      `@use 'igniteui-theming/sass/elevations' as e;\n@use 'igniteui-theming/sass/elevations/presets/indigo' as tinted with ($color-1: rgb(${tint} / 0.26), $color-2: rgb(${tint} / 0.12), $color-3: rgb(${tint} / 0.08));\n:root { @include e.elevations(tinted.$elevations); }\n`,
    ),
  );
};

/** The Sass source that passes each shadow in SHADOW through the engine's box-shadow(). */
export const siteShadowsSass = () => {
  const tints: Record<string, string> = {
    "color-shadow": "0, 0, 0",
    "color-surface-inverse": hexToRgb(hexOf("color-surface-inverse")).join(
      ", ",
    ),
  };
  const declarations = Object.entries(SHADOW).map(([name, layers]) => {
    const list = layers
      .map(
        ([y, blur, spread, tint, alpha]) =>
          `0 ${y}px ${blur}px ${spread}px rgba(${tints[tint]}, ${alpha})`,
      )
      .join(", ");
    // A trailing comma makes a single layer a Sass list.
    return `  --${name}: #{e.box-shadow((${list}${layers.length === 1 ? "," : ""}))};`;
  });
  return `@use 'igniteui-theming/sass/elevations' as e;\n:root {\n${declarations.join("\n")}\n}\n`;
};

// A shadow variable of the site shadows stylesheet: --shadow-<name>: <shadow>;
const SHADOW_VARIABLE = /--(shadow-[\w-]+): ([^;]+);/g;

/** The compiled value of each shadow in SHADOW, by token name. */
export const siteShadows = () => {
  const shadows: Record<string, string> = {};
  for (const [, name, value] of compile(siteShadowsSass()).matchAll(
    SHADOW_VARIABLE,
  ))
    shadows[name] = value;
  return shadows;
};

// A length the engine multiplies by the elevation dial: calc(var(--ig-elevation-factor, 1) * <n>px)
const FACTORED_LENGTH =
  /calc\(var\(--ig-elevation-factor, 1\) \* (-?[\d.]+)px\)/g;

// A factored length, with its number captured, or a colour.
const LAYER_PART =
  /calc\(var\(--ig-elevation-factor, 1\) \* (-?[\d.]+)px\)|rgba\([^)]*\)/g;

/** A compiled shadow at --ig-elevation-factor 1, with plain lengths and compact colours. */
export const staticShadow = (shadow: string) =>
  shadow
    .replace(FACTORED_LENGTH, (_, n: string) => (+n === 0 ? "0" : `${n}px`))
    .replace(/rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/g, "rgba($1,$2,$3,$4)")
    .replace(/ 0px/g, " 0");

/** Rewrites the black the engine compiles into a shadow as the color-shadow token at the same alpha. */
export const withShadowColorToken = (shadow: string) =>
  shadow.replace(
    /rgba\(0, ?0, ?0, ?([\d.]+)\)/g,
    "hsl(from var(--color-shadow) h s l / $1)",
  );

/** Rewrites the colour `rgb` in a compiled tinted elevation as the action colour token at the same alpha. */
export const withActionColorToken = (shadow: string, rgb: number[]) =>
  shadow.replace(
    new RegExp(`rgba\\(${rgb.join(", ")}, ([\\d.]+)\\)`, "g"),
    "hsl(from var(--color-action-default) h s l / $1)",
  );

/** The layers of a compiled elevation as drop-shadow() functions, live and static. The spread is dropped. */
export const dropShadows = (elevation: string) => {
  // Each layer starts with a zero x offset; its lengths and its colour follow in order: y, blur, spread, colour.
  const layers = elevation.split(/, (?=0 )/).map((layer) => {
    const parts = [...layer.matchAll(LAYER_PART)];
    return {
      y: parts[0][0],
      blur: parts[1][0],
      yPx: parts[0][1],
      blurPx: parts[1][1],
      color: parts[3][0].replace(/, /g, ","),
    };
  });
  return {
    live: layers
      .map((l) => `drop-shadow(0 ${l.y} ${l.blur} ${l.color})`)
      .join(" "),
    snapshot: layers
      .map((l) => `drop-shadow(0 ${l.yPx}px ${l.blurPx}px ${l.color})`)
      .join(" "),
  };
};

const ringOf = (opacity: OpacityName) => {
  const [r, g, b] = hexToRgb(hexOf("color-accent-primary"));
  return `rgba(${r},${g},${b},${OPACITY[opacity][0]})`;
};

/** Every semantic shadow, by token name, in the order tokens.json lists them. */
export const semanticShadows = (
  site: Record<string, string>,
  tinted: Record<string, string>,
  panelElevation: string,
): Record<string, ShadowEntry> => {
  const siteShadow = (name: string, usage: string): ShadowEntry => ({
    live: withShadowColorToken(site[name]),
    snapshot: staticShadow(site[name]),
    usage,
  });
  const tintedShadow = (level: number, usage: string): ShadowEntry => ({
    live: `var(--elevation-tint-${level})`,
    snapshot: staticShadow(tinted[level]),
    usage,
  });
  const filter = dropShadows(panelElevation);
  return {
    "shadow-none": {
      live: "var(--ig-elevation-0)",
      snapshot: "none",
      usage:
        "Cards at rest — flat; a card is defined by its hairline `color-border-default`. Engine elevation 0.",
    },
    "shadow-raised": siteShadow(
      "shadow-raised",
      "Card hover: cards lift shadow only, no translate or scale.",
    ),
    "shadow-accent-lg": tintedShadow(
      16,
      "Primary CTA and its hover (no shadow change on hover). Engine elevation 16 tinted with `color-action-default`.",
    ),
    "shadow-accent-sm": tintedShadow(
      1,
      "Framework pill hover — the only hover change on a pill. Engine elevation 1 tinted with `color-action-default`.",
    ),
    "shadow-overlay": siteShadow(
      "shadow-overlay",
      "Screenshots inside a BrowserFrame.",
    ),
    "shadow-floating": siteShadow("shadow-floating", "Floating stat badges."),
    "shadow-accent-md": tintedShadow(
      13,
      "Bundle cards with the gradient border. Engine elevation 13 tinted with `color-action-default`.",
    ),
    "callout-release-shadow": {
      live: "inset 0 0 0 var(--border-width-default) var(--color-emphasis-ring), var(--elevation-tint-13)",
      snapshot: `inset 0 0 0 1px ${ringOf("opacity-soft")}, ${staticShadow(tinted[13])}`,
      usage:
        "Release strip at rest. Engine elevation 13 tinted with `color-action-default`.",
    },
    "callout-release-shadow-hover": {
      live: "inset 0 0 0 var(--border-width-default) var(--color-emphasis-ring-hover), var(--elevation-tint-16)",
      snapshot: `inset 0 0 0 1px ${ringOf("opacity-strong")}, ${staticShadow(tinted[16])}`,
      usage:
        "Release strip on hover. Engine elevation 16 tinted with `color-action-default`.",
    },
    "shadow-glass": siteShadow(
      "shadow-glass",
      "Dark glass chips over a screenshot, with `color-surface-inverse-glass`.",
    ),
    "shadow-popover": siteShadow(
      "shadow-popover",
      "Dropdown menus and popovers.",
    ),
    "shadow-panel": siteShadow("shadow-panel", "Open nav panel."),
    "shadow-popover-filter": {
      live: withShadowColorToken(filter.live),
      snapshot: filter.snapshot,
      usage:
        "Open nav panel — the flared panel outline needs a `filter`, so this is engine elevation 20 expressed as drop-shadow() layers (spread dropped).",
    },
  };
};
