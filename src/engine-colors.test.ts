import { describe, expect, it } from "vitest";
import { engineHex, hexOf, unpublishedStepNote } from "./engine-colors.ts";

describe("hexOf", () => {
  it("rejects a name that is neither a token nor an engine step", () => {
    expect(() => hexOf("color-does-not-exist")).toThrow(
      "unknown colour color-does-not-exist",
    );
  });

  it("follows an alias to its engine step", () => {
    expect(hexOf("color-background-action")).toBe(engineHex("ig-primary-seed"));
  });

  it("returns a published value in place of the alias", () => {
    expect(
      hexOf("color-foreground-on-action", {
        "color-foreground-on-action": "#000000",
      }),
    ).toBe("#000000");
  });
});

describe("unpublishedStepNote", () => {
  it("names the step of an accent palette", () => {
    expect(unpublishedStepNote("ig-pink-400")).toBe(
      " Engine step 400 of the pink palette.",
    );
  });

  it("names the step of a dark ramp", () => {
    expect(unpublishedStepNote("ig-dark-surface-500")).toBe(
      " Engine step 500 of the dark palette's surface ramp.",
    );
  });

  it("is empty for a published step", () => {
    expect(unpublishedStepNote("ig-primary-500")).toBe("");
  });
});
