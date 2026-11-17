import { describe, expect, it } from "vitest";
import {
  aaThreshold,
  actionFillHoverStep,
  actionOnColor,
  assertPairingsPass,
  contrastRows,
  guardOf,
} from "./contrast.ts";

describe("guardOf", () => {
  it("rejects a guard stylesheet with no adaptive-contrast variables", () => {
    expect(() => guardOf(".guard {\n  --luminance: 0.2;\n}\n")).toThrow(
      "adaptive-contrast(): no variables emitted",
    );
  });

  it("rejects a guard stylesheet without the luminance of the fill", () => {
    expect(() => guardOf(".adaptive {\n  --ig-wcag-aa: 0.18;\n}\n")).toThrow(
      "guard: --luminance missing",
    );
  });
});

describe("actionOnColor", () => {
  const adaptiveContrast = ["--ig-wcag-aa: 0.18;"];

  it("puts a black label on a fill above the AA luminance threshold", () => {
    expect(actionOnColor({ luminance: "0.8", adaptiveContrast })).toBe(
      "#000000",
    );
  });

  it("puts a white label on a fill at or below the AA luminance threshold", () => {
    expect(actionOnColor({ luminance: "0.18", adaptiveContrast })).toBe(
      "#ffffff",
    );
  });
});

describe("actionFillHoverStep", () => {
  it("keeps the step in the spec under a white label", () => {
    expect(actionFillHoverStep("#ffffff")).toBeUndefined();
  });

  it("moves the hover fill to primary step 400 under a black label", () => {
    expect(actionFillHoverStep("#000000")).toBe("ig-primary-400");
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

  it("holds text in the action colour to the text minimum", () => {
    expect(() => assertPairingsPass([row("color-action-text", 4.4)])).toThrow(
      "color-action-text on color-surface-page is 4.4:1, needs 4.5:1",
    );
  });
});
