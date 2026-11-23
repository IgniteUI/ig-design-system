// node src/guide.ts <tokens.json> <package.json> <out.html>
// Writes the guide: one static page that explains the design system in plain words, with live examples built on the tokens.
import fs from "node:fs";
import { isMain } from "./main.ts";
import { cssVar } from "./namespace.ts";
import { esc, page } from "./page.ts";
import { fromRoot } from "./paths.ts";
import {
  colorCard,
  name,
  prose,
  specimen,
  typeSetButtons,
} from "./showcase.ts";
import type { Token, Tokens } from "./types.ts";

// The guide's own styles, added after the shared stylesheet.
const GUIDE_CSS = fs.readFileSync(fromRoot("src/guide.css"), "utf8");

// The rule of the card on the page, which the guide also prints as its code sample.
const CARD_CSS = `.card {
  display: grid;
  gap: var(--igd-space-gap-sm);
  padding: var(--igd-space-inset-lg);
  border: var(--igd-border-width-default) solid var(--igd-color-border-default);
  border-radius: var(--igd-radius-lg);
  background: var(--igd-color-surface-card);
  color: var(--igd-color-text-secondary);
  box-shadow: var(--igd-shadow-raised);
}`;

type Package = { name: string; repository: { url: string } };

type Pick = {
  title: string;
  lead: string;
  kind: "fill" | "text" | "outline";
  names: [token: string, use: string][];
};

/** The colours the guide shows, by what a reader wants to colour. Every other colour is on the Tokens page. */
export const COLOUR_PICKS: Pick[] = [
  {
    title: "Text",
    lead: "Four strengths of text. Body copy never goes lighter than muted.",
    kind: "text",
    names: [
      ["color-text-heading", "Headlines."],
      ["color-text-primary", "Strong text and the default text of a page."],
      ["color-text-secondary", "Body copy and the paragraph under a heading."],
      ["color-text-muted", "Captions, card descriptions and small labels."],
    ],
  },
  {
    title: "Backgrounds",
    lead: "The page, a band that alternates with it, a card, a soft tint and the one dark surface.",
    kind: "fill",
    names: [
      ["color-surface-page", "The page background."],
      ["color-surface-subtle", "A section band that alternates with the page."],
      ["color-surface-card", "The fill of a card."],
      ["color-surface-tint", "A soft tint behind a chip or a callout."],
      [
        "color-surface-inverse",
        "The one dark surface, such as a table header.",
      ],
    ],
  },
  {
    title: "Buttons and links",
    lead: "One action colour. A filled button uses the fill and its label; a link or an outline uses the text colour.",
    kind: "fill",
    names: [
      ["color-action-default", "The fill of the main button."],
      ["color-action-on", "The label on that fill."],
      ["color-action-text", "A link, an outline button label, an eyebrow."],
      [
        "color-action-fill-hover",
        "The fill of the main button under the pointer.",
      ],
    ],
  },
  {
    title: "Lines",
    lead: "Borders of cards, dividers and form fields.",
    kind: "outline",
    names: [
      ["color-border-default", "The border of a card or a chip."],
      ["color-border-subtle", "A quiet divider."],
      ["color-border-control", "The border of a form field."],
    ],
  },
  {
    title: "Messages",
    lead: "Error, success, warning and information. Each has a text colour and a tinted background.",
    kind: "fill",
    names: [
      ["color-feedback-error-default", "An error message."],
      ["color-feedback-success-default", "A confirmation."],
      ["color-feedback-warning-default", "A warning."],
      ["color-feedback-info-default", "A note or a tip."],
    ],
  },
];

/** The radius and shadow roles the guide shows. */
export const SHAPE_PICKS = {
  radius: [
    "radius-xs",
    "radius-sm",
    "radius-md",
    "radius-lg",
    "radius-xl",
    "radius-full",
  ],
  shadow: [
    "shadow-raised",
    "shadow-floating",
    "shadow-popover",
    "shadow-panel",
  ],
};

/** The sizes of the spacing scale the guide draws. */
export const SPACE_PICKS = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"];

