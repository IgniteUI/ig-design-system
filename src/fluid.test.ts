import { describe, expect, it } from "vitest";
import { fluid } from "./fluid.ts";

// Evaluates the clamp() that fluid() returns for one container width, in px.
const at = (css: string, widthPx: number) => {
  const m = css.match(
    /^clamp\(([\d.]+)rem, calc\(([\d.]+)cqi ([+-]) ([\d.]+)rem\), ([\d.]+)rem\)$/,
  );
  if (!m) throw new Error(`unexpected shape: ${css}`);
  const [min, slope, sign, base, max] = [m[1], m[2], m[3], m[4], m[5]];
  const preferred =
    (+slope / 100) * widthPx + (sign === "-" ? -1 : 1) * +base * 16;
  return Math.min(Math.max(preferred, +min * 16), +max * 16);
};

describe("fluid", () => {
  const css = fluid(40, 70, 360, 1280);

  it("returns a clamp() between the two sizes in rem", () => {
    expect(css).toBe("clamp(2.5rem, calc(3.2609cqi + 1.7663rem), 4.375rem)");
  });

  it("is the minimum at the narrow width and below it", () => {
    expect(at(css, 360)).toBeCloseTo(40, 1);
    expect(at(css, 200)).toBe(40);
  });

  it("is the maximum at the wide width and above it", () => {
    expect(at(css, 1280)).toBeCloseTo(70, 1);
    expect(at(css, 2000)).toBe(70);
  });

  it("is halfway between the sizes halfway between the widths", () => {
    expect(at(css, 820)).toBeCloseTo(55, 1);
  });

  it("writes a negative base with a minus sign", () => {
    expect(fluid(16, 64, 600, 1200)).toBe(
      "clamp(1rem, calc(8cqi - 2rem), 4rem)",
    );
  });

  it("rejects a minimum that is not below the maximum", () => {
    expect(() => fluid(70, 70, 360, 1280)).toThrow(
      "fluid(): the minimum 70px must be below the maximum 70px.",
    );
  });

  it("rejects a width range that does not grow", () => {
    expect(() => fluid(40, 70, 1280, 360)).toThrow(
      "fluid(): the width range must grow, got 1280px to 360px.",
    );
  });
});
