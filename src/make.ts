import { execSync } from "node:child_process";
import fs from "node:fs";
import { fluid } from "./fluid.ts";
import { sets } from "./palette-sets.ts";
import * as S from "./spec.ts";
import type { Token, Tokens, TypeGroup, TypeStyle } from "./types.ts";

type Named<T> = Record<string, T>;

// Run from the repository root: node src/make.ts
const OUT = "dist";
const REP = "reports";
const TMP = ".cache/sass";
for (const d of [OUT, REP, TMP]) fs.mkdirSync(d, { recursive: true });
const P: Named<Named<string>> = JSON.parse(
  fs.readFileSync("src/palettes.json", "utf8"),
);
const f4 = (n: number) => (+n.toFixed(4)).toString();
const rem = (px: number) => `${f4(px / 16)}rem`;

// ---------- engine colour lookup: token name -> hex ----------
const engineHex = (name: string) => {
  let m = name.match(/^ig-dark-(gray|surface)-(\d+)$/);
  if (m) return P.dark[`${m[1]}-${m[2]}`];
  m = name.match(/^ig-dark-surface-(sunken|raised|overlay|base)$/);
  if (m) return P.dark[`surface-${m[1]}`];
  m = name.match(/^ig-(pink|cyan|sky|teal)-(\d+)$/);
  if (m) return P[m[1]][`primary-${m[2]}`];
  m = name.match(/^ig-([a-z]+-(?:A?\d+|seed|base|sunken|raised|overlay))$/);
  if (m) return P.light[m[1]];
  return null;
};
// Published values the build computes, in place of the alias in the spec.
const SNAPSHOT: Named<string> = {};
const hexOf = (name: string): string => {
  if (SNAPSHOT[name]) return SNAPSHOT[name];
  const a = S.ALIAS[name];
  return a
    ? hexOf(a[0])
    : (engineHex(name) ??
        (() => {
          throw new Error(`unknown colour ${name}`);
        })());
};
const rgbOf = (h: string) =>
  [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
const sass = (name: string, source: string) => {
  fs.writeFileSync(`${TMP}/${name}.scss`, source);
  execSync(
    `npx sass --quiet --no-source-map --load-path=node_modules ${TMP}/${name}.scss ${TMP}/${name}.css`,
  );
  return fs.readFileSync(`${TMP}/${name}.css`, "utf8");
};

// ---------- 1. typography ----------
for (const name of Object.keys(S.TYPE_MIN))
  if (!S.TYPE.some((r) => r[1] === name))
    throw new Error(
      `TYPE_MIN names "${name}", which is not a type role. The roles are: ${S.TYPE.map((r) => r[1]).join(", ")}.`,
    );
// Compiles one scale with the engine's typography() and returns each slot's properties.
type ScaleRow = {
  slot: string;
  size: string;
  weight: number;
  line: number;
  track: string;
  transform: string;
};
const engineType = (file: string, rows: ScaleRow[]) => {
  const css = sass(
    file,
    `@use 'igniteui-theming' as *;\n$scale: (\n${rows.map((r) => `  '${r.slot}': type-style($font-size: ${r.size}, $font-weight: ${r.weight}, $line-height: ${r.line}, $letter-spacing: ${r.track}, $text-transform: ${r.transform})`).join(",\n")}\n);\n:root { @include typography('x', $scale); }\n`,
  );
  const out: Named<Named<string>> = {};
  for (const m of css.matchAll(
    /--ig-([a-z0-9-]+?)-(font-size|font-weight|font-style|line-height|letter-spacing|text-transform): ([^;]+);/g,
  )) {
    out[m[1]] ??= {};
    out[m[1]][m[2]] = m[3];
  }
  for (const r of rows)
    if (!out[r.slot])
      throw new Error(`slot missing in engine output: ${r.slot}`);
  return out;
};
const type = engineType(
  "type",
  S.TYPE.map(([slot, name, , , px, line, weight, track, transform]) => ({
    slot,
    size: S.TYPE_MIN[name]
      ? fluid(
          S.TYPE_MIN[name],
          px,
          S.TYPE_FLUID_RANGE.from,
          S.TYPE_FLUID_RANGE.to,
        )
      : `rem(${px}px)`,
    weight,
    line,
    track,
    transform,
  })),
);
// A type set has an entry for every role, so a page that picks one gets a complete scale.
const typeSets: Named<Named<Named<string>>> = {};
for (const [set, entries] of Object.entries(S.TYPE_SETS)) {
  const roles = S.TYPE.map((r) => r[1]);
  const unknown = Object.keys(entries).filter((n) => !roles.includes(n));
  const missing = roles.filter((n) => !entries[n]);
  if (unknown.length || missing.length)
    throw new Error(
      `TYPE_SETS.${set} must list each type role once.${unknown.length ? ` Not a role: ${unknown.join(", ")}.` : ""}${missing.length ? ` Missing: ${missing.join(", ")}.` : ""} The roles are: ${roles.join(", ")}.`,
    );
  typeSets[set] = engineType(
    `type-${set}`,
    S.TYPE.map(([slot, name, , , , , , , transform]) => ({
      slot,
      size: `rem(${entries[name].sizePx}px)`,
      weight: entries[name].weight,
      line: entries[name].line,
      track: entries[name].tracking ?? "0",
      transform: entries[name].transform ?? transform,
    })),
  );
}

// ---------- 2. Sass: layout knobs + tinted elevations ----------
const primary600 = rgbOf(hexOf("ig-primary-600")).join(" ");
const sm = S.SIZE_RATIO.small;
const md = S.SIZE_RATIO.medium;
const px3 = (n: number) =>
  `rem(${f4(n * sm)}px), rem(${f4(n * md)}px), rem(${f4(n)}px)`;
let scss = `@use 'sass:math';\n@use 'igniteui-theming' as *;\n@use 'igniteui-theming/sass/animations/easings' as ease;\n@use 'igniteui-theming/sass/elevations' as e;\n@use 'igniteui-theming/sass/elevations/presets/indigo' as neutral;\n`;
scss +=
  ":root, [data-size] {\n  --ig-size-small: 1; --ig-size-medium: 2; --ig-size-large: 3;\n  --component-size: var(--ig-size, var(--ig-size-large));\n  @include sizable();\n";
for (const [name, n] of Object.entries(S.SPACE))
  scss += `  --space-${name}: #{pad(${px3(n)})};\n`;
// semantic spacing roles, declared beside the steps so a region with its own --ig-size or --ig-spacing re-resolves them
for (const [role, [, sizes]] of Object.entries(S.SPACE_ROLES))
  for (const sz of sizes)
    scss += `  --space-${role}-${sz}: var(--space-${sz});\n`;
for (const [name, [px]] of Object.entries(S.SIZE))
  scss += `  --${name}: #{sizable(${px3(px)})};\n`;
scss += "}\n:root {\n";
// every radius role goes through the engine's border-radius($radius, $min, $max): unset knob = the design value,
// 0 = the role's minimum, 1 = the role's maximum. Limits are per role, so a tile or card never becomes a circle.
for (const [name, [px, , min = 0, max = px]] of Object.entries(S.RADIUS))
  scss += `  --${name}: #{border-radius(rem(${px}px), rem(${min}px), rem(${max}px))};\n`;
scss +=
  "  --easing-default: #{ease.$out-cubic};\n  @include e.elevations(neutral.$elevations);\n}\n";
fs.writeFileSync(".cache/sass/layout.scss", scss);
execSync(
  "npx sass --quiet --no-source-map --load-path=node_modules .cache/sass/layout.scss .cache/sass/layout.css",
);
fs.writeFileSync(
  ".cache/sass/tint.scss",
  `@use 'igniteui-theming/sass/elevations' as e;\n@use 'igniteui-theming/sass/elevations/presets/indigo' as tinted with ($color-1: rgb(${primary600} / 0.26), $color-2: rgb(${primary600} / 0.12), $color-3: rgb(${primary600} / 0.08));\n:root { @include e.elevations(tinted.$elevations); }\n`,
);
execSync(
  "npx sass --quiet --no-source-map --load-path=node_modules .cache/sass/tint.scss .cache/sass/tint.css",
);
const layoutCss = fs.readFileSync(".cache/sass/layout.css", "utf8");
// neutral elevations 0..24
const elevNeutral: Named<string> = {};
for (const m of layoutCss.matchAll(/--ig-elevation-(\d+): ([^;]+);/g))
  elevNeutral[m[1]] = m[2];
const tintVars: Named<string> = {};
for (const m of fs
  .readFileSync(".cache/sass/tint.css", "utf8")
  .matchAll(/--ig-elevation-(\d+): ([^;]+);/g))
  tintVars[m[1]] = m[2];
const tintUsed = [1, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
// The neutral semantic shadows go through the engine's box-shadow(), so they follow --ig-elevation-factor.
const SHADOW_TINT: Named<string> = {
  "color-shadow": "0, 0, 0",
  "color-surface-inverse": rgbOf(hexOf("color-surface-inverse")).join(", "),
};
fs.writeFileSync(
  ".cache/sass/shadows.scss",
  `@use 'igniteui-theming/sass/elevations' as e;\n:root {\n${Object.entries(
    S.SHADOW,
  )
    .map(
      ([name, layers]) =>
        `  --${name}: #{e.box-shadow((${layers.map(([y, blur, spread, tint, alpha]) => `0 ${y}px ${blur}px ${spread}px rgba(${SHADOW_TINT[tint]}, ${alpha})`).join(", ")}${layers.length === 1 ? "," : ""}))};`,
    )
    .join("\n")}\n}\n`,
);
execSync(
  "npx sass --quiet --no-source-map --load-path=node_modules .cache/sass/shadows.scss .cache/sass/shadows.css",
);
const soft: Named<string> = {};
for (const m of fs
  .readFileSync(".cache/sass/shadows.css", "utf8")
  .matchAll(/--(shadow-[\w-]+): ([^;]+);/g))
  soft[m[1]] = m[2];
const resolveShadow = (s: string) =>
  s
    .replace(
      /calc\(var\(--ig-elevation-factor, 1\) \* (-?[\d.]+)px\)/g,
      (_, n: string) => (+n === 0 ? "0" : `${n}px`),
    )
    .replace(/rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/g, "rgba($1,$2,$3,$4)")
    .replace(/ 0px/g, " 0");

// ---------- 3. chosen elevations for the semantic shadows ----------
const SHADOWS: Named<[live: string, snapshot: string, usage: string]> = {
  "shadow-none": [
    "var(--ig-elevation-0)",
    "none",
    "Cards at rest — flat; a card is defined by its hairline `color-border-default`. Engine elevation 0.",
  ],
  "shadow-raised": [
    soft["shadow-raised"],
    resolveShadow(soft["shadow-raised"]),
    "Card hover: cards lift shadow only, no translate or scale.",
  ],
  "shadow-accent-lg": [
    "var(--elevation-tint-16)",
    resolveShadow(tintVars[16]),
    "Primary CTA and its hover (no shadow change on hover). Engine elevation 16 tinted with `color-action-default`.",
  ],
  "shadow-accent-sm": [
    "var(--elevation-tint-1)",
    resolveShadow(tintVars[1]),
    "Framework pill hover — the only hover change on a pill. Engine elevation 1 tinted with `color-action-default`.",
  ],
  "shadow-overlay": [
    soft["shadow-overlay"],
    resolveShadow(soft["shadow-overlay"]),
    "Screenshots inside a BrowserFrame.",
  ],
  "shadow-floating": [
    soft["shadow-floating"],
    resolveShadow(soft["shadow-floating"]),
    "Floating stat badges.",
  ],
  "shadow-accent-md": [
    "var(--elevation-tint-13)",
    resolveShadow(tintVars[13]),
    "Bundle cards with the gradient border. Engine elevation 13 tinted with `color-action-default`.",
  ],
  "callout-release-shadow": [
    "var(--elevation-tint-13)",
    `inset 0 0 0 1px ${(() => {
      const [r, g, b] = rgbOf(hexOf("color-accent-primary"));
      return `rgba(${r},${g},${b},${S.OPACITY["opacity-soft"][0]})`;
    })()}, ${resolveShadow(tintVars[13])}`,
    "Release strip at rest. Engine elevation 13 tinted with `color-action-default`.",
  ],
  "callout-release-shadow-hover": [
    "var(--elevation-tint-16)",
    `inset 0 0 0 1px ${(() => {
      const [r, g, b] = rgbOf(hexOf("color-accent-primary"));
      return `rgba(${r},${g},${b},${S.OPACITY["opacity-strong"][0]})`;
    })()}, ${resolveShadow(tintVars[16])}`,
    "Release strip on hover. Engine elevation 16 tinted with `color-action-default`.",
  ],
  "shadow-popover": [
    soft["shadow-popover"],
    resolveShadow(soft["shadow-popover"]),
    "Dropdown menus and popovers.",
  ],
  "shadow-panel": [
    soft["shadow-panel"],
    resolveShadow(soft["shadow-panel"]),
    "Open nav panel.",
  ],
};

// Section padding grows in a straight line between two spacing steps, so both ends follow the spacing dials.
const sectionSpace = (() => {
  const { min, max, from, to } = S.SECTION_SPACE;
  const slope = (S.SPACE[max] - S.SPACE[min]) / (to - from);
  const base = S.SPACE[min] - slope * from;
  return `clamp(var(--space-${min}), calc(${f4(slope * 100)}cqi + ${f4(base / 16)}rem), var(--space-${max}))`;
})();

const dropOf = (raw: string) =>
  raw.split(/, (?=0 )/).map((l) => {
    const m = [
      ...l.matchAll(
        /calc\(var\(--ig-elevation-factor, 1\) \* (-?[\d.]+)px\)|rgba\([^)]*\)/g,
      ),
    ];
    return {
      y: m[0][0],
      b: m[1][0],
      yn: m[0][1],
      bn: m[1][1],
      c: m[3][0].replace(/, /g, ","),
    };
  });
const panelLayers = dropOf(elevNeutral[20]);
SHADOWS["shadow-popover-filter"] = [
  panelLayers.map((l) => `drop-shadow(0 ${l.y} ${l.b} ${l.c})`).join(" "),
  panelLayers.map((l) => `drop-shadow(0 ${l.yn}px ${l.bn}px ${l.c})`).join(" "),
  "Open nav panel — the flared panel outline needs a `filter`, so this is engine elevation 20 expressed as drop-shadow() layers (spread dropped).",
];

// ---------- 4. tokens.json ----------
const FONTS = [
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
const colorTokens: Token[] = [];
const add = (name: string, value: string, usage: string) =>
  colorTokens.push({ name, value, usage });
const FAM = {
  primary: "primary",
  secondary: "secondary",
  info: "info",
  success: "success",
  warn: "warn",
  error: "error",
  gray: "gray",
};
const note = (fam: string, variant: string) =>
  `Engine palette step \`${fam}\`, ${variant}. Seeded from the previous system; each step is solved for contrast by igniteui-theming.`;