// The dials of the live example: the property, its label and the values a button sets. An empty value clears the dial.
const DIALS: [
  prop: string,
  label: string,
  values: [label: string, value: string][],
][] = [
  [
    "--ig-size",
    "Size",
    [
      ["Small", "1"],
      ["Medium", "2"],
      ["Large", ""],
    ],
  ],
  [
    "--ig-spacing",
    "Spacing",
    [
      ["Half", "0.5"],
      ["Design", ""],
      ["Double", "2"],
    ],
  ],
  [
    "--ig-radius-factor",
    "Roundness",
    [
      ["Square", "0"],
      ["Design", ""],
      ["Round", "1"],
    ],
  ],
  [
    "--ig-elevation-factor",
    "Shadow",
    [
      ["None", "0"],
      ["Design", ""],
      ["Double", "2"],
    ],
  ],
];

/** Finds a token by name in a family, or stops the build with the name that is missing. */
export const pick = (tokens: Token[], names: string[], where: string) =>
  names.map((n) => {
    const t = tokens.find((x) => x.name === n);
    if (!t)
      throw new Error(
        `The guide shows "${n}", which is not a ${where} token in tokens.json. Rename it in src/guide.ts or remove it from the list.`,
      );
    return t;
  });

// A code sample with a button that copies it.
const code = (text: string, label = "Copy") =>
  `<div class="code" data-on-dark><pre><code>${esc(text)}</code></pre><button type="button" data-copy="${esc(text)}">${label}</button></div>`;

// A pair of examples: what to write and what not to.
const pair = (good: string, bad: string, why: string) =>
  `<li class="rule"><div class="do"><span class="verdict">Do</span><code>${esc(good)}</code></div><div class="dont"><span class="verdict">Don't</span><code>${esc(bad)}</code></div><p>${prose(why)}</p></li>`;

const CARD = (title: string, text: string) =>
  `<article class="card" data-ig-scope><span class="badge">New</span><h3 class="igd-type-title-sm">${title}</h3><p class="igd-type-body-md">${text}</p><div class="actions"><a class="btn" href="#themes">Start free trial</a><a class="btn quiet" href="#themes">Read more</a></div></article>`;

type Section = { id: string; title: string; html: string };

