// node src/showcase.ts <tokens.json> <out.html>
// Writes the token showcase: one static page that lists every token with its rendered value,
// in the light and the dark theme and in each type set. A filter and a section list make a token quick to find.
import fs from "node:fs";
import { PALETTE_FAMILIES } from "./engine-colors.ts";
import { isMain } from "./main.ts";
import { cssVar } from "./namespace.ts";
import { esc, page } from "./page.ts";
import type { Token, Tokens, TypeStyle } from "./types.ts";

/** Escapes a usage note and turns its backticked names into <code>. */
export const prose = (s: string) =>
  esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");

/** Splits a usage note into its first sentence and the rest. A full stop inside backticks or a number does not end it. */
export const lead = (s: string): [first: string, rest: string] => {
  const m = s.match(/^((?:`[^`]*`|[^.`]|\.(?=\S))+\.)\s+(.+)$/s);
  return m ? [m[1], m[2]] : [s, ""];
};

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

/** The name of a token as a button that copies var(--name), with the prefix dimmed. */
export const name = (token: string) => {
  const v = cssVar(token);
  const prefix = v.match(/^--igd?-/)?.[0] ?? "--";
  return `<button type="button" class="name" data-copy="var(${v})"><span class="prefix">${prefix}</span>${v.slice(prefix.length)}</button>`;
};

/** A usage note: its first sentence is always shown, the rest opens on demand. */
export const note = (usage: string) => {
  if (!usage) return "";
  const [first, rest] = lead(usage);
  return `<p class="note">${prose(first)}</p>${rest ? `<details class="more"><summary>More</summary><p class="note">${prose(rest)}</p></details>` : ""}`;
};

/** A colour token as a card: its preview, name, rendered value and note. */
export const colorCard = (kind: "fill" | "text" | "outline") => (t: Token) => {
  const v = `var(${cssVar(t.name)})`;
  const preview =
    kind === "text"
      ? `<span class="preview text" style="color: ${v}" aria-hidden="true">Aa</span>`
      : kind === "outline"
        ? `<span class="preview outline" style="border-color: ${v}" aria-hidden="true"></span>`
        : `<span class="preview" style="background: ${v}" aria-hidden="true"></span>`;
  return `<li class="token" data-token="${t.name}" data-kind="color">${preview}${name(t.name)}<output data-color="${cssVar(t.name)}"></output>${note(t.usage)}</li>`;
};

/** A type role as a row: its class, rendered size and a sample set in it. */
export const specimen = (st: TypeStyle) =>
  `<li data-token="${st.name}"><div class="spec"><button type="button" class="name" data-copy="igd-${st.name}"><span class="prefix">.igd-</span>${st.name}</button><output data-type="igd-${st.name}"></output></div><div><p class="sample igd-${st.name}">${esc(st.sample)}</p>${note(st.usage)}</div></li>`;

/** The buttons that switch the page to another type set. */
export const typeSetButtons = (T: Tokens) =>
  Object.keys(T.type.sets)
    .map(
      (s) =>
        `<button type="button" data-set="${s}" aria-pressed="false">Type set: ${s}</button>`,
    )
    .join("");

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
  const spaceRoles = T.spacing.tokens.filter((t) => !spaceSteps.includes(t));
  const shadows = T.shadow.tokens;
  const families = PALETTE_FAMILIES.filter((f) => steps(f).length);

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
        `<ul class="specimens">${styles.map(specimen).join("")}</ul>`,
    },
    {
      id: "spacing",
      title: "Spacing",
      count: T.spacing.tokens.length,
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
        ) +
        table(
          "spacing",
          ["Role", "Value", "Use"],
          spaceRoles
            .map((t) =>
              row(t, `<output data-length="${cssVar(t.name)}"></output>`),
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
      html: `<p class="intro">Built from the engine's elevations. The accent shadows and the tinted elevations take the action colour.</p><ul class="tokens roomy">${shadows
        .map(
          (t) =>
            `<li class="token" data-token="${t.name}"><span class="preview lifted" style="${t.name.endsWith("-filter") ? "filter" : "box-shadow"}: var(${cssVar(t.name)})" aria-hidden="true"></span>${name(t.name)}${note(t.usage)}</li>`,
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
  return page(T, {
    current: "tokens",
    title: "Tokens: Infragistics design system",
    source: "src/showcase.ts",
    bar: `<div class="find">
    <input type="search" id="filter" placeholder="Filter tokens, e.g. border" aria-label="Filter tokens by name or use" autocomplete="off" spellcheck="false">
    <span class="matches" id="matches" role="status"></span>
  </div>`,
    switches: typeSetButtons(T),
    body: `<div class="layout">
<nav class="sections" aria-label="Sections">
  <ul>
    ${sections.map((s) => `<li><a href="#${s.id}"><span>${s.title}</span><span class="count">${s.count}</span></a></li>`).join("\n    ")}
  </ul>
</nav>
<main>
<h1 class="title">Tokens</h1>
<p class="intro">Every token, with the value it has on this page right now. Click a name to copy it.</p>
${sections.map((s) => `<section id="${s.id}" tabindex="-1" aria-labelledby="${s.id}-title"><h2 id="${s.id}-title">${s.title} <span class="count">${s.count}</span></h2>${s.html.replace(`aria-labelledby="${s.id}"`, `aria-labelledby="${s.id}-title"`)}</section>`).join("\n")}
<p class="empty" id="empty" hidden>No token matches. Try a shorter word, such as <code>hover</code> or <code>inset</code>.</p>
</main>
</div>`,
  });
};

if (isMain(import.meta.url)) {
  const [, , IN, OUT] = process.argv;
  const html = showcase(JSON.parse(fs.readFileSync(IN, "utf8")));
  fs.writeFileSync(OUT, html);
  console.log(`showcase: ${OUT} (${html.length} bytes)`);
}
