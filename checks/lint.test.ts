import { describe, expect, it } from "vitest";
import { findLiterals } from "./lint.ts";

const rulesOf = (line: string) => findLiterals(line).map((l) => l.rule);

describe("findLiterals", () => {
  it("accepts a line that only uses tokens", () => {
    expect(
      findLiterals(
        'padding: "var(--space-inset-md)", color: "var(--color-text-primary)"',
      ),
    ).toEqual([]);
  });

  it("reports a hex colour", () => {
    expect(findLiterals('color: "#ff0000"')).toEqual([
      { rule: "hex colour", match: "#ff0000" },
    ]);
  });

  it("reports a colour function", () => {
    expect(rulesOf('background: "rgba(0, 0, 0, 0.5)"')).toEqual([
      "rgb/hsl literal",
    ]);
    expect(rulesOf('background: "oklch(0.6 0.2 150)"')).toEqual([
      "rgb/hsl literal",
    ]);
  });

  it("reports px, rem and ms literals", () => {
    expect(
      findLiterals('margin: "12px 1.5rem", transitionDuration: "200ms"'),
    ).toEqual([
      { rule: "px/rem/ms literal", match: "12px" },
      { rule: "px/rem/ms literal", match: "1.5rem" },
      { rule: "px/rem/ms literal", match: "200ms" },
    ]);
  });

  it("reports an em literal and accepts 1em", () => {
    expect(rulesOf('letterSpacing: "0.12em"')).toEqual([
      "em literal (except 1em)",
    ]);
    expect(findLiterals('height: "1em"')).toEqual([]);
  });

  it("reports an easing keyword and a cubic-bezier()", () => {
    expect(rulesOf('transitionTimingFunction: "ease-out"')).toEqual([
      "easing literal",
    ]);
    expect(
      rulesOf('transitionTimingFunction: "cubic-bezier(0, 0, 1, 1)"'),
    ).toEqual(["easing literal"]);
  });

  it("accepts ease-in-out on an animation", () => {
    expect(
      findLiterals(
        'animation: "ig-float var(--duration-float) ease-in-out infinite"',
      ),
    ).toEqual([]);
  });

  it("reports a bare number on a design property and accepts 0 and 1", () => {
    expect(findLiterals("padding: 12")).toEqual([
      { rule: "numeric design prop", match: "padding: 12" },
    ]);
    expect(findLiterals("opacity: 0, zIndex: 1")).toEqual([]);
  });

  it("reports a font shorthand", () => {
    expect(rulesOf('font: "600 var(--x)"')).toEqual(["font shorthand"]);
  });

  it("skips a line comment and a block comment", () => {
    expect(findLiterals("// was #ff0000 and 12px")).toEqual([]);
    expect(findLiterals('/* 12px */ gap: "var(--space-gap-md)"')).toEqual([]);
  });

  it("skips SVG path data and URLs", () => {
    expect(findLiterals('<path d="M12 5l7 7-7 7" />')).toEqual([]);
    expect(findLiterals('href="https://example.com/a-12px#abc123"')).toEqual(
      [],
    );
  });
});
