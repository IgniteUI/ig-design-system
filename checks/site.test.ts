import { describe, expect, it } from "vitest";
import {
  checkText,
  colourLiterals,
  declaredNames,
  paletteOverrides,
  rawPaletteReads,
  spacingRoles,
  unknownTokens,
} from "./site.ts";

const known = new Set(["--igd-color-text-primary", "--igd-space-inset-md"]);

describe("unknownTokens", () => {
  it("reports a token the design system and the site do not declare", () => {
    const found = unknownTokens("a { color: var(--igd-color-txt); }", known);
    expect(found).toHaveLength(1);
    expect(found[0].rule).toBe("unknown-token");
    expect(found[0].message).toContain("--igd-color-txt");
  });

  it("accepts a design system token and a token the site declares", () => {
    const site = new Set([...known, "--igd-aside-padding"]);
    expect(
      unknownTokens(
        "a { color: var(--igd-color-text-primary); padding: var(--igd-aside-padding); }",
        site,
      ),
    ).toEqual([]);
  });

  it("skips a name built up with interpolation", () => {
    expect(
      unknownTokens("a { color: var(--igd-badge-#{$k}-color); }", known),
    ).toEqual([]);
    expect(unknownTokens("`var(--igd-badge-${k}-color)`", known)).toEqual([]);
  });

  it("skips a var() with a fallback, which is a hook a page may set", () => {
    expect(
      unknownTokens("a { gap: var(--igd-dodont-gap, 1rem); }", known),
    ).toEqual([]);
  });

  it("skips commented-out code and keeps the line number of what follows", () => {
    const found = unknownTokens(
      "/* var(--igd-old) */\n// var(--igd-older)\na { color: var(--igd-gone); }",
      known,
    );
    expect(found.map((f) => f.line)).toEqual([3]);
  });
});

describe("rawPaletteReads", () => {
  it("reports a palette step read by site code", () => {
    const found = rawPaletteReads(
      "a { color: var(--ig-gray-700); border-color: var(--ig-primary-A100); }",
    );
    expect(found.map((f) => f.rule)).toEqual(["raw-palette", "raw-palette"]);
  });

  it("accepts an engine variable that is not a palette step", () => {
    expect(
      rawPaletteReads(
        "a { font-size: var(--ig-h1-font-size); height: var(--ig-size-large); }",
      ),
    ).toEqual([]);
  });
});

describe("paletteOverrides", () => {
  it("reports a palette step declared by site code", () => {
    const found = paletteOverrides(
      ":root { --ig-primary-500: #09f; --ig-gray-50: white; }",
    );
    expect(found).toHaveLength(2);
    expect(found[0].message).toContain("--ig-primary-500");
  });

  it("accepts a dial and a component variable", () => {
    expect(
      paletteOverrides(
        ":root { --ig-size: 1; --ig-tooltip-background: black; --ig-font-family: x; }",
      ),
    ).toEqual([]);
  });
});

describe("spacingRoles", () => {
  it("reports a raw step in padding and names the role to use", () => {
    const found = spacingRoles("a {\n  padding: var(--igd-space-md);\n}");
    expect(found).toHaveLength(1);
    expect(found[0].line).toBe(2);
    expect(found[0].message).toContain("var(--igd-space-inset-md)");
  });

  it("accepts a spacing role", () => {
    expect(spacingRoles("a { padding: var(--igd-space-inset-md); }")).toEqual(
      [],
    );
  });
});

describe("colourLiterals", () => {
  it("reports a hex colour", () => {
    expect(colourLiterals("a { color: #155dfc; }")).toHaveLength(1);
  });

  it("skips an id selector and a fragment link", () => {
    expect(
      colourLiterals('#abc { color: red; }\n<a href="#fade">x</a>'),
    ).toHaveLength(0);
  });
});

describe("checkText", () => {
  it("leaves colour literals out unless strict", () => {
    const text = "a { color: #155dfc; }";
    expect(checkText(text, known)).toEqual([]);
    expect(checkText(text, known, true).map((f) => f.rule)).toEqual([
      "colour-literal",
    ]);
  });

  it("orders the findings by line", () => {
    const text =
      "a { color: var(--ig-gray-700); }\nb { color: var(--igd-nope); }";
    expect(checkText(text, known).map((f) => f.line)).toEqual([1, 2]);
  });
});

describe("declaredNames", () => {
  it("lists the custom properties a text declares", () => {
    expect([...declaredNames(":root { --igd-a: 1; --ig-b: 2 }")]).toEqual([
      "--igd-a",
      "--ig-b",
    ]);
  });
});
