import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { COLOUR_PICKS, guide, pick, SHAPE_PICKS } from "./guide.ts";
import { showcase } from "./showcase.ts";
import type { Tokens } from "./types.ts";

const T: Tokens = JSON.parse(fs.readFileSync("dist/tokens.json", "utf8"));
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const html = guide(T, pkg);

describe("pick", () => {
  const tokens = [{ name: "radius-lg", value: "1rem", usage: "" }];

  it("returns the tokens in the order they are named", () => {
    expect(pick(tokens, ["radius-lg"], "radius")).toEqual(tokens);
  });

  it("stops the build on a name tokens.json does not have, and says where to fix it", () => {
    expect(() => pick(tokens, ["radius-huge"], "radius")).toThrow(
      'The guide shows "radius-huge", which is not a radius token in tokens.json. Rename it in src/guide.ts or remove it from the list.',
    );
  });
});

describe("guide", () => {
  it("links every section from the section list", () => {
    const ids = [...html.matchAll(/<section id="([a-z]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(html).toContain(`<li><a href="#${id}">`);
  });

  it("shows every picked colour, radius and shadow with a button that copies it", () => {
    const names = [
      ...COLOUR_PICKS.flatMap((g) => g.names.map(([n]) => n)),
      ...SHAPE_PICKS.radius,
      ...SHAPE_PICKS.shadow,
    ];
    for (const n of names)
      expect(html).toContain(`data-copy="var(--igd-${n})"`);
  });

  it("replaces a colour's usage note with its plain use", () => {
    expect(html).toContain('<p class="note">The fill of the main button.</p>');
  });

  it("prints the card rule the page itself uses", () => {
    const rule = html.match(/\n(\.card \{\n[^}]+\})\n<\/style>/)?.[1];
    expect(rule).toBeDefined();
    const printed = (rule ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    expect(html).toContain(`<pre><code>${printed}</code></pre>`);
  });

  it("names the package and the repository of package.json in its links and commands", () => {
    expect(html).toContain(`npm install ${pkg.name}`);
    expect(html).toContain(
      'href="https://github.com/IgniteUI/ig-design-system/blob/main/docs/ADOPTING.md"',
    );
  });

  it("carries the logo of each theme in the top bar, under one accessible name", () => {
    expect(html).toContain(
      '<a class="brand" href="index.html" aria-label="Infragistics design system">',
    );
    expect(
      html.match(/<svg class="logo logo-light" aria-hidden="true"/g),
    ).toHaveLength(1);
    expect(
      html.match(/<svg class="logo logo-dark" aria-hidden="true"/g),
    ).toHaveLength(1);
    expect(html).not.toContain('id="Layer_1"');
  });

  it("marks itself as the current page, and the showcase marks Tokens", () => {
    expect(html).toContain(
      '<a href="index.html" aria-current="page">Guide</a>',
    );
    expect(showcase(T)).toContain(
      '<a href="showcase.html" aria-current="page">Tokens</a>',
    );
  });
});