for (const fam of Object.keys(FAM))
  for (const [n, v] of Object.entries(P.light))
    if (new RegExp(`^${fam}-A?\\d+$`).test(n))
      add(`ig-${n}`, v, note(n.replace("-", " "), "light variant"));
// the engine emits each family\u2019s seed as --ig-<family>-seed: the exact colour the family was built from
for (const fam of ["primary", "secondary", "info"])
  add(
    `ig-${fam}-seed`,
    P.light[`${fam}-seed`],
    `The exact seed colour the engine built the ${fam} family from.`,
  );
for (const r of ["base", "sunken", "raised", "overlay"])
  add(
    `ig-surface-${r}`,
    P.light[`surface-${r}`],
    `Engine surface role \`${r}\` (light variant).`,
  );
// A step of an accent palette (pink, cyan, sky, teal) or of the dark palette is built by the engine and not published: the token that uses it carries the colour itself.
const ACCENT_STEP = /^ig-(pink|cyan|sky|teal)-(\d+)$/;
const DARK_STEP = /^ig-dark-(gray|surface)-(\d+)$/;
const unpublished = (eng: string) =>
  ACCENT_STEP.test(eng) || DARK_STEP.test(eng);
const stepNote = (eng: string) =>
  ACCENT_STEP.test(eng)
    ? ` Engine step ${eng.replace(ACCENT_STEP, "$2 of the $1 palette")}.`
    : DARK_STEP.test(eng)
      ? ` Engine step ${eng.replace(DARK_STEP, "$2 of the dark palette's $1 ramp")}.`
      : "";
