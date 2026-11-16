import { describe, expect, it } from "vitest";
import { groupColors, prose } from "./showcase.ts";
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
