// Guards the primary seed, picks the action colour for text and measures the contrast pairings, all with the engine's contrast().
import { rgbToHex } from "./color.ts";
import { hexOf } from "./engine-colors.ts";
import { compile } from "./sass.ts";
import { CONTRAST_PAIRS, type ContrastPair } from "./spec.ts";

type ColorOf = (name: string) => string;

/** The colours tried as the action text colour, in order. The first is the action fill. */
export const TEXT_CANDIDATES = [
  "color-action-default",
  "ig-primary-500",
  "ig-primary-600",
  "ig-primary-700",
  "ig-primary-800",
  "ig-primary-900",
];
/** The light surfaces that carry text in the action colour. The first is the page. */
export const TEXT_SURFACES = [
  "color-surface-page",
  "color-surface-tint",
  "color-surface-card",
  "color-surface-subtle",
];
// The minimum ratio of a filled control against its surroundings, and of text (WCAG AA).
const FILL_MIN = 3;
const TEXT_MIN = 4.5;

/** The Sass source of the guard stylesheet. as-text() mirrors textFormula() in src/derived.ts. */
export const guardSass = () => `@use 'sass:color';
@use 'sass:math';
@use 'igniteui-theming' as *;
$fill: ${hexOf("color-action-default")};
$l: math.div(color.channel($fill, 'lightness', $space: oklch), 100%);
@function as-text($source) {
  $ceiling: math.div(math.ceil(math.div(color.channel($source, 'lightness', $space: oklch), 100%) * 10000), 10000);
  $text-l: math.min($l, math.max(0.35, $ceiling - 0.6 * math.max(0, $l - $ceiling)));
  $c: color.to-gamut(color.change($fill, $lightness: $text-l * 100%, $chroma: color.channel($fill, 'chroma', $space: oklch) * math.div($text-l, $l), $space: oklch), $space: rgb, $method: clip);
  @return math.round(color.channel($c, 'red', $space: rgb)) math.round(color.channel($c, 'green', $space: rgb)) math.round(color.channel($c, 'blue', $space: rgb));
}
.guard {
  --luminance: #{luminance($fill)};
${TEXT_CANDIDATES.flatMap((candidate, ci) => [`  --text-${ci}: #{as-text(${hexOf(candidate)})};`, ...TEXT_SURFACES.map((surface, si) => `  --t-${ci}-${si}: #{contrast(${hexOf(surface)}, ${hexOf(candidate)})};`)]).join("\n")}
}
.adaptive { @include adaptive-contrast('aa'); }
`;

export type Guard = {
  /** The relative luminance of the action fill. */
  luminance: string;
  /** Each candidate darkened for text, as `r g b`. */
  textColors: string[];
  /** The contrast ratio of each candidate on each surface: ratios[candidate][surface]. */
  ratios: string[][];
  /** The declarations adaptive-contrast('aa') emits. */
  adaptiveContrast: string[];
};

/** Reads the guard stylesheet. Throws when a variable it needs is absent. */
export const guardOf = (css: string): Guard => {
  const adaptiveContrast = css
    .slice(css.indexOf(".adaptive"))
    .match(/--[\w-]+: [^;]+;/g);
  if (!adaptiveContrast)
    throw new Error("adaptive-contrast(): no variables emitted");
  const value = (name: string) => {
    const m = css.match(new RegExp(`--${name}: ([^;]+);`));
    if (!m) throw new Error(`guard: --${name} missing`);
    return m[1];
  };
  return {
    luminance: value("luminance"),
    textColors: TEXT_CANDIDATES.map((_, ci) => value(`text-${ci}`)),
    ratios: TEXT_CANDIDATES.map((_, ci) =>
      TEXT_SURFACES.map((_, si) => value(`t-${ci}-${si}`)),
    ),
    adaptiveContrast,
  };
};

/** The guard values of the current seeds. */
export const compiledGuard = () => guardOf(compile(guardSass()));

/** Throws when the primary seed, as a fill, is below 3:1 on the page. */
export const assertSeedStandsOut = (seed: string, ratioOnPage: string) => {
  if (+ratioOnPage < FILL_MIN)
    throw new Error(
      `The primary seed ${seed} is ${ratioOnPage}:1 on the page. A filled control needs 3:1 against its surroundings. Pick a darker primary seed.`,
    );
};

/** The index of the first candidate that clears 4.5:1 on every surface. Throws when none does. */
export const actionTextIndex = (ratios: string[][]) => {
  const index = ratios.findIndex((onSurfaces) =>
    onSurfaces.every((ratio) => +ratio >= TEXT_MIN),
  );
  if (index < 0)
    throw new Error(
      "No primary step from 500 to 900 clears 4.5:1 on every light surface. Pick a different primary seed.",
    );
  return index;
};

/** The engine's AA luminance threshold, from the adaptive-contrast() declarations. */
export const aaThreshold = (adaptiveContrast: string[]) => {
  const m = adaptiveContrast
    .map((d) => d.match(/^--ig-wcag-aa: ([\d.]+);$/))
    .find((found) => found !== null);
  if (!m) throw new Error("adaptive-contrast(): --ig-wcag-aa missing");
  return +m[1];
};

/** The colours the build computes in place of the alias in the spec: the action colour as text and the label on the action fill. */
export const publishedActionColors = (guard: Guard) => {
  assertSeedStandsOut(hexOf("color-action-default"), guard.ratios[0][0]);
  const index = actionTextIndex(guard.ratios);
  const published: Record<string, string> = {};
  // The seed itself is published while it reads as text; a later candidate is published darkened.
  if (index > 0)
    published["color-action-text"] = rgbToHex(
      guard.textColors[index].split(" ").map(Number),
    );
  published["color-action-on"] =
    +guard.luminance > aaThreshold(guard.adaptiveContrast)
      ? "#000000"
      : "#ffffff";
  return { published, actionTextSource: TEXT_CANDIDATES[index] };
};

export type ContrastRow = {
  fg: string;
  bg: string;
  ratio: number;
  min: number;
  ok: boolean;
};

/** Reads one ratio per pairing from the compiled contrast stylesheet. */
export const contrastRows = (
  css: string,
  pairs: ContrastPair[],
): ContrastRow[] => {
  const ratios = [...css.matchAll(/--r-\d+: ([\d.]+);/g)].map((m) => +m[1]);
  if (ratios.length !== pairs.length)
    throw new Error("contrast(): one ratio per pairing expected");
  return pairs.map(([fg, bg, min = TEXT_MIN], i) => ({
    fg,
    bg,
    ratio: ratios[i],
    min,
    ok: ratios[i] >= min,
  }));
};

/** The ratio of every pairing in CONTRAST_PAIRS, measured by the engine's contrast(). */
export const measuredContrast = (colorOf: ColorOf) =>
  contrastRows(
    compile(
      `@use 'igniteui-theming' as *;\n.ratios {\n${CONTRAST_PAIRS.map(([fg, bg], i) => `  --r-${i}: #{contrast(${colorOf(bg)}, ${colorOf(fg)})};`).join("\n")}\n}\n`,
    ),
    CONTRAST_PAIRS,
  );

/** The sentence parts a token note quotes, by foreground token: "<ratio>:1 on `<background>`". */
export const ratioNotes = (rows: ContrastRow[]) => {
  const notes: Record<string, string[]> = {};
  for (const { fg, bg, ratio } of rows) {
    notes[fg] ??= [];
    notes[fg].push(`${ratio}:1 on \`${bg}\``);
  }
  return notes;
};

