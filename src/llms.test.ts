import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { llmsFullTxt, llmsTxt, type Tokens } from "./llms.ts";

const pkg = {
  name: "ig-design-system",
  description: "A design system.",
};
const family = (
  tokens: { name: string; value: string; usage: string }[],
  note?: string,
) => ({ note, tokens });
const empty = Object.fromEntries(
  [
    "spacing",
    "radius",
    "size",
    "shadow",
    "opacity",
    "weight",
    "gradient",
    "breakpoint",
    "zIndex",
  ].map((k) => [k, family([])]),
);
const tokens: Tokens = {
  ...empty,
  color: family(
    [
      { name: "ig-gray-500", value: "#68717d", usage: "Engine step." },
      { name: "color-text-primary", value: "#2a2d33", usage: "Body text." },
    ],
    "Semantic colours.",
  ),
  type: {
    groups: [
      {
        styles: [
          {
            name: "type-display-lg",
            fontSize: "3.25rem",
            fontSizeMin: "2.25rem",
            lineHeight: "1.12",
            fontWeight: 900,
            usage: "Hero.",
          },
        ],
      },
    ],
    sets: { docs: [{ name: "type-display-lg", fontSize: "2.25rem" }] },
  },
};

describe("llmsTxt", () => {
  const text = llmsTxt(tokens, pkg);

  it("opens with the package name and its description, and carries no version", () => {
    expect(
      text.startsWith(
        "# ig-design-system\n\n> A design system. This file is generated",
      ),
    ).toBe(true);
  });

  it("counts the tokens a site reads apart from the engine palette steps", () => {
    expect(text).toContain(
      "- Colour: 1 tokens, plus 1 engine palette steps a site does not read",
    );
  });

  it("links only to files that exist in the repository", () => {
    for (const [, file] of text.matchAll(/\]\(([^)]+)\)/g))
      if (file !== "llms-full.txt")
        expect(fs.existsSync(file), file).toBe(true);
  });
});

describe("llmsFullTxt", () => {
  const text = llmsFullTxt(tokens, pkg);

  it("lists a token as its custom property with its value and usage", () => {
    expect(text).toContain(
      "- `--igd-color-text-primary`: `#2a2d33`. Body text.",
    );
  });

  it("leaves the engine palette steps out", () => {
    expect(text).not.toContain("ig-gray-500");
  });

  it("puts a family's note under its heading", () => {
    expect(text).toContain("## Colour\n\nSemantic colours.\n");
  });

  it("lists a type role with its fluid minimum and its docs size", () => {
    expect(text).toContain(
      "- `display-lg`: 3.25rem, fluid from 2.25rem, line height 1.12, weight 900; 2.25rem in the docs set. Hero.",
    );
  });
});

describe("the generator", () => {
  it("stops the build when tokens.json loses a family", () => {
    expect(() => llmsTxt({ type: tokens.type }, pkg)).toThrow(
      /has no "color" family/,
    );
  });

  it("rejects a tokens.json that lacks a token family", () => {
    const { shadow: _shadow, ...withoutShadow } = tokens;
    expect(() => llmsTxt(withoutShadow, pkg)).toThrow(
      'llms: tokens.json has no "shadow" family. Update FAMILIES in src/llms.ts to match it.',
    );
  });
});
