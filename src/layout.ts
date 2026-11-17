// Compiles spacing, sizes, radii, easing and the neutral elevations with the engine's pad(), sizable(), border-radius() and elevations().
import { fluidCalc } from "./fluid.ts";
import { compile } from "./sass.ts";
import {
  RADIUS,
  SECTION_SPACE,
  SIZE,
  SIZE_RATIO,
  SPACE,
  SPACE_ROLES,
} from "./spec.ts";
import { round4 } from "./units.ts";

/** The three arguments pad() and sizable() take: a length at the small, the medium and the large size. */
const bySize = (px: number) =>
  `rem(${round4(px * SIZE_RATIO.small)}px), rem(${round4(px * SIZE_RATIO.medium)}px), rem(${round4(px)}px)`;

/** The Sass source of the layout stylesheet: one sized rule, then one :root rule. */
export const layoutSass = () => {
  const spaceSteps = Object.entries(SPACE).map(
    ([name, px]) => `  --space-${name}: #{pad(${bySize(px)})};\n`,
  );
  const spaceRoles = Object.entries(SPACE_ROLES).flatMap(([role, [, sizes]]) =>
    sizes.map((size) => `  --space-${role}-${size}: var(--space-${size});\n`),
  );
  const sizes = Object.entries(SIZE).map(
    ([name, [px]]) => `  --${name}: #{sizable(${bySize(px)})};\n`,
  );
  const radii = Object.entries(RADIUS).map(
    ([name, [px, , min = 0, max = px]]) =>
      `  --${name}: #{border-radius(rem(${px}px), rem(${min}px), rem(${max}px))};\n`,
  );
  return `@use 'sass:math';\n@use 'igniteui-theming' as *;\n@use 'igniteui-theming/sass/animations/easings' as ease;\n@use 'igniteui-theming/sass/elevations' as e;\n@use 'igniteui-theming/sass/elevations/presets/indigo' as neutral;\n:root, [data-size] {\n  --ig-size-small: 1; --ig-size-medium: 2; --ig-size-large: 3;\n  --component-size: var(--ig-size, var(--ig-size-large));\n  @include sizable();\n${[...spaceSteps, ...spaceRoles, ...sizes].join("")}}\n:root {\n${radii.join("")}  --easing-default: #{ease.$out-cubic};\n  @include e.elevations(neutral.$elevations);\n}\n`;
};

export type Rule = { selector: string; body: string };

// One CSS rule without nesting: selector { declarations }
const RULE = /([^{}]+)\{([^{}]*)\}/g;

/** Splits the compiled layout stylesheet into its sized rule and the joined declarations of its :root rules. */
export const layoutRules = (css: string) => {
  const rules: Rule[] = [...css.matchAll(RULE)].map((m) => ({
    selector: m[1].trim(),
    body: m[2].replace(/^\n+|\s+$/g, ""),
  }));
  const sized = rules.filter((r) => r.selector !== ":root");
  if (sized.length !== 1 || rules.length < 2)
    throw new Error(
      "layout stylesheet: one sized rule and at least one :root rule expected",
    );
  return {
    sized: sized[0],
    root: rules
      .filter((r) => r.selector === ":root")
      .map((r) => r.body)
      .join("\n"),
  };
};

// An elevation variable the engine's elevations() emits: --ig-elevation-<level>: <shadow>;
const ELEVATION = /--ig-elevation-(\d+): ([^;]+);/g;

/** The box shadow of each elevation level in a compiled elevations() stylesheet, by level. */
export const elevationsOf = (css: string) => {
  const levels: Record<string, string> = {};
  for (const [, level, shadow] of css.matchAll(ELEVATION))
    levels[level] = shadow;
  return levels;
};

/** The compiled layout: the sized rule, the :root declarations and the neutral elevations 0 to 24. */
export const compiledLayout = () => {
  const css = compile(layoutSass());
  return { ...layoutRules(css), elevations: elevationsOf(css) };
};

/** The fluid value of space-section: it grows between two spacing steps, which follow the spacing dials. */
export const sectionSpace = () => {
  const { min, max, from, to } = SECTION_SPACE;
  return `clamp(var(--space-${min}), ${fluidCalc(SPACE[min], SPACE[max], from, to)}, var(--space-${max}))`;
};
