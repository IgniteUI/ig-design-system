// node src/showcase.ts <tokens.json> <out.html>
// Writes the token showcase: one static page that lists every token with its rendered value,
// in the light and the dark theme and in each type set. A filter and a section list make a token quick to find.
import fs from "node:fs";
import { isMain } from "./main.ts";
import { cssVar } from "./namespace.ts";
import type { Token, Tokens } from "./types.ts";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
/** Escapes a usage note and turns its backticked names into <code>. */
export const prose = (s: string) =>
  esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");

/** Splits a usage note into its first sentence and the rest. A full stop inside backticks or a number does not end it. */
export const lead = (s: string): [first: string, rest: string] => {
  const m = s.match(/^((?:`[^`]*`|[^.`]|\.(?=\S))+\.)\s+(.+)$/s);
  return m ? [m[1], m[2]] : [s, ""];
};

const RAW_FAMILIES = [
  "primary",
  "secondary",
  "gray",
  "surface",
  "info",
  "success",
  "warn",
  "error",
];
const COLOR_GROUPS: [key: string, title: string][] = [
  ["action", "Action"],
  ["text", "Text"],
  ["surface", "Surface"],
  ["border", "Border"],
  ["accent", "Accent"],
  ["link", "Link"],
  ["focus", "Focus"],
  ["feedback", "Feedback"],
];
// How a colour is previewed: as text, as an outline, or as a fill.
const TEXT_GROUPS = ["text", "link"];
const OUTLINE_GROUPS = ["border", "focus"];

/** Sorts the colour tokens into the raw ramps, the semantic groups and the component tier. */
export const groupColors = (tokens: Token[]) => {
  const raw: Record<string, Token[]> = {};
  const semantic: Record<string, Token[]> = {};
  const component: Token[] = [];
  for (const t of tokens) {
    const family = t.name.match(/^ig-([a-z]+)-/)?.[1];
    if (family) {
      raw[family] ??= [];
      raw[family].push(t);
    } else if (t.name.startsWith("color-")) {
      const key = t.name.split("-")[1];
      const group = COLOR_GROUPS.some(([k]) => k === key) ? key : "other";
      semantic[group] ??= [];
      semantic[group].push(t);
    } else component.push(t);
  }
  return { raw, semantic, component };
};

// The name of a token is a button: it copies var(--name). The published prefix is dimmed so the eye lands on the name.
const name = (token: string) => {
  const v = cssVar(token);
  const prefix = v.match(/^--igd?-/)?.[0] ?? "--";
  return `<button type="button" class="name" data-copy="var(${v})"><span class="prefix">${prefix}</span>${v.slice(prefix.length)}</button>`;
};

// The first sentence of a note is always shown; the rest opens on demand.
const note = (usage: string) => {
  if (!usage) return "";
  const [first, rest] = lead(usage);
  return `<p class="note">${prose(first)}</p>${rest ? `<details class="more"><summary>More</summary><p class="note">${prose(rest)}</p></details>` : ""}`;
};

const colorCard = (kind: "fill" | "text" | "outline") => (t: Token) => {
  const v = `var(${cssVar(t.name)})`;
  const preview =
    kind === "text"
      ? `<span class="preview text" style="color: ${v}" aria-hidden="true">Aa</span>`
      : kind === "outline"
        ? `<span class="preview outline" style="border-color: ${v}" aria-hidden="true"></span>`
        : `<span class="preview" style="background: ${v}" aria-hidden="true"></span>`;
  return `<li class="token" data-token="${t.name}" data-kind="color">${preview}${name(t.name)}<output data-color="${cssVar(t.name)}"></output>${note(t.usage)}</li>`;
};

const row = (t: Token, value: string, extra = "") =>
  `<tr data-token="${t.name}"><th scope="row">${name(t.name)}</th><td class="value">${value}</td><td>${extra}${note(t.usage)}</td></tr>`;