const inlined = new Set<string>();
const aliasUsage = (name: string) => S.ALIAS[name][1];
// contrast checks that decide which ratio is quoted in a note
const CHECKS: [fg: string, bg: string, min?: number][] = [
  ["color-text-heading", "color-surface-page"],
  ["color-text-primary", "color-surface-page"],
  ["color-text-secondary", "color-surface-page"],
  ["color-text-secondary", "color-surface-subtle"],
  ["color-text-ui", "color-surface-page"],
  ["color-text-muted", "color-surface-page"],
  ["color-text-muted", "color-surface-subtle"],
  ["color-text-secondary", "color-surface-page"],
  ["color-action-default", "color-surface-page"],
  ["color-action-default", "color-surface-tint"],
  ["color-action-default", "color-surface-page"],
  ["color-action-default", "color-surface-tint"],
  ["color-action-on", "color-action-default"],
  ["color-text-muted", "color-surface-page"],
  ["color-text-muted", "color-surface-card"],
  ["color-text-muted", "color-surface-tint"],
  ["color-text-muted", "color-surface-page"],
  ["color-link-utility", "color-surface-page"],
  ["color-link-utility", "color-surface-subtle"],
  ["color-action-hover", "color-surface-page"],
  ["color-action-active", "color-surface-page"],
  ["color-text-inverse", "color-surface-inverse"],
  ["color-text-inverse-muted", "color-surface-inverse"],
  ["color-accent-inverse", "color-surface-inverse"],
  ["color-accent-inverse-alt", "color-surface-inverse"],
  ["color-link-inverse", "color-surface-inverse"],
  ["color-focus-inverse", "color-surface-inverse"],
  ["footer-link", "color-surface-inverse-raised"],
  ["footer-text", "color-surface-inverse-raised"],
  ["footer-strong", "color-surface-inverse-raised"],
  ["footer-heading", "color-surface-inverse-raised"],
  ["footer-icon", "color-surface-inverse-raised"],
  ["color-feedback-error-inverse", "color-surface-inverse-raised"],
  ["badge-bundle-color", "badge-bundle-background"],
  ["badge-oss-color", "color-surface-page"],
  ["table-mark-yes-color", "table-mark-yes-background"],
  ["table-mark-partial-color", "table-mark-partial-background"],
  ["table-mark-no-color", "table-mark-no-background"],
  ["table-header-sub-color", "color-surface-inverse"],
  ["table-header-sub-highlight-color", "color-action-default"],
  ["table-header-detail-color", "color-surface-inverse"],
  ["color-icon-subtle", "color-surface-page", 1],
  ["color-border-control", "color-surface-page", 3],
  ["color-focus-inverse", "color-surface-inverse", 3],
  ["color-action-default", "color-surface-page", 3],
  ["color-feedback-error-default", "color-surface-page"],
  ["color-feedback-error-default", "color-surface-subtle"],
  ["color-focus-default", "color-surface-page", 3],
  ["color-text-ui", "color-surface-subtle"],
  ["color-text-secondary", "color-surface-muted"],
];
const report: {
  fg: string;
  bg: string;
  ratio: number;
  min: number;
  ok: boolean;
}[] = [];
const ratioNote: Named<string[]> = {};
// Contrast ratios and the adaptive-contrast variables come from the engine's contrast() and adaptive-contrast().
// The action colour as text must clear AA on every light surface that carries text. The first of these that does sets its lightness ceiling.
const TEXT_CANDIDATES = [
  "color-action-default",
  "ig-primary-500",
  "ig-primary-600",
  "ig-primary-700",
  "ig-primary-800",
  "ig-primary-900",
];
const TEXT_SURFACES = [
  "color-surface-page",
  "color-surface-tint",
  "color-surface-card",
  "color-surface-subtle",
];
// Mirrors textExpr() in the derived-colour section: the light-theme lightness and chroma of the action colour as text.
const guardCss = sass(
  "guard",
  `@use 'sass:color';
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
${TEXT_CANDIDATES.flatMap((c, ci) => [`  --text-${ci}: #{as-text(${hexOf(c)})};`, ...TEXT_SURFACES.map((bg, si) => `  --t-${ci}-${si}: #{contrast(${hexOf(bg)}, ${hexOf(c)})};`)]).join("\n")}
}
.adaptive { @include adaptive-contrast('aa'); }
`,
);
const adaptiveContrast = guardCss
  .slice(guardCss.indexOf(".adaptive"))
  .match(/--[\w-]+: [^;]+;/g);
if (!adaptiveContrast)
  throw new Error("adaptive-contrast(): no variables emitted");
const guard = (name: string) => {
  const m = guardCss.match(new RegExp(`--${name}: ([^;]+);`));
  if (!m) throw new Error(`guard: --${name} missing`);
  return m[1];
};
// TEXT_CANDIDATES[0] is the action fill and TEXT_SURFACES[0] is the page.
if (+guard("t-0-0") < 3)
  throw new Error(
    `The primary seed ${hexOf("color-action-default")} is ${guard("t-0-0")}:1 on the page. A filled control needs 3:1 against its surroundings. Pick a darker primary seed.`,
  );
const actionTextIndex = TEXT_CANDIDATES.findIndex((_c, ci) =>
  TEXT_SURFACES.every((_bg, si) => +guard(`t-${ci}-${si}`) >= 4.5),
);
if (actionTextIndex < 0)
  throw new Error(
    "No primary step from 500 to 900 clears 4.5:1 on every light surface. Pick a different primary seed.",
  );
const actionTextSource = TEXT_CANDIDATES[actionTextIndex];
const hex2 = (v: string) => (+v).toString(16).padStart(2, "0");
// A seed that reads as text is published as itself; a darkened one is published as the colour theme.css computes.
if (actionTextIndex > 0)
  SNAPSHOT["color-action-text"] =
    `#${guard(`text-${actionTextIndex}`).split(" ").map(hex2).join("")}`;
