import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { ALIAS, ALPHA, CONTRAST_PAIRS } from "./spec.ts";

describe("CONTRAST_PAIRS", () => {
  it("lists each pairing once", () => {
    const keys = CONTRAST_PAIRS.map(
      ([fg, bg, min = 4.5]) => `${fg} on ${bg} at ${min}`,
    );
    expect(keys.filter((k, i) => keys.indexOf(k) !== i)).toEqual([]);
  });

  it("names only tokens the built stylesheets declare", () => {
    const css =
      fs.readFileSync("dist/tokens.css", "utf8") +
      fs.readFileSync("dist/theme.css", "utf8");
    const missing = CONTRAST_PAIRS.flatMap((pair) => [pair[0], pair[1]]).filter(
      (n) => !css.includes(`--igd-${n}:`),
    );
    expect(missing).toEqual([]);
  });

  it("measures every text colour that aliases a palette step against at least one background", () => {
    const measured = new Set(CONTRAST_PAIRS.map(([fg]) => fg));
    const text = [...Object.keys(ALIAS), ...Object.keys(ALPHA)].filter(
      (n) => /^color-(text|link|feedback)-/.test(n) && !n.endsWith("-surface"),
    );
    expect(text.filter((n) => !measured.has(n))).toEqual([]);
  });
});