const table = (id: string, head: string[], rows: string) =>
  `<div class="table" tabindex="0" role="region" aria-labelledby="${id}"><table><thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;

type Section = { id: string; title: string; count: number; html: string };

/** Builds the page from tokens.json. */
export const showcase = (T: Tokens) => {
  const { raw, semantic, component } = groupColors(T.color.tokens);
  const steps = (family: string) =>
    (raw[family] ?? []).filter((t) => /-(\d+)$/.test(t.name));
  const groups = COLOR_GROUPS.concat([["other", "Other"]]).filter(
    ([key]) => semantic[key],
  );
  const kindOf = (key: string) =>
    TEXT_GROUPS.includes(key)
      ? "text"
      : OUTLINE_GROUPS.includes(key)
        ? "outline"
        : "fill";
  const styles = T.type.groups.flatMap((g) => g.styles);
  const spaceSteps = T.spacing.tokens.filter((t) =>
    /^space-\d?[a-z]+$/.test(t.name),
  );
  const shadows = T.shadow.tokens.filter(
    (t) => /^shadow-/.test(t.name) && !t.name.endsWith("-filter"),
  );
  const families = RAW_FAMILIES.filter((f) => steps(f).length);
  const bp = (n: string) =>
    T.breakpoint.tokens.find((t) => t.name === n)?.value ?? "1024px";

  const sections: Section[] = [
    {
      id: "colour",
      title: "Colour",
      count: Object.values(semantic).flat().length + component.length,
      html:
        `<p class="intro">Site code uses these. A name says what the colour is for.</p>` +
        groups
          .map(
            ([key, title]) =>
              `<div class="group"><h3>${title}</h3><ul class="tokens">${semantic[key].map(colorCard(kindOf(key))).join("")}</ul></div>`,
          )
          .join("") +
        `<details class="group fold"><summary><h3>Component colours</h3><span class="count">${component.length}</span></summary><ul class="tokens">${component.map(colorCard("fill")).join("")}</ul></details>`,
    },
    {
      id: "palette",
      title: "Engine palette",
      count: families.reduce((n, f) => n + steps(f).length, 0),
      html:
        `<p class="intro">The raw tier, under the engine's names. Only the design system reaches in here. Each step is labelled in its contrast colour.</p>` +
        `<ul class="ramps">${families
          .map(
            (f) =>
              `<li data-token="ig-${f}"><span class="family"><span class="prefix">--ig-</span>${f}</span><ol class="ramp">${steps(
                f,
              )
                .map(
                  (t) =>
                    `<li><button type="button" class="step" style="background: var(${cssVar(t.name)}); color: var(${cssVar(`${t.name}-contrast`)})" data-copy="var(${cssVar(t.name)})" aria-label="${cssVar(t.name)}">${t.name.split("-").pop()}</button></li>`,
                )
                .join("")}</ol></li>`,
          )
          .join("")}</ul>`,
    },
    {
      id: "type",
      title: "Type",
      count: styles.length,
      html:
        `<p class="intro">Fifteen roles. The readout is the size, line height and weight as rendered right now: resize the window or switch the type set.</p>` +
        `<ul class="specimens">${styles
          .map(
            (st) =>
              `<li data-token="${st.name}"><div class="spec"><button type="button" class="name" data-copy="igd-${st.name}"><span class="prefix">.igd-</span>${st.name}</button><output data-type="igd-${st.name}"></output></div><div><p class="sample igd-${st.name}">${esc(st.sample)}</p>${note(st.usage)}</div></li>`,
          )
          .join("")}</ul>`,
    },
    {
      id: "spacing",
      title: "Spacing",
      count: spaceSteps.length,
      html:
        `<p class="intro">The raw steps. A component uses the roles built on them: <code>space-inset-*</code> for padding, <code>space-stack-*</code> for vertical margins, <code>space-gap-*</code> for gaps.</p>` +
        table(
          "spacing",
          ["Step", "Value", "Size"],
          spaceSteps
            .map(
              (t) =>
                `<tr data-token="${t.name}"><th scope="row">${name(t.name)}</th><td class="value"><output data-length="${cssVar(t.name)}"></output></td><td><span class="bar" style="inline-size: var(${cssVar(t.name)})"></span></td></tr>`,
            )
            .join(""),
        ),
    },
    {
      id: "radius",
      title: "Radius",
      count: T.radius.tokens.length,
      html: `<p class="intro">Each role has a design value and a range it stays within.</p><ul class="tokens">${T.radius.tokens
        .map(
          (t) =>
            `<li class="token" data-token="${t.name}"><span class="preview outline" style="border-radius: var(${cssVar(t.name)})" aria-hidden="true"></span>${name(t.name)}<output data-length="${cssVar(t.name)}"></output>${note(t.usage)}</li>`,
        )
        .join("")}</ul>`,
    },
    {
      id: "shadow",
      title: "Shadow",
      count: shadows.length,
      html: `<p class="intro">Built from the engine's elevations. The accent shadows take the action colour.</p><ul class="tokens roomy">${shadows
        .map(
          (t) =>
            `<li class="token" data-token="${t.name}"><span class="preview lifted" style="box-shadow: var(${cssVar(t.name)})" aria-hidden="true"></span>${name(t.name)}${note(t.usage)}</li>`,
        )
        .join("")}</ul>`,
    },
    {
      id: "gradient",
      title: "Gradient",
      count: T.gradient.tokens.length,
      html: `<p class="intro">Three uses only: clipped headline text, the hero wash and glows, and the footer.</p><ul class="tokens">${T.gradient.tokens
        .map(
          (t) =>
            `<li class="token" data-token="${t.name}"><span class="preview" style="background: var(${cssVar(t.name)})" aria-hidden="true"></span>${name(t.name)}${note(t.usage)}</li>`,
        )
        .join("")}</ul>`,
    },
    {
      id: "size",
      title: "Size",
      count: T.size.tokens.length,
      html:
        `<p class="intro">Control heights, icon sizes, widths and letter spacing.</p>` +
        table(
          "size",
          ["Token", "Value", "Use"],
          T.size.tokens.map((t) => row(t, esc(t.value))).join(""),
        ),
    },
    {
      id: "other",
      title: "Opacity, weight, layers, breakpoints",
      count:
        T.opacity.tokens.length +
        T.weight.tokens.length +
        T.zIndex.tokens.length +
        T.breakpoint.tokens.length,
      html: table(
        "other",
        ["Token", "Value", "Use"],
        [
          ...T.opacity.tokens,
          ...T.weight.tokens,
          ...T.zIndex.tokens,
          ...T.breakpoint.tokens,
        ]
          .map((t) => row(t, esc(t.value)))
          .join(""),
      ),
    },
  ];
  const sets = Object.keys(T.type.sets);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Token showcase</title>