/** Builds the guide from tokens.json and package.json. */
export const guide = (T: Tokens, pkg: Package) => {
  const repo = pkg.repository.url.replace(/^git\+/, "").replace(/\.git$/, "");
  const colours = T.color.tokens.filter((t) => !t.name.startsWith("ig-"));
  const styles = T.type.groups.flatMap((g) => g.styles);
  const roles = (role: string) =>
    pick(
      T.spacing.tokens,
      SPACE_PICKS.map((s) => `space-${role}-${s}`),
      "spacing",
    );
  const facts: [count: number, label: string][] = [
    [colours.length, "colours"],
    [styles.length, "type roles"],
    [T.spacing.tokens.length, "spacing tokens"],
    [T.radius.tokens.length + T.shadow.tokens.length, "corners and shadows"],
  ];
  const doc = (file: string) => `${repo}/blob/main/${file}`;

  const sections: Section[] = [
    {
      id: "idea",
      title: "The idea",
      html: `<p class="intro">A design token is a name for a design decision. The name says what the value is for, and the design system holds the value.</p>
<ul class="ideas">
  <li><h3 class="igd-type-title-sm">A name, not a value</h3><p>You pick “the muted text colour”, not <code>#6e6e6e</code>. The name stays right when the colour changes.</p></li>
  <li><h3 class="igd-type-title-sm">One source</h3><p>The website, the docs and the blog read the same tokens. A change made here reaches each of them with the next version.</p></li>
  <li><h3 class="igd-type-title-sm">Checked for you</h3><p>Every text colour is measured against its background in both themes. A command reports a value typed by hand.</p></li>
</ul>
<h3 class="igd-type-title-sm">What do you need?</h3>
<ul class="paths">
  <li><a href="#colour"><strong>I choose colours, type or spacing</strong><span>Read Colour, Type, Spacing and Shape. Click a name to copy it.</span></a></li>
  <li><a href="#component"><strong>I build a page or a component</strong><span>Read Build a component and Do and don't.</span></a></li>
  <li><a href="#setup"><strong>I set up a site</strong><span>Install the package, load four stylesheets, run the check.</span></a></li>
  <li><a href="showcase.html"><strong>I am looking for one token</strong><span>The Tokens page lists every token and filters by name or use.</span></a></li>
</ul>`,
    },
    {
      id: "colour",
      title: "Colour",
      html:
        `<p class="intro">A colour is named for its job: text, a background, an action, a line or a message. Choose by the job, never by the nearest shade. Each one has a value for the light theme and one for the dark theme, and switches by itself.</p>` +
        COLOUR_PICKS.map(
          (g) =>
            `<div class="group"><h3>${g.title}</h3><p class="lead">${g.lead}</p><ul class="tokens">${pick(
              colours,
              g.names.map(([n]) => n),
              "colour",
            )
              .map((t, i) => colorCard(g.kind)({ ...t, usage: g.names[i][1] }))
              .join("")}</ul></div>`,
        ).join("") +
        `<p class="more-link"><a href="showcase.html#colour">All ${colours.length} colours</a></p>`,
    },
    {
      id: "type",
      title: "Type",
      html: `<p class="intro">${styles.length} text styles, each named for its role on the page. Put the class on the element and the font, size, weight and line height come with it. The numbers show the size on this screen right now.</p>
<div class="switches">${typeSetButtons(T)}</div>
<p class="lead">The marketing site uses the default sizes. A documentation page uses the smaller <code>docs</code> set: press the button to see it.</p>
<ul class="specimens">${styles.map(specimen).join("")}</ul>
<p class="lead">Three typefaces: ${Object.values(T.type.families)
        .map((f) => esc(f.split(",")[0].replace(/'/g, "")))
        .join(
          ", ",
        )}. Headings use the first, text the second, code the third.</p>`,
    },
    {
      id: "spacing",
      title: "Spacing",
      html: `<p class="intro">Space comes from one scale, from <code>xs</code> to <code>5xl</code>. You choose a size and say what the space is: padding inside a box, a vertical margin between blocks, or a gap between items.</p>
<div class="anatomy" aria-hidden="true">
  <div class="box"><span class="tag">inset: padding inside</span>
    <div class="row"><span class="item">Item</span><span class="tag">gap: between items</span><span class="item">Item</span></div>
    <span class="tag stack">stack: between blocks</span>
    <div class="row"><span class="item">Item</span><span class="item">Item</span></div>
  </div>
</div>
<div class="table" tabindex="0" role="region" aria-label="Spacing sizes"><table>
<thead><tr><th scope="col">Size</th><th scope="col">Padding</th><th scope="col">Vertical margin</th><th scope="col">Gap</th><th scope="col">Now</th><th scope="col"></th></tr></thead>
<tbody>${SPACE_PICKS.map((s, i) => {
        const [inset, stack, gap] = [
          roles("inset")[i],
          roles("stack")[i],
          roles("gap")[i],
        ];
        return `<tr><th scope="row">${s}</th><td>${name(inset.name)}</td><td>${name(stack.name)}</td><td>${name(gap.name)}</td><td class="value"><output data-length="${cssVar(inset.name)}"></output></td><td><span class="bar" style="inline-size: var(${cssVar(inset.name)})"></span></td></tr>`;
      }).join("")}</tbody></table></div>
<p class="lead">Widths, heights and offsets are not tokens. Type those as the layout needs them.</p>
<p class="more-link"><a href="showcase.html#spacing">All ${T.spacing.tokens.length} spacing tokens</a></p>`,
    },
    {
      id: "shape",
      title: "Shape",
      html: `<p class="intro">Corners and shadows are named by what they sit on. A card takes the card radius; a button is always a pill.</p>
<div class="group"><h3>Corners</h3><ul class="tokens">${pick(
        T.radius.tokens,
        SHAPE_PICKS.radius,
        "radius",
      )
        .map(
          (t) =>
            `<li class="token"><span class="preview outline" style="border-radius: var(${cssVar(t.name)})" aria-hidden="true"></span>${name(t.name)}<output data-length="${cssVar(t.name)}"></output><p class="note">${prose(t.usage.split(". ")[0].replace(/\.$/, ""))}.</p></li>`,
        )
        .join("")}</ul></div>
<div class="group"><h3>Shadows</h3><ul class="tokens roomy">${pick(
        T.shadow.tokens,
        SHAPE_PICKS.shadow,
        "shadow",
      )
        .map(
          (t) =>
            `<li class="token"><span class="preview lifted" style="box-shadow: var(${cssVar(t.name)})" aria-hidden="true"></span>${name(t.name)}<p class="note">${prose(t.usage.split(". ")[0].replace(/\.$/, ""))}.</p></li>`,
        )
        .join("")}</ul></div>
<p class="more-link"><a href="showcase.html#radius">All corners</a> · <a href="showcase.html#shadow">All shadows</a></p>`,
    },
    {
      id: "themes",
      title: "Themes and dials",
      html: `<p class="intro">The same component looks right in the light theme, in the dark theme and at any density, because it reads tokens. Nothing in it is written twice.</p>
<div class="group"><h3>Light and dark</h3>
<p class="lead">The button at the top of this page switches the whole page. A region can also carry its own theme: these two cards are the same markup.</p>
<div class="themes">
  <div class="stage" data-theme="light"><span class="tag">data-theme="light"</span>${CARD("Light theme", "Every colour takes its light value.")}</div>
  <div class="stage" data-theme="dark"><span class="tag">data-theme="dark"</span>${CARD("Dark theme", "The same names, the dark values.")}</div>
</div></div>
<div class="group"><h3>Dials</h3>
<p class="lead">Four dials change every token below them at once. Press a value and watch the card: its padding, corners and shadow follow, and no rule of the card changes.</p>
<div class="dials" data-dials="dial-stage">${DIALS.map(
        ([prop, label, values]) =>
          `<div class="dial" role="group" aria-label="${label}"><span class="dial-name">${label} <code>${prop}</code></span>${values
            .map(
              ([text, value]) =>
                `<button type="button" data-dial="${prop}" data-value="${value}" aria-pressed="${value === ""}">${text}</button>`,
            )
            .join("")}</div>`,
      ).join("")}</div>
<div class="stage" id="dial-stage" data-ig-scope>${CARD(
        "One card, four dials",
        "Padding now:",
      ).replace(
        "Padding now:</p>",
        `Padding now: <output data-length="${cssVar("space-inset-lg")}"></output>, corner: <output data-length="${cssVar("radius-lg")}"></output></p>`,
      )}</div>
<p class="lead">A site sets a dial once, on the page or on one region. A component never sets one.</p></div>`,
    },
    {
      id: "component",
      title: "Build a component",
      html: `<p class="intro">The same four steps in plain HTML, Astro, React, Angular or a web component.</p>
<ol class="steps">
  <li><strong>Mark the root.</strong> Put <code>data-ig-scope</code> on the outermost element of the component. A dial set anywhere above it then reaches it.</li>
  <li><strong>Colour by job.</strong> Text reads a <code>color-text-*</code> token, a background a <code>color-surface-*</code> token, a line a <code>color-border-*</code> token.</li>
  <li><strong>Space by role.</strong> Padding is <code>space-inset-*</code>, a vertical margin <code>space-stack-*</code>, a gap <code>space-gap-*</code>.</li>
  <li><strong>Set text with a class.</strong> <code>igd-type-title-sm</code> on a card title, <code>igd-type-body-md</code> on its text.</li>
</ol>
<p class="lead">This is the whole stylesheet of the card used on this page:</p>
${code(CARD_CSS)}
${code(`<article class="card" data-ig-scope>
  <h3 class="igd-type-title-sm">Card title</h3>
  <p class="igd-type-body-md">Card text.</p>
</article>`)}
<p class="more-link"><a href="examples/card.html">Open the example card</a> · <a href="${doc("docs/examples/card.html")}">Read its source</a></p>`,
    },
    {
      id: "rules",
      title: "Do and don't",
      html: `<p class="intro">Six rules cover almost every case. The check command reports the first three; the third with <code>--strict</code>.</p>
<ul class="rules">
${[
  pair(
    "color: var(--igd-color-text-muted);",
    "color: var(--ig-gray-600);",
    "Read a colour by its job. A palette step such as `--ig-gray-600` is raw material for the design system and has no dark value of its own.",
  ),
  pair(
    "padding: var(--igd-space-inset-md);",
    "padding: var(--igd-space-md);",
    "Use a spacing role, not the raw step. The role says what the space is, so padding and gaps can be tuned apart later.",
  ),
  pair(
    "color: var(--igd-color-action-text);",
    "color: #1a5fff;",
    "Do not type a colour, even one that looks right. When no token fits, say which one is missing.",
  ),
  pair(
    "background: var(--igd-color-surface-card);",
    "background: light-dark(#fff, #1c1c1c);",
    "A token already has a value per theme. Do not write the two themes by hand.",
  ),
  pair(
    '<section style="--ig-spacing: 0.5">',
    ".card { --igd-space-md: 8px; }",
    "Change a dial on the page or on a region. Never set a spacing, size or radius step inside a component.",
  ),
  pair(
    "max-width: 24rem;",
    "max-width: var(--igd-space-6xl);",
    "Widths, heights and offsets are not tokens. Type them; do not borrow a spacing step for a size.",
  ),
].join("\n")}
</ul>`,
    },
    {
      id: "setup",
      title: "Set up a site",
      html: `<p class="intro">For the developer who adds the design system to a site. It is CSS only: no framework code and no dependencies.</p>
<ol class="steps">
  <li><strong>Install the package.</strong>${code(`npm install ${pkg.name}`)}</li>
  <li><strong>Load the stylesheets before the site's own styles, in this order.</strong> <code>fonts.css</code> and <code>base.css</code> are optional.${code(`@import '${pkg.name}/fonts.css';
@import '${pkg.name}/tokens.css';
@import '${pkg.name}/theme.css';
@import '${pkg.name}/base.css';`)}</li>
  <li><strong>Check the site.</strong> The command reports an unknown token, a palette step and a raw spacing step, and fails the build when it finds one.${code(`npx ${pkg.name} check src`)}</li>
</ol>
<ul class="paths">
  <li><a href="${doc("docs/ADOPTING.md")}"><strong>Moving an existing site</strong><span>The steps, in order, and what to expect.</span></a></li>
  <li><a href="${doc("docs/MIGRATION.md")}"><strong>Old token names</strong><span>Each old name and its replacement.</span></a></li>
  <li><a href="../llms.txt"><strong>For AI agents</strong><span><code>llms.txt</code> holds the rules; <code>llms-full.txt</code> every token.</span></a></li>
  <li><a href="${doc("CHANGELOG.md")}"><strong>What changed</strong><span>Every release and what it changes.</span></a></li>
</ul>`,
    },
    {
      id: "help",
      title: "Something missing?",
      html: `<p class="intro">If no token fits what you need, do not pick the closest one. Ask: the answer is either a token you missed or a new one for everybody.</p>
<ul class="paths">
  <li><a href="showcase.html"><strong>Search the tokens first</strong><span>The filter matches a token's name and its use, so <code>hover</code> or <code>card</code> work.</span></a></li>
  <li><a href="${repo}/issues/new/choose"><strong>Open an issue</strong><span>Say what you are styling and which token is missing.</span></a></li>
  <li><a href="${repo}"><strong>The repository</strong><span>The source, the README and the reason behind every decision.</span></a></li>
</ul>`,
    },
  ];

  return page(T, {
    current: "guide",
    title: "Infragistics design system",
    source: "src/guide.ts",
    css: `${GUIDE_CSS}${CARD_CSS}\n`,
    body: `<div class="hero">
  <div class="hero-inner">
    <p class="igd-type-eyebrow">Design system</p>
    <h1 class="igd-type-display-lg">One look for every <span class="brand-text">Infragistics site</span></h1>
    <p class="igd-type-lead">Colours, type, spacing, corners and shadows, each with a name that says what it is for. Use the names and every page stays consistent, in the light and the dark theme.</p>
    <div class="actions"><a class="btn" href="#idea">Start here</a><a class="btn quiet" href="showcase.html">Browse every token</a></div>
    <dl class="facts">${facts.map(([n, label]) => `<div><dt>${label}</dt><dd class="igd-type-stat">${n}</dd></div>`).join("")}</dl>
  </div>
</div>
<div class="layout">
<nav class="sections" aria-label="Sections">
  <ul>
    ${sections.map((s) => `<li><a href="#${s.id}"><span>${s.title}</span></a></li>`).join("\n    ")}
  </ul>
</nav>
<main>
${sections.map((s) => `<section id="${s.id}" tabindex="-1" aria-labelledby="${s.id}-title"><h2 id="${s.id}-title">${s.title}</h2>${s.html}</section>`).join("\n")}
</main>
</div>`,
  });
};

if (isMain(import.meta.url)) {
  const [, , IN, PKG, OUT] = process.argv;
  const html = guide(
    JSON.parse(fs.readFileSync(IN, "utf8")),
    JSON.parse(fs.readFileSync(PKG, "utf8")),
  );
  fs.writeFileSync(OUT, html);
  console.log(`guide: ${OUT} (${html.length} bytes)`);
}