// The label on the action fill: black above the engine's AA luminance threshold, white below it.
const aaThreshold = adaptiveContrast
  .map((d) => d.match(/^--ig-wcag-aa: ([\d.]+);$/))
  .find((m) => m !== null);
if (!aaThreshold) throw new Error("adaptive-contrast(): --ig-wcag-aa missing");
SNAPSHOT["color-action-on"] =
  +guard("luminance") > +aaThreshold[1] ? "#000000" : "#ffffff";
const engineCss = sass(
  "contrast",
  `@use 'igniteui-theming' as *;\n.ratios {\n${CHECKS.map(([fg, bg], i) => `  --r-${i}: #{contrast(${hexOf(bg)}, ${hexOf(fg)})};`).join("\n")}\n}\n`,
);
const ratios = [...engineCss.matchAll(/--r-\d+: ([\d.]+);/g)].map((m) => +m[1]);
if (ratios.length !== CHECKS.length)
  throw new Error("contrast(): one ratio per pairing expected");
for (const [i, [fg, bg, min = 4.5]] of CHECKS.entries()) {
  const r = ratios[i];
  report.push({ fg, bg, ratio: r, min, ok: r >= min });
  ratioNote[fg] ??= [];
  ratioNote[fg].push(`${r}:1 on \`${bg}\``);
}
for (const [name, [eng]] of Object.entries(S.ALIAS)) {
  if (ACCENT_STEP.test(eng) && !SNAPSHOT[name]) inlined.add(name);
  add(
    name,
    SNAPSHOT[name] ?? (unpublished(eng) ? hexOf(eng) : `{${eng}}`),
    aliasUsage(name) +
      stepNote(eng) +
      (ratioNote[name] ? ` Contrast ${ratioNote[name].join(", ")}.` : ""),
  );
}
for (const [name, [base, op, usage]] of Object.entries(S.ALPHA)) {
  const [r, g, b] = rgbOf(hexOf(base));
  add(
    name,
    `rgba(${r},${g},${b},${S.OPACITY[op][0]})`,
    `${usage} Live: \`${base}\` at \`${op}\`.`,
  );
}

const GRAD: Named<[snapshot: string, live: string, usage: string]> = {
  "footer-background-gradient": [
    `linear-gradient(155deg, ${hexOf("color-surface-inverse-raised")} 0%, ${hexOf("ig-dark-surface-400")} 42%, ${hexOf("footer-background")} 100%)`,
    `linear-gradient(155deg, var(--color-surface-inverse-raised) 0%, ${hexOf("ig-dark-surface-400")} 42%, var(--footer-background) 100%)`,
    "The site footer’s own 155° gradient — one of the two dark surfaces in the system.",
  ],
  "gradient-brand": [
    `linear-gradient(92deg, ${hexOf("color-accent-primary")}, ${hexOf("color-accent-secondary")})`,
    "linear-gradient(92deg, var(--color-accent-primary), var(--color-accent-secondary))",
    "The 92° blue→violet, clipped to one headline fragment per section. Never a background fill, button or tile.",
  ],
  "gradient-hero": [
    `linear-gradient(180deg, ${hexOf("color-surface-hero")}, ${hexOf("color-surface-page")})`,
    "linear-gradient(180deg, var(--color-surface-hero), var(--color-surface-page))",
    "The hero wash behind the homepage hero.",
  ],
};
const glow = (base: string, op: S.OpacityName, stop: number) => {
  const [r, g, b] = rgbOf(hexOf(base));
  return [
    `radial-gradient(circle, rgba(${r},${g},${b},${S.OPACITY[op][0]}), transparent ${stop}%)`,
    `radial-gradient(circle, hsl(from var(--${base}) h s l / var(--${op})), transparent ${stop}%)`,
  ];
};
const GLOWS: Named<
  [base: string, opacity: S.OpacityName, stop: number, usage: string]
> = {
  "glow-primary": [
    "color-accent-primary",
    "opacity-muted",
    62,
    "Ambient radial glow behind hero and section content, bleeding off the edges, `pointer-events:none`.",
  ],
  "glow-secondary": [
    "color-accent-secondary",
    "opacity-muted",
    62,
    "Ambient radial glow partnered with `glow-primary` on light sections.",
  ],
  "glow-secondary-strong": [
    "color-accent-secondary",
    "opacity-heavy",
    62,
    "Footer glow only (top-right of the dark footer).",
  ],
  "glow-inverse": [
    "tile-3",
    "opacity-muted",
    62,
    "Ambient glow for the dark AI and enterprise bands only.",
  ],
  "glow-inverse-alt": [
    "color-accent-inverse-alt",
    "opacity-soft",
    68,
    "Ambient glow for the dark AI and enterprise bands and the footer.",
  ],
};
const gradientTokens: Token[] = [];
for (const [n, [snap, , u]] of Object.entries(GRAD))
  gradientTokens.push({ name: n, value: snap, usage: u });
for (const [n, [base, op, stop, u]] of Object.entries(GLOWS))
  gradientTokens.push({ name: n, value: glow(base, op, stop)[0], usage: u });