<!-- Generated by src/showcase.ts from dist/tokens.json. Do not edit by hand. -->
<script>
// Applies the stored theme before the first paint; with none stored the page follows the system.
(function () {
  var stored = null;
  try { stored = localStorage.getItem("igd-showcase-theme"); } catch (e) {}
  var dark = stored ? stored === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
})();
</script>
<link rel="stylesheet" href="../dist/fonts.css">
<link rel="stylesheet" href="../dist/tokens.css">
<link rel="stylesheet" href="../dist/theme.css">
<link rel="stylesheet" href="../dist/base.css">
<style>
html { scroll-padding-block-start: calc(var(--igd-nav-height) + var(--igd-space-stack-md)); }
button { font: inherit; color: inherit; }
code, output, .name, .family, .value { font-family: var(--igd-font-mono); font-size: var(--igd-type-body-xs-font-size); }
.prefix { color: var(--igd-color-text-muted); }

/* top bar */
.top { position: sticky; inset-block-start: 0; z-index: var(--igd-z-index-sticky); display: flex; flex-wrap: wrap; align-items: center; gap: var(--igd-space-gap-sm) var(--igd-space-gap-lg); min-block-size: var(--igd-nav-height); padding: var(--igd-space-inset-xs) var(--igd-container-gutter); background: var(--igd-nav-background); backdrop-filter: var(--igd-nav-backdrop-blur); border-block-end: var(--igd-border-width-default) solid var(--igd-color-border-default); }
.top h1 { font-size: var(--igd-type-title-md-font-size); line-height: var(--igd-type-title-md-line-height); font-weight: var(--igd-type-title-md-font-weight); }
.top .find { flex: 1; display: flex; align-items: center; gap: var(--igd-space-gap-sm); min-inline-size: var(--igd-field-min-width); }
.top input { flex: 1; max-inline-size: var(--igd-newsletter-min-width); min-block-size: var(--igd-size-control-md); padding: var(--igd-space-inset-2xs) var(--igd-space-inset-md); border: var(--igd-border-width-default) solid var(--igd-color-border-control); border-radius: var(--igd-radius-full); background: var(--igd-color-surface-card); color: var(--igd-color-text-primary); font: inherit; }
.top .matches { color: var(--igd-color-text-muted); font-size: var(--igd-type-body-sm-font-size); }
.switches { display: flex; flex-wrap: wrap; gap: var(--igd-space-gap-xs); }
.switches button { min-block-size: var(--igd-size-control-sm); padding: var(--igd-space-inset-2xs) var(--igd-space-inset-md); border: var(--igd-border-width-default) solid var(--igd-color-border-control); border-radius: var(--igd-radius-full); background: transparent; color: var(--igd-color-text-ui); font-size: var(--igd-type-body-sm-font-size); font-weight: var(--igd-font-weight-semibold); cursor: pointer; }
.switches button[aria-pressed="true"] { background: var(--igd-color-action-default); border-color: var(--igd-color-action-default); color: var(--igd-color-action-on); }

