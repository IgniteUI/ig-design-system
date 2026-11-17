import { describe, expect, it } from "vitest";
import {
  aaThreshold,
  actionTextIndex,
  assertPairingsPass,
  assertSeedStandsOut,
  contrastRows,
  guardOf,
} from "./contrast.ts";

describe("assertSeedStandsOut", () => {
  it("rejects a primary seed below 3:1 on the page", () => {
    expect(() => assertSeedStandsOut("#ffd400", "1.41")).toThrow(
      "The primary seed #ffd400 is 1.41:1 on the page. A filled control needs 3:1 against its surroundings. Pick a darker primary seed.",
    );
  });

  it("accepts a primary seed at 3:1 on the page", () => {
    expect(() => assertSeedStandsOut("#0f9d58", "3")).not.toThrow();
  });
});

describe("actionTextIndex", () => {
  it("rejects a seed with no step that clears 4.5:1 on every light surface", () => {
    expect(() =>
      actionTextIndex([
        ["4.6", "4.4"],
        ["4.49", "7"],
      ]),
    ).toThrow(
      "No primary step from 500 to 900 clears 4.5:1 on every light surface. Pick a different primary seed.",
    );
  });

  it("picks the first candidate that clears 4.5:1 on every surface", () => {
    expect(
      actionTextIndex([
        ["3.2", "3.1"],
        ["4.5", "4.6"],
        ["9", "9"],
      ]),
    ).toBe(1);
  });
});

describe("guardOf", () => {
  it("rejects a guard stylesheet with no adaptive-contrast variables", () => {
    expect(() => guardOf(".guard {\n  --luminance: 0.2;\n}\n")).toThrow(
      "adaptive-contrast(): no variables emitted",
    );
  });

  it("rejects a guard stylesheet that lacks a variable", () => {
    expect(() => guardOf(".adaptive {\n  --ig-wcag-aa: 0.18;\n}\n")).toThrow(
      "guard: --luminance missing",
    );
  });
});

describe("aaThreshold", () => {
  it("rejects adaptive-contrast output without --ig-wcag-aa", () => {
    expect(() => aaThreshold(["--ig-wcag-aaa: 0.1;"])).toThrow(
      "adaptive-contrast(): --ig-wcag-aa missing",
    );
  });

  it("reads the AA luminance threshold", () => {
    expect(aaThreshold(["--ig-wcag-a: 0.3;", "--ig-wcag-aa: 0.18;"])).toBe(
      0.18,
    );
  });
});

describe("contrastRows", () => {
  it("rejects a stylesheet that does not hold one ratio per pairing", () => {
    expect(() =>
      contrastRows(".ratios {\n  --r-0: 7.1;\n}\n", [
        ["a", "b"],
        ["c", "d"],
      ]),
    ).toThrow("contrast(): one ratio per pairing expected");
  });

  it("holds a pairing to 4.5:1 unless it names a minimum", () => {
    expect(
      contrastRows(".ratios {\n  --r-0: 4.2;\n  --r-1: 3.1;\n}\n", [
        ["a", "b"],
        ["c", "d", 3],
      ]),
    ).toEqual([
      { fg: "a", bg: "b", ratio: 4.2, min: 4.5, ok: false },
      { fg: "c", bg: "d", ratio: 3.1, min: 3, ok: true },
    ]);
  });
});

describe("assertPairingsPass", () => {
  const row = (fg: string, ratio: number, min = 4.5) => ({
    fg,
    bg: "color-surface-page",
    ratio,
    min,
    ok: ratio >= min,
  });

  it("rejects a pairing below its minimum and names it", () => {
    expect(() =>
      assertPairingsPass([row("color-text-muted", 3.9), row("x", 9)]),
    ).toThrow(
      "1 contrast pairing(s) are below their minimum: color-text-muted on color-surface-page is 3.9:1, needs 4.5:1. Pick a darker or lighter step for the token in src/spec.ts.",
    );
  });

  it("accepts pairings at or above their minimum", () => {
    expect(() =>
      assertPairingsPass([row("color-text-muted", 4.5), row("x", 3, 3)]),
    ).not.toThrow();
  });

  it("does not hold the action fill to the text minimum", () => {
    expect(() =>
      assertPairingsPass([
        row("color-action-default", 3.4),
        row("color-action-active", 4),
      ]),
    ).not.toThrow();
  });
});
