// Picks the label colour on the action fill and measures the contrast pairings with the engine's contrast().
import { hexOf } from "./engine-colors.ts";
import { compile } from "./sass.ts";
import { CONTRAST_PAIRS, type ContrastPair } from "./spec.ts";

type ColorOf = (name: string) => string;

// The minimum ratio of text (WCAG AA).
const TEXT_MIN = 4.5;

/** The Sass source of the guard stylesheet: the luminance of the action fill and the engine's contrast thresholds. */
export const guardSass = () => `@use 'igniteui-theming' as *;
.guard { --luminance: #{luminance(${hexOf("color-action-default")})}; }
.adaptive { @include adaptive-contrast('aa'); }
`;

export type Guard = {
  /** The relative luminance of the action fill. */
  luminance: string;
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
  const luminance = css.match(/--luminance: ([^;]+);/);
  if (!luminance) throw new Error("guard: --luminance missing");
  return { luminance: luminance[1], adaptiveContrast };
};

/** The guard values of the current seeds. */
export const compiledGuard = () => guardOf(compile(guardSass()));

/** The engine's AA luminance threshold, from the adaptive-contrast() declarations. */
export const aaThreshold = (adaptiveContrast: string[]) => {
  const m = adaptiveContrast
    .map((d) => d.match(/^--ig-wcag-aa: ([\d.]+);$/))
    .find((found) => found !== null);
  if (!m) throw new Error("adaptive-contrast(): --ig-wcag-aa missing");
  return +m[1];
};

/** The label colour on the action fill: black on a fill above the engine's AA luminance threshold, white otherwise. */
export const actionOnColor = (guard: Guard) =>
  +guard.luminance > aaThreshold(guard.adaptiveContrast)
    ? "#000000"
    : "#ffffff";

/** The step the action fill moves to on hover, when it is not the one in the spec: a lighter step under a black label. */
export const actionFillHoverStep = (label: string) =>
  label === "#000000" ? "ig-primary-400" : undefined;

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

/** The pairings the browser gate measures in both themes: reports/contrast-pairs.json. */
export const themePairs = (): ContrastPair[] => [
  ...CONTRAST_PAIRS,
  ["color-text-heading", "color-surface-card"],
  ["color-text-primary", "color-surface-tint"],
  ["color-text-heading", "color-surface-tint"],
  ["color-text-secondary", "color-surface-card"],
  ["color-text-ui", "fw-webcomponents-background"],
  ["color-text-ui", "fw-angular-background"],
  ["color-text-ui", "fw-react-background"],
  ["color-text-ui", "fw-blazor-background"],
  ["color-focus-default", "color-surface-page", 3],
  ["color-feedback-error-default", "color-feedback-error-surface"],
  ["color-feedback-success-default", "color-feedback-success-surface"],
  ["color-feedback-warning-default", "color-feedback-warning-surface"],
  ["color-feedback-info-default", "color-feedback-info-surface"],
];

/** The measured pairings that are below their minimum. */
export const failingPairings = (rows: ContrastRow[]) =>
  rows.filter((r) => !r.ok);

/** Throws when a pairing is below its minimum, naming each one. */
export const assertPairingsPass = (rows: ContrastRow[]) => {
  const failing = failingPairings(rows);
  if (failing.length)
    throw new Error(
      `${failing.length} contrast pairing(s) are below their minimum: ${failing.map((r) => `${r.fg} on ${r.bg} is ${r.ratio}:1, needs ${r.min}:1`).join("; ")}. Pick a darker or lighter step for the token in src/spec.ts.`,
    );
};