/* page */
.layout { display: grid; grid-template-columns: var(--igd-field-min-width) minmax(0, 1fr); gap: var(--igd-space-gap-3xl); max-inline-size: var(--igd-container-max-width); margin-inline: auto; padding: var(--igd-space-inset-xl) var(--igd-container-gutter) var(--igd-space-inset-5xl); }
.sections { position: sticky; inset-block-start: calc(var(--igd-nav-height) + var(--igd-space-stack-xl)); align-self: start; scroll-target-group: auto; }
.sections ul { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--igd-space-gap-3xs); }
.sections a { display: flex; justify-content: space-between; gap: var(--igd-space-gap-sm); padding: var(--igd-space-inset-xs) var(--igd-space-inset-sm); border-inline-start: var(--igd-focus-ring-width) solid transparent; border-radius: var(--igd-radius-xs); color: var(--igd-color-text-secondary); font-size: var(--igd-type-body-sm-font-size); }
.sections a:hover { color: var(--igd-color-text-heading); background: var(--igd-color-surface-subtle); }
.sections a:is(:target-current, .target-current) { color: var(--igd-color-text-heading); font-weight: var(--igd-font-weight-semibold); border-inline-start-color: var(--igd-color-action-default); background: var(--igd-color-surface-subtle); }
.count { color: var(--igd-color-text-muted); font-family: var(--igd-font-mono); font-size: var(--igd-type-body-2xs-font-size); }

main { container-type: inline-size; min-inline-size: 0; }
main > section { margin-block-end: var(--igd-space-stack-5xl); }
main > section:focus { outline: none; }
h2 { display: flex; align-items: baseline; gap: var(--igd-space-gap-sm); font-size: var(--igd-type-display-sm-font-size); line-height: var(--igd-type-display-sm-line-height); font-weight: var(--igd-type-display-sm-font-weight); }
h3 { font-family: var(--igd-font-body); font-size: var(--igd-type-eyebrow-font-size); letter-spacing: var(--igd-type-eyebrow-letter-spacing); text-transform: uppercase; color: var(--igd-color-text-muted); font-weight: var(--igd-font-weight-semibold); }
.intro { margin-block: var(--igd-space-stack-xs) var(--igd-space-stack-xl); max-inline-size: var(--igd-container-prose-max-width); color: var(--igd-color-text-secondary); }
.group { margin-block-end: var(--igd-space-stack-2xl); }
.group h3 { margin-block-end: var(--igd-space-stack-sm); }
.fold > summary { display: flex; align-items: center; gap: var(--igd-space-gap-sm); cursor: pointer; margin-block-end: var(--igd-space-stack-sm); }
.fold > summary h3 { margin: 0; }