/** True for a pairing that holds the action fill to the text minimum. The fill is held to 3:1; text uses color-action-text. */
export const isFillAsText = ([fg, , min = TEXT_MIN]: ContrastPair) =>
  (fg === "color-action-default" && min === TEXT_MIN) ||
  fg === "color-action-active";

/** The pairings the browser gate measures in both themes: reports/contrast-pairs.json. */
export const themePairs = (): ContrastPair[] => [
  ...CONTRAST_PAIRS.filter((pair) => !isFillAsText(pair)),
  ["color-action-text", "color-surface-page"],
  ["color-action-text", "color-surface-tint"],
  ["color-action-text", "color-surface-card"],
  ["color-action-text", "color-surface-subtle"],
  ["color-text-heading", "color-surface-card"],
  ["color-text-primary", "color-surface-tint"],
  ["color-text-heading", "color-surface-tint"],
  ["color-text-secondary", "color-surface-card"],
  ["color-text-ui", "fw-webcomponents-background"],
  ["color-text-ui", "fw-angular-background"],
  ["color-text-ui", "fw-react-background"],
  ["color-text-ui", "fw-blazor-background"],
  ["color-focus-default", "color-surface-page", 3],
];

/** The measured pairings that are below their minimum. */
export const failingPairings = (rows: ContrastRow[]) =>
  rows.filter((r) => !r.ok && !isFillAsText([r.fg, r.bg, r.min]));

/** Throws when a pairing is below its minimum, naming each one. */
export const assertPairingsPass = (rows: ContrastRow[]) => {
  const failing = failingPairings(rows);
  if (failing.length)
    throw new Error(
      `${failing.length} contrast pairing(s) are below their minimum: ${failing.map((r) => `${r.fg} on ${r.bg} is ${r.ratio}:1, needs ${r.min}:1`).join("; ")}. Pick a darker or lighter step for the token in src/spec.ts.`,
    );
};