const typeGroups: TypeGroup[] = [
  { name: "Display", family: "display", styles: [] },
  { name: "Body", family: "body", styles: [] },
];
for (const [
  slot,
  name,
  was,
  fam,
  px,
  _line,
  weight,
  track,
  _transform,
  usage,
  sample,
] of S.TYPE) {
  const t = type[slot];
  const st: TypeStyle = {
    name: `type-${name}`,
    fontSize: rem(px),
    ...(S.TYPE_MIN[name] ? { fontSizeMin: rem(S.TYPE_MIN[name]) } : {}),
    lineHeight: t["line-height"],
    fontWeight: weight,
    usage: `${usage} (was \`${was}\`${S.ENGINE_TYPE_SLOTS.includes(slot) ? `; engine slot \`${slot}\`` : ""})`,
    sample,
  };
  if (track !== "0") st.letterSpacing = t["letter-spacing"];
  (fam === "display" ? typeGroups[0] : typeGroups[1]).styles.push(st);
}
// slots that use the display face but sit in the body group keep their own family
for (const g of typeGroups)
  for (const st of g.styles) {
    const fam = S.TYPE.find((r) => `type-${r[1]}` === st.name)![3];
    if (fam !== g.family) st.family = fam;
  }

const tokens: Tokens = {
  name: "Infragistics Design System",
  version: 2,
  color: { themes: [{ id: "light", name: "Light" }], tokens: colorTokens },
  type: {
    fonts: FONTS,
    families: S.FAMILIES,
    fluid: S.TYPE_FLUID_RANGE,
    sets: Object.fromEntries(
      Object.entries(typeSets).map(([set, slots]) => [
        set,
        S.TYPE.map(([slot, name]) => ({
          name: `type-${name}`,
          fontSize: slots[slot]["font-size"],
          lineHeight: slots[slot]["line-height"],
          fontWeight: +slots[slot]["font-weight"],
          ...(slots[slot]["letter-spacing"] !== "0"
            ? { letterSpacing: slots[slot]["letter-spacing"] }
            : {}),
          ...(slots[slot]["text-transform"] !== "none"
            ? { textTransform: slots[slot]["text-transform"] }
            : {}),
        })),
      ]),
    ),
    groups: typeGroups,
  },
  spacing: {
    note: "Two tiers. Steps (space-3xs … space-6xl) are the raw scale; the name is a size, not a pixel value, and the live value comes from the engine's pad() in theme.css, following --ig-spacing and --ig-size. Roles (space-inset-*, space-stack-*, space-gap-*) say what the space is for and are what components use.",
    tokens: [
      ...Object.entries(S.SPACE).map(([name, n]) => ({
        name: `space-${name}`,
        value: rem(n),
        usage: `Raw spacing step. ${n}px at the default density.`,
      })),
      ...Object.entries(S.SPACE_ROLES).flatMap(([role, [usage, sizes]]) =>
        sizes.map((sz) => ({
          name: `space-${role}-${sz}`,
          value: `{space-${sz}}`,
          usage,
        })),
      ),
    ],
  },
  radius: {
    note: "Live values are produced by the engine's border-radius() in theme.css and follow --ig-radius-factor (unset = as listed, 0 = each role\u2019s minimum, 1 = each role\u2019s maximum).",
    tokens: Object.entries(S.RADIUS).map(
      ([name, [px, u, min = 0, max = px]]) => ({
        name,
        value: rem(px),
        usage: `${u} Range ${min}px to ${max}px.`,
      }),
    ),
  },
  size: {
    note: "Live values are produced by the engine's sizable() in theme.css and step down for --ig-size small and medium.",
    tokens: [
      ...Object.entries(S.SIZE).map(([name, [px, u]]) => ({
        name,
        value: rem(px),
        usage: u,
      })),
      ...Object.entries(S.TRACKING).map(([name, [v, u]]) => ({
        name,
        value: v,
        usage: u,
      })),
    ],
  },
  shadow: {
    note: "`shadow-raised`, `shadow-overlay` and `shadow-floating` are the shadows www.infragistics.com ships, compiled with the engine's box-shadow(). The rest are resolved from igniteui-theming elevations (indigo preset) at --ig-elevation-factor 1; tinted levels use the same preset with `color-action-default` as umbra, penumbra and ambient colour. theme.css keeps them live.",
    tokens: [
      ...Object.entries(SHADOWS).map(([name, [, snap, usage]]) => ({
        name,
        value: snap === "none" ? "none" : snap,
        usage,
      })),
      ...Object.keys(elevNeutral).map((l) => ({
        name: `elevation-${l}`,
        value: l === "0" ? "none" : resolveShadow(elevNeutral[l]),
        usage: `Engine elevation ${l}, indigo preset.`,
      })),
      ...tintUsed.map((l) => ({
        name: `elevation-tint-${l}`,
        value: resolveShadow(tintVars[l]),
        usage: `Engine elevation ${l}, indigo preset, tinted with \`action\`.`,
      })),
    ],
  },
  opacity: {
    note: "Alpha steps for translucent colours; combined with a colour token as hsl(from <colour> h s l / <opacity>).",
    tokens: Object.entries(S.OPACITY).map(([name, [v, u]]) => ({
      name,
      value: String(v),
      usage: u,
    })),
  },
  weight: {
    tokens: Object.entries(S.WEIGHT).map(([name, v]) => ({
      name,
      value: String(v),
      usage: `Font weight ${v}.`,
    })),
  },
  gradient: {
    note: "Gradients and ambient glows. Three uses only: clipped headline text, the hero wash and glows, and the footer.",
    tokens: gradientTokens,
  },
  breakpoint: {
    note: "The layout only changes at these four; the container is fluid between them.",
    tokens: Object.entries(S.BREAKPOINT).map(([name, [px, u]]) => ({
      name,
      value: `${px}px`,
      usage: u,
    })),
  },
  zIndex: {
    note: "Eight named layers — never write a raw z-index.",
    tokens: Object.entries(S.ZINDEX).map(([name, [v, u]]) => ({
      name,
      value: String(v),
      usage: u,
    })),
  },
};
fs.writeFileSync(`${OUT}/tokens.json`, `${JSON.stringify(tokens, null, 2)}\n`);

// ---------- 5. tokens.css (as the page compiles it) ----------
const colorVal = (v: string) =>
  /^\{(.+)\}$/.test(v) ? `var(--${v.slice(1, -1)})` : v;
let css = `/* Infragistics Design System — generated from tokens.json */\n\n:root, [data-theme="light"] {\n`;
for (const t of colorTokens) css += `  --${t.name}: ${colorVal(t.value)};\n`;
for (const t of tokens.shadow.tokens) css += `  --${t.name}: ${t.value};\n`;
css += "}\n\n:root {\n";
for (const fam of [
  "spacing",
  "radius",
  "size",
  "opacity",
  "weight",
  "gradient",
  "breakpoint",
  "zIndex",
] as const)
  for (const t of tokens[fam].tokens)
    css += `  --${t.name}: ${colorVal(String(t.value))};\n`;
for (const [k, v] of Object.entries(S.FAMILIES))
  css += `  --font-${k}: ${v};\n`;
css += "}\n\n";
for (const f of FONTS)
  css += `@font-face { font-family: '${f.family}'; src: url('fonts/${f.file}') format('woff2'); font-weight: ${f.weight}; font-style: ${f.style}; font-display: swap; }\n`;
