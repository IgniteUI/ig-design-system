import { describe, expect, it } from "vitest";
import {
  assertSameColor,
  resolvedValue,
  stateFamilyErrors,
  stateFormula,
} from "./derived.ts";
import { ALIAS } from "./spec.ts";

describe("assertSameColor", () => {
  it("rejects a token listed as equal to a base that has another colour", () => {
    expect(() =>
      assertSameColor("tile-1", "color-accent-brand", "#0099ff", "#155dfc"),
    ).toThrow("alias tile-1 is not color-accent-brand in the engine");
  });

  it("accepts a token with the colour of its base", () => {
    expect(() =>
      assertSameColor("tile-1", "color-accent-brand", "#0099ff", "#0099ff"),
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

describe("stateFamilyErrors", () => {
  const alias: Record<string, [string, string]> = {
    "link-text": ["ig-primary-600", ""],
    "link-hover": ["ig-info-500", ""],
    "link-active": ["ig-primary-800", ""],
    "link-focus": ["link-text", ""],
    "dark-link": ["ig-sky-200", ""],
    "dark-link-hover": ["ig-dark-sky-100", ""],
    "badge-background": ["ig-info-100", ""],
  };

  it("reports a state that reads another family than its base, with the fix", () => {
    expect(stateFamilyErrors([["link-hover", "link-text"]], alias)).toEqual([
      "link-hover is a state of link-text and reads the info family, but link-text reads primary. A state stays in the family of its base: alias link-hover to a step of ig-primary in ALIAS in src/spec.ts.",
    ]);
  });

  it("accepts a state on another step of its base's family, directly or through an alias", () => {
    expect(
      stateFamilyErrors(
        [
          ["link-active", "link-text"],
          ["link-focus", "link-text"],
        ],
        alias,
      ),
    ).toEqual([]);
  });

  it("counts a dark palette as its light family", () => {
    expect(
      stateFamilyErrors([["dark-link-hover", "dark-link"]], alias),
    ).toEqual([]);
  });

  it("leaves a token that is not a state alone, even when its family differs", () => {
    expect(
      stateFamilyErrors([["badge-background", "link-text"]], alias),
    ).toEqual([]);
  });

  it("finds no state of the spec that leaves its base's family", () => {
    const pairs = [
      ["color-action-hover", "color-action-text"],
      ["color-link-inverse-hover", "color-link-inverse"],
      ["color-action-fill-hover", "color-action-default"],
      ["color-action-active", "color-action-default"],
    ] as [string, string][];
    expect(stateFamilyErrors(pairs, ALIAS)).toEqual([]);
  });
});