/* a token */
.tokens { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(var(--igd-field-min-width), 1fr)); gap: var(--igd-space-gap-md); }
.tokens.roomy { gap: var(--igd-space-gap-xl); }
.token { display: grid; align-content: start; gap: var(--igd-space-gap-3xs); padding: var(--igd-space-inset-sm); border: var(--igd-border-width-default) solid var(--igd-color-border-subtle); border-radius: var(--igd-radius-md); background: var(--igd-color-surface-card); }
.preview { display: block; block-size: var(--igd-space-5xl); margin-block-end: var(--igd-space-stack-xs); border-radius: var(--igd-radius-sm); border: var(--igd-border-width-default) solid var(--igd-color-border-subtle); }
.preview.text { display: grid; place-items: center; background: var(--igd-color-surface-page); font-family: var(--igd-font-display); font-size: var(--igd-type-display-sm-font-size); font-weight: var(--igd-font-weight-bold); }
.preview.outline { background: var(--igd-color-surface-page); border-width: var(--igd-focus-ring-width); }
.preview.lifted { border-color: transparent; background: var(--igd-color-surface-card); margin: var(--igd-space-stack-sm) var(--igd-space-gap-sm) var(--igd-space-stack-lg); }
.name { justify-self: start; max-inline-size: 100%; padding: var(--igd-space-inset-3xs) var(--igd-space-inset-2xs); margin-inline-start: calc(-1 * var(--igd-space-inset-2xs)); border: 0; border-radius: var(--igd-radius-xs); background: transparent; color: var(--igd-color-text-heading); text-align: start; overflow-wrap: anywhere; cursor: copy; }
.name:hover { background: var(--igd-color-surface-tint); }
output { display: block; color: var(--igd-color-text-secondary); }
.note { margin: 0; font-size: var(--igd-type-body-sm-font-size); line-height: var(--igd-type-body-sm-line-height); color: var(--igd-color-text-muted); }
.more summary { font-size: var(--igd-type-body-xs-font-size); color: var(--igd-color-action-text); cursor: pointer; }

/* ramps */
.ramps { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--igd-space-gap-sm); }
.ramps > li { display: grid; grid-template-columns: var(--igd-space-6xl) minmax(0, 1fr); align-items: center; gap: var(--igd-space-gap-md); }
.ramp { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(10, 1fr); border-radius: var(--igd-radius-sm); overflow: hidden; }
.step { inline-size: 100%; min-block-size: var(--igd-size-control-lg); border: 0; font-family: var(--igd-font-mono); font-size: var(--igd-type-body-2xs-font-size); cursor: copy; }

/* type */
.specimens { list-style: none; margin: 0; padding: 0; }
.specimens > li { display: grid; grid-template-columns: var(--igd-field-min-width) minmax(0, 1fr); gap: var(--igd-space-gap-xl); padding-block: var(--igd-space-inset-lg); border-block-start: var(--igd-border-width-default) solid var(--igd-color-border-subtle); }
.sample { margin: 0 0 var(--igd-space-stack-xs); color: var(--igd-color-text-heading); overflow-wrap: anywhere; }

/* tables */
.table { overflow: auto; }
table { border-collapse: collapse; inline-size: 100%; }
thead th { font-size: var(--igd-type-body-xs-font-size); color: var(--igd-color-text-muted); font-weight: var(--igd-font-weight-semibold); }
th, td { text-align: start; vertical-align: top; padding: var(--igd-space-inset-xs) var(--igd-space-inset-md) var(--igd-space-inset-xs) 0; border-block-end: var(--igd-border-width-default) solid var(--igd-color-border-subtle); font-weight: var(--igd-font-weight-regular); }
.value { white-space: nowrap; color: var(--igd-color-text-secondary); }
.bar { display: block; block-size: var(--igd-space-sm); background: var(--igd-color-action-default); border-radius: var(--igd-radius-xs); }

/* filter and copy feedback */
[hidden] { display: none !important; }
.empty { padding: var(--igd-space-inset-3xl) 0; color: var(--igd-color-text-secondary); }
.toast { position: fixed; inset-block-end: var(--igd-space-xl); inset-inline: 0; margin-inline: auto; inline-size: fit-content; max-inline-size: calc(100% - var(--igd-space-4xl)); padding: var(--igd-space-inset-xs) var(--igd-space-inset-lg); border-radius: var(--igd-radius-full); background: var(--igd-color-surface-inverse); color: var(--igd-color-text-inverse); font-family: var(--igd-font-mono); font-size: var(--igd-type-body-xs-font-size); box-shadow: var(--igd-shadow-floating); opacity: 0; transition: opacity var(--igd-duration-fast) var(--igd-easing-default); pointer-events: none; }
.toast[data-shown] { opacity: 1; }