css += "\n";
fs.writeFileSync(`${OUT}/tokens.css`, css);

// ---------- 6. theme.css ----------
let b = `/* Infragistics Design System — theme.css
   Loaded after tokens.css. This file is the live layer of the igniteui-theming engine:
   1. the engine's own variables (--ig-*): sizing, spacing, roundness, elevations, typography, contrast;
   2. the tokens that must stay live — spacing, sizes, radii, shadows, gradients, translucent colours —
      declared again with the same names as tokens.json, so --ig-size, --ig-spacing, --ig-radius-factor,
      --ig-elevation-factor and palette edits cascade. At the default knob values they equal tokens.json;
   3. the semantic type variables and classes (.igd-type-<role>), motion and keyframes.
   Element styles (body, headings, links, focus) are in base.css.
   Nothing in a component may carry a literal colour, length, font size, shadow or radius: it reads a token. */

/* ===== 1. igniteui-theming engine layer ===== */
`;
// The compiled layout stylesheet holds one :root, [data-size] rule (sizable() and pad()) and the :root rules (border-radius(), easing, elevations).
const layoutRules = [...layoutCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(
  (m) => ({
    selector: m[1].trim(),
    body: m[2].replace(/^\n+|\s+$/g, ""),
  }),
);
const sized = layoutRules.filter((r) => r.selector !== ":root");
if (sized.length !== 1 || layoutRules.length < 2)
  throw new Error(
    "layout stylesheet: one sized rule and at least one :root rule expected",
  );
let typography = "  --ig-font-family: var(--font-body);\n";
for (const [slot, , , fam] of S.TYPE) {
  if (!S.ENGINE_TYPE_SLOTS.includes(slot)) continue;
  const t = type[slot];
  typography += `  --ig-${slot}-font-family: var(--font-${fam});\n`;
  for (const p of [
    "font-size",
    "font-weight",
    "font-style",
    "line-height",
    "letter-spacing",
    "text-transform",
  ])
    typography += `  --ig-${slot}-${p}: ${t[p]};\n`;
}
b += `:root {
  /* The dials are left unset, so a site sets them for itself. Unset, the tokens resolve at their design values: --ig-size large, --ig-spacing 1, --ig-elevation-factor 1, and each radius role at its own value (--ig-radius-factor from 0, each role's minimum, to 1, its maximum). */
  /* one shadow colour behind every neutral elevation */
  --color-shadow: oklch(0 0 0);
  /* roundness, easing and neutral elevations: compiled from the engine's border-radius() and elevations() */
${layoutRules
  .filter((r) => r.selector === ":root")
  .map((r) => r.body)
  .join("\n")}
  /* typography: engine slot variables, compiled from the engine's typography() with the type scale in spec.ts */
${typography}}
`;
// The rest of the engine's palette(): every *-contrast variable, and the shades and roles the raw tier above does not list.
// With them the package declares each custom property the engine's palette() emits, so an Ignite UI component finds its colours.
const declared = new Set(
  [...css.matchAll(/^\s*--([\w-]+):/gm)].map((m) => m[1]),
);
const enginePalette = [
  ...sass(
    "palette",
    `@use 'igniteui-theming' as *;\n$p: ${sets.light};\n@include palette($p);\n`,
  ).matchAll(/^\s*--(ig-[\w-]+): ([^;]+);/gm),
].filter((m) => !declared.has(m[1]) && !/^ig-(wcag|contrast-level)/.test(m[1]));
if (!enginePalette.some((m) => m[1] === "ig-primary-500-contrast"))
  throw new Error("palette(): no contrast variables emitted");
b += `/* contrast colours, exactly as the engine's palette() emits them */\n:root, [data-theme] {\n${adaptiveContrast.map((d) => `  ${d}`).join("\n")}\n}\n/* the rest of the engine's palette(): contrast colours, accent shades, surface shades and seeds */\n:root, [data-ig-scope] {\n${enginePalette.map((m) => `  --${m[1]}: ${m[2]};`).join("\n")}\n}\n`;
b += `/* sizing and spacing: compiled from the engine's sizable() and pad() */\n${sized[0].selector} {\n${sized[0].body}\n}\n`;
b += `/* elevations tinted with the action colour: the engine's indigo preset compiled with its $color-1..3, published under the design system's own names */\n:root {\n${tintUsed.map((l) => `  --elevation-tint-${l}: ${tintVars[l]};`).join("\n")}\n}\n`;
b +=
  "\n/* ===== 2. live tokens (same names as tokens.json) ===== */\n:root {\n";
for (const [n, [liveVal]] of Object.entries(SHADOWS)) {
  if (n === "callout-release-shadow")
    b += `  --${n}: inset 0 0 0 var(--border-width-default) var(--color-emphasis-ring), var(--elevation-tint-13);\n`;
  else if (n === "callout-release-shadow-hover")
    b += `  --${n}: inset 0 0 0 var(--border-width-default) var(--color-emphasis-ring-hover), var(--elevation-tint-16);\n`;
  else b += `  --${n}: ${liveVal};\n`;
}
for (const l of Object.keys(elevNeutral))
  b += `  --elevation-${l}: var(--ig-elevation-${l});\n`;
for (const [n, [, lv]] of Object.entries(GRAD)) b += `  --${n}: ${lv};\n`;
for (const [n, [base, op, stop]] of Object.entries(GLOWS))
  b += `  --${n}: ${glow(base, op, stop)[1]};\n`;
for (const [n, [base, op]] of Object.entries(S.ALPHA))
  b += `  --${n}: hsl(from var(--${base}) h s l / var(--${op}));\n`;
b +=
  "  --gradient-border-bundle: linear-gradient(var(--color-surface-card), var(--color-surface-card)) padding-box, linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary)) border-box;\n";
b +=
  "  --gradient-emphasis: linear-gradient(180deg, hsl(from var(--color-accent-primary) h s l / var(--opacity-subtle)), hsl(from var(--color-accent-inverse) h s l / var(--opacity-faint)));\n";
b +=
  "  --footer-card-background: linear-gradient(180deg, hsl(from var(--color-text-inverse) h s l / var(--opacity-faint)), transparent);\n";
b += `  --container-gutter: clamp(var(--space-lg), 4vw, var(--space-4xl)); /* @kind spacing */\n  --space-section: ${sectionSpace}; /* @kind spacing */\n  --layout-split: 0.95fr 1.05fr; /* @kind other */\n`;
b += "  --nav-backdrop-blur: blur(var(--space-sm));\n";
b += `}\n\n/* ===== 3. motion, type variables and classes ===== */\n:root {\n  /* motion */\n  --duration-chip: 140ms;\n  --duration-fast: 160ms;\n  --duration-button: 180ms;\n  --duration-slow: 320ms;
  --duration-float: 5000ms;\n  --duration-spin: 800ms;\n  --easing-linear: linear;\n  --transition-default: all var(--duration-fast) var(--easing-default);\n}\n/* type roles, declared again on a region that picks a type set */\n:root, [data-igd-type] {\n`;
const TYPE_PROPS = [
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "text-transform",
];
// A role reads its engine slot. A role the engine has no slot for holds the compiled value itself.
for (const [slot, name, , fam] of S.TYPE)
  for (const p of TYPE_PROPS) {
    const own = p === "font-family" ? `var(--font-${fam})` : type[slot][p];
    b += `  --type-${name}-${p}: ${S.ENGINE_TYPE_SLOTS.includes(slot) ? `var(--ig-${slot}-${p})` : own};\n`;
  }
b += "}\n";
for (const [, name] of S.TYPE)
  b += `.igd-type-${name} { ${TYPE_PROPS.map((p) => `${p}: var(--type-${name}-${p});`).join(" ")} }\n`;
const SET_PROPS = TYPE_PROPS.filter((p) => p !== "font-family");
for (const [set, slots] of Object.entries(typeSets)) {
  b += `/* type set "${set}": the same roles at other sizes. Put data-igd-type="${set}" on the page, or on a region. */\n[data-igd-type="${set}"] {\n`;
  for (const [slot, name] of S.TYPE)
    for (const p of SET_PROPS)
      b += `  --${S.ENGINE_TYPE_SLOTS.includes(slot) ? `ig-${slot}` : `type-${name}`}-${p}: ${slots[slot][p]};\n`;
  b += "}\n";
}
b += `
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
.igd-hide-below-md { }
@media (max-width: ${S.BREAKPOINT["breakpoint-md"][0]}px) { .igd-hide-below-md { display: none !important; } }
`;
// ---------- 7. derived colour: every state follows its base token ----------
{
  let s =
    "\n/* ===== 5. derived colour ===== */\n/* everything below is re-declared on [data-ig-scope], so a region can carry its own base colours */\n:root, [data-ig-scope] {\n";
  // ---- state tokens derive from their base token, not from a ramp step of their own ----
  // The delta is measured at build time between the engine's two values, so the default is the engine's colour exactly,
  // and overriding the base moves the state with it.
  const hx = (n: string): string => {
    const m = css.match(new RegExp(`--${n}: ([^;]+);`));
    if (!m) throw new Error(`no token ${n}`);
    const v = m[1].trim();
    const r = v.match(/^var\(--([a-z0-9-]+)\)$/);
    return r ? hx(r[1]) : v;
  };
  const ok = (hex: string) => {
    const v = [1, 3, 5].map((i) => {
      const x = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
      return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    const l = Math.cbrt(
      0.4122214708 * v[0] + 0.5363325363 * v[1] + 0.0514459929 * v[2],
    );
    const m = Math.cbrt(
      0.2119034982 * v[0] + 0.6806995451 * v[1] + 0.1073969566 * v[2],
    );
    const q = Math.cbrt(
      0.0883024619 * v[0] + 0.2817188376 * v[1] + 0.6299787005 * v[2],
    );
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * q;
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * q;
    return {
      l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * q,
      c: Math.hypot(A, B),
      h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360,
    };
  };
  const DERIVED = [
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
    ["badge-bundle-background", "badge-bundle-color"],
    // pairs that belong together share one base
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
  const ALIAS = [
    ["table-header-sub-highlight-color", "color-action-on"],
    ["color-link-utility-hover", "color-action-text"],
    ["color-focus-default", "color-action-text"],
    ["tile-1", "color-accent-primary"],
    ["tile-2", "color-accent-secondary"],
    ["tile-7", "color-action-default"],
    ["color-link-inverse", "color-accent-inverse"],
    ["footer-icon", "footer-text"],
  ];
  // semantic tokens that point straight at a ramp step are declared again here, so a scope with its own ramp re-resolves them
  const textSafe: string[] = [];
  // --theme-dark is 0 in the light theme and 1 under [data-theme="dark"]; every theme-dependent formula blends on it, so a
  // token re-declared inside a scope still lands on the right side.
  const F = "var(--theme-dark)";
  // Mirrored by as-text() in the guard stylesheet, which computes the published value.
  const textExpr = (from: string, L: number) => {
    const Tl = `min(l, max(0.35, ${L} - 0.6 * max(0, l - ${L})))`;
    const Td = "max(l, min(0.92, 0.74 + 0.6 * max(0, 0.74 - l)))";
    return `oklch(from ${from} calc((1 - ${F}) * ${Tl} + ${F} * ${Td}) calc(c * ((1 - ${F}) * ${Tl} / max(l, 0.0001) + ${F} * min(1, (1 - ${Td}) / max(1 - l, 0.0001)))) h)`;
  };
  {
    const taken = new Set([
      ...DERIVED.map((d) => d[0]),
      ...ALIAS.map((d) => d[0]),
      "color-action-text",
    ]);
    s +=
      "  /* semantic tokens that alias a ramp step, and the text colours taken from an accent palette */\n";
    for (const m of css.matchAll(
      /^\s*--([a-z0-9-]+): (var\(--ig-(?!dark-|gray-|surface-)[a-z-]+-(?:\d+|seed)\)|#[0-9a-f]{6});/gm,
    ))
      if (
        !m[1].startsWith("ig-") &&
        !taken.has(m[1]) &&
        (m[2].startsWith("var(") || inlined.has(m[1]))
      ) {
        // a token that is text on a light surface keeps its own lightness as a ceiling, so a lighter ramp step set on a scope cannot make it unreadable
        const o = ok(hx(m[1]));
        const isText =
          /^(color-text|color-link)|-color$|^color-feedback-error-default$/.test(
            m[1],
          ) &&
          o.l < 0.6 &&
          o.c > 0.005;
        if (isText) {
          const L = Math.ceil(o.l * 1e4) / 1e4;
          s += `  --${m[1]}: ${textExpr(m[2], L)};\n`;
          textSafe.push(m[1]);
        } else if (m[2].startsWith("var(")) s += `  --${m[1]}: ${m[2]};\n`;
      }
  }
  s +=
    "  /* state tokens: derived from their base. Override a base and its states follow. */\n";
  const derivedRecord: Named<object> = {};
  // the action colour as text: the action colour itself while it clears AA on the light surfaces, otherwise darkened to the first primary step that does
  {
    const L = Math.ceil(ok(hexOf(actionTextSource)).l * 1e4) / 1e4;
    // action colours lighter than the brand are darkened a little past it (0.6 for each step of extra lightness, never below 0.35),
    // because yellow, green and cyan are brighter to the eye than blue at the same OKLCH lightness
    s += `  --color-action-text: ${textExpr("var(--color-action-default)", L)};\n`;
    derivedRecord["color-action-text"] = {
      base: "color-action-default",
      maxL: L,
    };
  }
  for (const [tok, base] of DERIVED) {
    const a = ok(hx(base));
    const z = ok(hx(tok));
    const chroma = a.c > 0.005;
    const dl = (z.l - a.l).toFixed(4);
    const kc = chroma ? (z.c / a.c).toFixed(4) : "1";
    const dh =
      chroma && z.c > 0.005
        ? (((z.h - a.h + 540) % 360) - 180).toFixed(2)
        : "0";
    // a grey base has no hue to shift, so the state takes the engine's own chroma and hue and follows the base in lightness only
    // a light surface or hairline stays light whatever the base's lightness: it takes the base's hue and a share of its chroma, never its darkness
    const fixedL = z.l > 0.8 && /(background|surface|border)/.test(tok);
    const Ld = Math.min(0.42, 0.2 + (1 - z.l) * 1.3).toFixed(4);
    s +=
      fixedL && chroma
        ? `  --${tok}: oklch(from var(--${base}) calc((1 - ${F}) * ${z.l.toFixed(4)} + ${F} * ${Ld}) calc(c * ${kc} * (1 + 1.5 * ${F})) calc(h + ${dh}));\n`
        : chroma
          ? `  --${tok}: oklch(from var(--${base}) calc(l + ${dl}) calc(c * ${kc}) calc(h + ${dh}));\n`
          : `  --${tok}: oklch(from var(--${base}) calc(l + ${dl}) ${z.c.toFixed(4)} ${z.h.toFixed(2)});\n`;
    derivedRecord[tok] =
      fixedL && chroma
        ? { base, l: +z.l.toFixed(4), kc: +kc, dh: +dh }
        : { base, dl: +dl, kc: +kc, dh: +dh };
  }
  for (const [tok, base] of ALIAS) {
    if (hx(tok) !== hx(base))
      throw new Error(`alias ${tok} is not ${base} in the engine`);
    s += `  --${tok}: var(--${base});\n`;
    derivedRecord[tok] = { base, alias: true };
  }
  fs.writeFileSync(
    `${REP}/derived-states.json`,
    JSON.stringify(derivedRecord, null, 2),
  );
  s += `  /* label on the action fill: the engine's adaptive-contrast(), black or white by luminance at the WCAG AA threshold */\n  --color-action-on: hsla(from color(from var(--color-action-default) var(--y-contrast)) h 0 l / 1);\n}\n`;
  // the glyph on an icon tile: black or white, picked from the tile's own fill
  s += `[data-ig="icon-tile"] { --tile-fill: var(--tile-1); --tile-on: hsla(from color(from var(--tile-fill) var(--y-contrast)) h 0 l / 1); }\n`;
  b += s;
  // one shadow colour behind every neutral elevation
  b = b.replace(
    /(--ig-elevation-\d+: [^;]+;|--shadow-(?:popover-filter|raised): [^;]+;)/g,
    (l) =>
      l.replace(
        /rgba\(0, ?0, ?0, ?([\d.]+)\)/g,
        "hsl(from var(--color-shadow) h s l / $1)",
      ),
  );
  // the live colour tokens and tinted elevations resolve again inside a scope
  const mark = "/* ===== 2. live tokens";
  if (!b.includes(mark) || !b.includes("\n:root {\n  --elevation-tint-1:"))
    throw new Error("scope anchors moved");
  b = b.replace(
    "\n:root {\n  --elevation-tint-1:",
    "\n:root, [data-ig-scope] {\n  --elevation-tint-1:",
  );
  const i = b.indexOf(mark);
  const j = b.indexOf("\n:root {", i);
  b =
    b.slice(0, j) +
    "\n:root, [data-ig-scope] {" +
    b.slice(j + "\n:root {".length);
  // tinted elevations carry the action colour, not a fixed rgb
  b = b.replace(/(--elevation-tint-\d+: [^;]+;)/g, (l) =>
    l.replace(
      new RegExp(
        `rgba\\(${rgbOf(hexOf("ig-primary-600")).join(", ")}, ([\\d.]+)\\)`,
        "g",
      ),
      "hsl(from var(--color-action-default) h s l / $1)",
    ),
  );
}
// ===== 6. dark theme: the engine's dark palette =====
{
  b = b.replaceAll(
    ":root, [data-ig-scope] {",
    ":root, [data-ig-scope], [data-theme] {",
  );
  const neutral = Object.entries(S.ALIAS).filter(
    ([n, [eng]]) => /^ig-(gray|surface)-/.test(eng) && n !== "color-action-on",
  );
  b += `\n/* ===== 6. themes ===== */\n:root, [data-theme="light"] { --theme-dark: 0; }\n`;
  b += `/* neutral roles, declared again so a themed region or a scope resolves them against its own grey and surface ramps */\n:root, [data-ig-scope], [data-theme] {\n${neutral.map(([n, [eng]]) => `  --${n}: var(--${eng});`).join("\n")}\n}\n`;
  b += `/* dark: the light grey and surface ramps are swapped for the engine's dark palette (palette() with a dark surface and a light grey).\n   Every semantic name keeps its meaning. Brand fills keep the seed; text, outlines, tints and hairlines switch through --theme-dark. */\n[data-theme="dark"] {\n  --theme-dark: 1; color-scheme: dark;\n`;
  for (const s of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900])
    b += `  --ig-gray-${s}: ${P.dark[`gray-${s}`]};\n`;
  for (const r of ["base", "sunken", "raised", "overlay"])
    b += `  --ig-surface-${r}: ${P.dark[`surface-${r}`]};\n`;
  b +=
    "}\n[data-theme] { background-color: var(--color-surface-page); color: var(--color-text-primary); }\n";
}
const bpSub = (t: string) =>
  t.replace(
    /\{\{(breakpoint-[a-z]+)\}\}/g,
    (_, k: string) => `${S.BREAKPOINT[k][0]}px`,
  );
// theme.css is the package: tokens, live layers and base styles. The reference components keep their own stylesheet.
fs.writeFileSync(`${OUT}/theme.css`, b);
// base.css: element styles for a site that has none of its own. Optional; loaded after theme.css.
const base = `/* Infragistics Design System — base.css
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
fs.writeFileSync(`${OUT}/base.css`, base);
fs.writeFileSync(
  ".cache/components.css",
  bpSub(fs.readFileSync("reference/components.css", "utf8")),
);
fs.writeFileSync(
  `${REP}/contrast-report.json`,
  JSON.stringify(report, null, 1),
);
fs.writeFileSync(
  `${REP}/contrast-pairs.json`,
  JSON.stringify([
    ...CHECKS.filter(
      (c) =>
        !(c[0] === "color-action-default" && (c[2] ?? 4.5) === 4.5) &&
        c[0] !== "color-action-active",
    ),
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
  ]),
);
fs.writeFileSync(
  `${REP}/engine-snapshot.json`,
  JSON.stringify(
    {
      type,
      elevNeutral,
      tintVars,
    },
    null,
    1,
  ),
);
console.log(
  "tokens: colors",
  colorTokens.length,
  "| shadows",
  tokens.shadow.tokens.length,
  "| spacing",
  tokens.spacing.tokens.length,
  "| size",
  tokens.size.tokens.length,
);
console.log("theme.css bytes", b.length, "| tokens.css bytes", css.length);
const bad = report.filter((r) => !r.ok);
console.log("contrast checks:", report.length, "failing:", bad.length);
for (const r of bad)
  console.log("  FAIL", r.fg, "on", r.bg, r.ratio, "<", r.min);
