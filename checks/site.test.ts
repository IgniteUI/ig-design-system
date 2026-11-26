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

const known = new Set([
  "--igd-color-foreground-default",
  "--igd-space-inset-md",
]);
const roles = new Set(["--igd-space-gap-md", "--igd-space-stack-md"]);

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
        "a { color: var(--igd-color-foreground-default); padding: var(--igd-aside-padding); }",
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

describe("a protocol-relative URL", () => {
  it("is not a comment, so the rest of its line is checked", () => {
    const text =
      "a { background:url(//cdn.test/image); color:var(--igd-typo); }";
    expect(unknownTokens(text, known)).toHaveLength(1);
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

  it("reports a palette step declared as the quoted key of a style object", () => {
    const found = paletteOverrides('const s = { "--ig-primary-500": "red" };');
    expect(found).toHaveLength(1);
    expect(found[0].message).toContain("--ig-primary-500 is declared here");
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
    const found = spacingRoles(
      "a {\n  padding: var(--igd-space-md);\n}",
      known,
    );
    expect(found).toHaveLength(1);
    expect(found[0].line).toBe(2);
    expect(found[0].message).toContain("var(--igd-space-inset-md)");
  });

  it("reports each raw step on its own line when the same step is used earlier in a non-spacing property", () => {
    const found = spacingRoles(
      "a {\n  width: var(--igd-space-md);\n}\nb {\n  padding: var(--igd-space-md);\n}",
      known,
    );
    expect(found.map((f) => f.line)).toEqual([5]);
  });

  it("reports a raw step written with spaces or with a fallback", () => {
    expect(
      spacingRoles("a { margin: var( --igd-space-md ); }", known),
    ).toHaveLength(1);
    expect(
      spacingRoles("a { gap: var(--igd-space-sm, 4px); }", known),
    ).toHaveLength(1);
  });

  it("says a role does not exist when no role has the size of the raw step", () => {
    const found = spacingRoles("a { padding: var(--igd-space-6xl); }", known);
    expect(found[0].message).toBe(
      "padding uses var(--igd-space-6xl), and --igd-space-inset-6xl does not exist. Use a smaller step of that role.",
    );
  });

  it("names the gap role for an inline margin", () => {
    const text = "a { margin-inline-start: var(--igd-space-md); }";
    expect(spacingRoles(text, roles)[0].message).toContain(
      "use var(--igd-space-gap-md).",
    );
  });

  it("accepts a spacing role", () => {
    expect(
      spacingRoles("a { padding: var(--igd-space-inset-md); }", known),
    ).toEqual([]);
  });
});

describe("colourLiterals", () => {
  it("reports a hex colour", () => {
    expect(colourLiterals("a { color: #155dfc; }")).toHaveLength(1);
  });

  it("reports a hex colour on the line after its property", () => {
    const found = colourLiterals("a {\n  color:\n    #155dfc;\n}");
    expect(found.map((f) => f.line)).toEqual([3]);
  });

  it("reports a hex colour as the value of a quoted key on the line before", () => {
    expect(
      colourLiterals('const s = {\n  "color":\n    "#155dfc",\n};'),
    ).toHaveLength(1);
  });

  it("skips a fragment link on the line after an inline style", () => {
    expect(
      colourLiterals('<div style="color: red">\n<a href="#add">x</a>'),
    ).toHaveLength(0);
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

describe("the full message of each rule", () => {
  it("says what to do about an unknown token", () => {
    expect(
      unknownTokens("a { color: var(--igd-nope); }", known)[0].message,
    ).toBe(
      "--igd-nope is not a design system token and this site does not declare it. Check the name in llms-full.txt.",
    );
  });

  it("names a semantic token to read in place of a palette step", () => {
    expect(rawPaletteReads("a { color: var(--ig-gray-700); }")[0].message).toBe(
      "--ig-gray-700 is a raw palette step. Read a semantic token, such as --igd-color-foreground-default or --igd-color-border-default.",
    );
  });

  it("says where a palette change belongs", () => {
    expect(
      paletteOverrides(":root { --ig-primary-500: red; }")[0].message,
    ).toBe(
      "--ig-primary-500 is declared here. The palette belongs to the design system; change a seed there, or override a semantic token on a scope.",
    );
  });
});

describe("declaredNames", () => {
  it("lists a custom property declared as the key of a style object", () => {
    expect([
      ...declaredNames('const style = { "--igd-local": "1px" };'),
    ]).toEqual(["--igd-local"]);
  });

  it("lists the custom properties a text declares", () => {
    expect([...declaredNames(":root { --igd-a: 1; --ig-b: 2 }")]).toEqual([
      "--igd-a",
      "--ig-b",
    ]);
  });
});
