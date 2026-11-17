import { describe, expect, it } from "vitest";
import { assertSameColor, resolvedValue, stateFormula } from "./derived.ts";

describe("assertSameColor", () => {
  it("rejects a token listed as equal to a base that has another colour", () => {
    expect(() =>
      assertSameColor("tile-1", "color-accent-primary", "#0099ff", "#155dfc"),
    ).toThrow("alias tile-1 is not color-accent-primary in the engine");
  });

  it("accepts a token with the colour of its base", () => {
    expect(() =>
      assertSameColor("tile-1", "color-accent-primary", "#0099ff", "#0099ff"),
    ).not.toThrow();
  });
});

describe("resolvedValue", () => {
  const declared = new Map([
    ["ig-primary-500", "#4c7dfe"],
    ["color-action-hover", "var(--ig-primary-500)"],
    ["broken", "var(--nowhere)"],
  ]);

  it("rejects a name tokens.css does not declare", () => {
    expect(() => resolvedValue(declared, "color-missing")).toThrow(
      "no token color-missing",
    );
  });

  it("rejects a reference to a name tokens.css does not declare", () => {
    expect(() => resolvedValue(declared, "broken")).toThrow("no token nowhere");
  });

  it("follows a var() reference to the colour", () => {
    expect(resolvedValue(declared, "color-action-hover")).toBe("#4c7dfe");
  });
});

describe("stateFormula", () => {
  it("is the base unchanged when the token has the base's colour", () => {
    expect(stateFormula("x-hover", "x", "#155dfc", "#155dfc").value).toBe(
      "oklch(from var(--x) calc(l + 0.0000) calc(c * 1.0000) calc(h + 0.00))",
    );
  });

  it("gives a grey base the token's own chroma and hue", () => {
    expect(stateFormula("x-hover", "x", "#155dfc", "#808080").record).toEqual({
      base: "x",
      dl: expect.any(Number),
      kc: 1,
      dh: 0,
    });
  });
});
