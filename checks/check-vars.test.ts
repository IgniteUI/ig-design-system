import { describe, expect, it } from "vitest";
import { definedVars, undefinedVars } from "./check-vars.ts";

const defined = definedVars(":root { --color-a: red; --space-md : 1rem; }");

describe("definedVars", () => {
  it("collects the declared custom properties without the leading dashes", () => {
    expect([...defined]).toEqual(["color-a", "space-md"]);
  });
});

describe("undefinedVars", () => {
  it("accepts a reference to a defined token", () => {
    expect(undefinedVars("color: var(--color-a)", defined)).toEqual([]);
  });

  it("reports a reference to a token that does not exist", () => {
    expect(undefinedVars("color: var(--color-b)", defined)).toEqual([
      "color-b",
    ]);
  });

  it("reports a missing token that has a fallback", () => {
    expect(undefinedVars("gap: var(--space-xl, 1rem)", defined)).toEqual([
      "space-xl",
    ]);
  });

  it("skips the raw tier in both prefixes", () => {
    expect(
      undefinedVars("var(--ig-primary-500) var(--igd-primary-500)", defined),
    ).toEqual([]);
  });

  it("skips the contrast helpers", () => {
    expect(undefinedVars("var(--y) var(--y-contrast)", defined)).toEqual([]);
  });

  it("skips a name that is completed at runtime", () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: the fixture is component source text.
    expect(undefinedVars("`var(--tile-${tone})`", defined)).toEqual([]);
  });
});