@container (inline-size < 40rem) {
  .specimens > li, .ramps > li { grid-template-columns: minmax(0, 1fr); gap: var(--igd-space-gap-xs); }
}
@media (max-width: ${bp("breakpoint-lg")}) {
  .layout { grid-template-columns: minmax(0, 1fr); gap: var(--igd-space-gap-lg); }
  .sections { position: static; }
  .sections ul { display: flex; flex-wrap: wrap; gap: var(--igd-space-gap-2xs); }
  .sections a { border-inline-start: 0; border: var(--igd-border-width-default) solid var(--igd-color-border-default); border-radius: var(--igd-radius-full); }
}
</style>
</head>
<body>
<header class="top">
  <h1>Token showcase</h1>
  <div class="find">
    <input type="search" id="filter" placeholder="Filter tokens, e.g. border" aria-label="Filter tokens by name or use" autocomplete="off" spellcheck="false">
    <span class="matches" id="matches" role="status"></span>
  </div>
  <div class="switches">
    <button type="button" id="theme" aria-pressed="false">Dark theme</button>
    ${sets.map((s) => `<button type="button" data-set="${s}" aria-pressed="false">Type set: ${s}</button>`).join("")}
  </div>
</header>
<div class="layout">
<nav class="sections" aria-label="Sections">
  <ul>
    ${sections.map((s) => `<li><a href="#${s.id}"><span>${s.title}</span><span class="count">${s.count}</span></a></li>`).join("\n    ")}
  </ul>
