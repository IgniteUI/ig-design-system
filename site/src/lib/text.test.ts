import { describe, expect, it } from "vitest";
import { lead, prose } from "./text.ts";

describe("prose", () => {
  it("turns a backticked name into a code element", () => {
    expect(prose("Label on `color-action-default` fills.")).toBe(
      "Label on <code>color-action-default</code> fills.",
    );
  });

  it("escapes markup in a note", () => {
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
