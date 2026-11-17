import { describe, expect, it } from "vitest";
import { brandSeed } from "./palette-sets.ts";

describe("brandSeed", () => {
  it("rejects a seed that is not a six-digit hex colour", () => {
    expect(() => brandSeed("IGD_SEED_PRIMARY", "green", "#155dfc")).toThrow(
      'IGD_SEED_PRIMARY is "green". A seed is a six-digit hex colour, such as #0f9d58.',
    );
  });

  it("rejects a three-digit hex colour", () => {
    expect(() => brandSeed("IGD_SEED_SECONDARY", "#0f9", "#9810fa")).toThrow(
      'IGD_SEED_SECONDARY is "#0f9". A seed is a six-digit hex colour, such as #0f9d58.',
    );
  });

  it("takes a six-digit hex colour", () => {
    expect(brandSeed("IGD_SEED_PRIMARY", "#0f9d58", "#155dfc")).toBe("#0f9d58");
  });

  it("falls back when the variable is unset or empty", () => {
    expect(brandSeed("IGD_SEED_PRIMARY", undefined, "#155dfc")).toBe("#155dfc");
    expect(brandSeed("IGD_SEED_PRIMARY", "", "#155dfc")).toBe("#155dfc");
  });
});