</nav>
<main>
${sections.map((s) => `<section id="${s.id}" tabindex="-1" aria-labelledby="${s.id}-title"><h2 id="${s.id}-title">${s.title} <span class="count">${s.count}</span></h2>${s.html.replace(`aria-labelledby="${s.id}"`, `aria-labelledby="${s.id}-title"`)}</section>`).join("\n")}
<p class="empty" id="empty" hidden>No token matches. Try a shorter word, such as <code>hover</code> or <code>inset</code>.</p>
</main>
</div>
<p class="toast" id="toast" role="status"></p>
<script>
(function () {
  var root = document.documentElement;
  var probe = document.createElement("canvas").getContext("2d");
  function hex(color) {
    probe.clearRect(0, 0, 1, 1); probe.fillStyle = color; probe.fillRect(0, 0, 1, 1);
    var d = probe.getImageData(0, 0, 1, 1).data;
    return "#" + [d[0], d[1], d[2]].map(function (v) { return v.toString(16).padStart(2, "0"); }).join("") + (d[3] < 255 ? " at " + Math.round(d[3] / 2.55) + "%" : "");
  }
  // Writes the rendered value of each token next to its name.
  function read() {
    var el = document.createElement("i"); el.style.position = "absolute"; document.body.appendChild(el);
    document.querySelectorAll("output[data-color]").forEach(function (o) { el.style.backgroundColor = "var(" + o.dataset.color + ")"; o.textContent = hex(getComputedStyle(el).backgroundColor); });
    document.querySelectorAll("output[data-length]").forEach(function (o) { el.style.inlineSize = "var(" + o.dataset.length + ")"; o.textContent = Math.round(parseFloat(getComputedStyle(el).inlineSize) * 100) / 100 + "px"; });
    el.remove();
    document.querySelectorAll("output[data-type]").forEach(function (o) {
      var s = getComputedStyle(document.querySelector(".sample." + o.dataset.type));
      o.textContent = Math.round(parseFloat(s.fontSize) * 10) / 10 + "px / " + Math.round(parseFloat(s.lineHeight) * 10) / 10 + "px, " + s.fontWeight;
    });
  }

  // theme and type set
  var theme = document.getElementById("theme");
  function sync() { theme.setAttribute("aria-pressed", String(root.getAttribute("data-theme") === "dark")); read(); }
  theme.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    // Stored only while it differs from the system, so choosing the system's scheme again follows the system.
    try {
      if ((next === "dark") === matchMedia("(prefers-color-scheme: dark)").matches) localStorage.removeItem("igd-showcase-theme");
      else localStorage.setItem("igd-showcase-theme", next);
    } catch (e) {}
    sync();
  });
  document.querySelectorAll("button[data-set]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (root.getAttribute("data-igd-type") === b.dataset.set) root.removeAttribute("data-igd-type"); else root.setAttribute("data-igd-type", b.dataset.set);
      document.querySelectorAll("button[data-set]").forEach(function (x) { x.setAttribute("aria-pressed", String(root.getAttribute("data-igd-type") === x.dataset.set)); });
      read();
    });
  });

  // filter: a token stays when every word is in its name or its note
  var filter = document.getElementById("filter"), matches = document.getElementById("matches"), empty = document.getElementById("empty");
  var items = [].slice.call(document.querySelectorAll("[data-token]"));
  var haystack = items.map(function (el) { return (el.dataset.token + " " + el.textContent).toLowerCase(); });
  function apply() {
    var words = filter.value.toLowerCase().split(/\\s+/).filter(Boolean), shown = 0;
    items.forEach(function (el, i) { var keep = words.every(function (w) { return haystack[i].indexOf(w) > -1; }); el.hidden = !keep; if (keep) shown++; });
    document.querySelectorAll(".group, main > section").forEach(function (box) { box.hidden = !box.querySelector("[data-token]:not([hidden])"); });
    // A folded group opens while a filter is on, so a match inside it is seen.
    document.querySelectorAll("details.fold").forEach(function (d) { if (words.length) d.open = true; });
    document.querySelectorAll(".sections a").forEach(function (a) { a.parentElement.hidden = document.querySelector(a.getAttribute("href")).hidden; });
    empty.hidden = shown > 0;
    matches.textContent = words.length ? (shown === 1 ? "1 match" : shown + " matches") : "";
  }
  filter.addEventListener("input", apply);
  addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== filter) { e.preventDefault(); filter.focus(); }
    if (e.key === "Escape" && document.activeElement === filter) { filter.value = ""; apply(); }
  });

  // copy: one status element is the visible message and the live region
  var toast = document.getElementById("toast"), timer, last = "";
  function report(message) {
    clearTimeout(timer);
    // VoiceOver skips a message equal to the previous one; a no-break space makes it differ.
    if (message === last) message += "\\u00A0";
    last = message;
    toast.textContent = message; toast.setAttribute("data-shown", "");
    timer = setTimeout(function () { toast.removeAttribute("data-shown"); toast.textContent = ""; }, 2000);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-copy]"); if (!b) return;
    var text = b.dataset.copy;
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(
      function () { report("Copied " + text); },
      function () { report("Copy failed: " + text); }
    );
  });

  // current section: the browser tracks it where it can; elsewhere an observer does
  var links = [].slice.call(document.querySelectorAll(".sections a"));
  function mark(current) { links.forEach(function (a) { a.setAttribute("aria-current", String(a === current)); }); }
  if (CSS.supports("scroll-target-group: auto")) {
    var settle = function () { mark(document.querySelector(".sections a:target-current")); };
    // The pseudo-class updates a frame after the scroll ends, so the link is read a moment later.
    var wait, later = function () { clearTimeout(wait); wait = setTimeout(settle, 150); };
    later(); document.addEventListener("scroll", later, { passive: true }); document.addEventListener("scrollend", later);
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { var on = a.getAttribute("href") === "#" + entry.target.id; a.classList.toggle("target-current", on); a.setAttribute("aria-current", String(on)); });
      });
    }, { rootMargin: "-30% 0px -65% 0px", threshold: 0 });
    document.querySelectorAll("main > section").forEach(function (s) { observer.observe(s); });
  }

  addEventListener("resize", read);
  addEventListener("storage", function (e) {
    if (e.key !== "igd-showcase-theme") return;
    root.setAttribute("data-theme", (e.newValue ? e.newValue === "dark" : matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light");
    sync();
  });
  document.fonts.ready.then(sync);
})();
</script>
</body>
</html>
`;
};

if (isMain(import.meta.url)) {
  const [, , IN, OUT] = process.argv;
  const html = showcase(JSON.parse(fs.readFileSync(IN, "utf8")));
  fs.writeFileSync(OUT, html);
  console.log(`showcase: ${OUT} (${html.length} bytes)`);
}
