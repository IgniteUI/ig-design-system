import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { groupColors, lead, prose, showcase } from "./showcase.ts";
import type { Token } from "./types.ts";

const t = (name: string): Token => ({ name, value: "#000000", usage: "" });

describe("prose", () => {
  it("turns a backticked name into a code element", () => {
    expect(prose("Label on `color-action-default` fills.")).toBe(
      "Label on <code>color-action-default</code> fills.",
    );
  });

  it("escapes markup in a usage note", () => {
    expect(prose("a <b> & c")).toBe("a &lt;b&gt; &amp; c");
  });
});

describe("lead", () => {
  it("splits a note into its first sentence and the rest", () => {
    expect(lead("Card fill. Used on every card.")).toEqual([
      "Card fill.",
      "Used on every card.",
    ]);
  });

  it("keeps a note of one sentence whole", () => {
    expect(lead("Card fill.")).toEqual(["Card fill.", ""]);
  });

  it("does not end the sentence at a decimal point or inside a backticked name", () => {
    expect(lead("Contrast 4.5:1 on `a.b` surfaces. More here.")).toEqual([
      "Contrast 4.5:1 on `a.b` surfaces.",
      "More here.",
    ]);
  });
});

describe("groupColors", () => {
  const { raw, semantic, component } = groupColors([
    t("ig-primary-500"),
    t("ig-gray-900"),
    t("color-action-default"),
    t("color-text-muted"),
    t("color-overlay-scrim"),
    t("footer-link"),
  ]);

  it("puts an engine name in its family", () => {
    expect(Object.keys(raw)).toEqual(["primary", "gray"]);
  });

  it("groups a semantic colour by its role", () => {
    expect(semantic.action.map((x) => x.name)).toEqual([
      "color-action-default",
    ]);
    expect(semantic.text.map((x) => x.name)).toEqual(["color-text-muted"]);
  });

  it("puts a semantic colour with no listed role under other", () => {
    expect(semantic.other.map((x) => x.name)).toEqual(["color-overlay-scrim"]);
  });

  it("puts every other colour in the component tier", () => {
    expect(component.map((x) => x.name)).toEqual(["footer-link"]);
  });
});

describe("showcase", () => {
  const html = showcase(
    JSON.parse(fs.readFileSync("dist/tokens.json", "utf8")),
  );

  it("lists the surface in the engine palette by its four roles", () => {
    const row = html.match(/<li data-token="ig-surface">.*?<\/ol><\/li>/s)?.[0];
    expect(row).toBeDefined();
    for (const role of ["base", "sunken", "raised", "overlay"])
      expect(row).toContain(`data-copy="var(--ig-surface-${role})"`);
  });

  it("lists a shaded family by its ten numbered shades", () => {
    const row = html.match(/<li data-token="ig-gray">.*?<\/ol><\/li>/s)?.[0];
    expect(row?.match(/data-copy=/g)).toHaveLength(10);
  });
});
