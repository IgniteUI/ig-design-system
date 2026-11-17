import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { engineHex } from "./engine-colors.ts";
import { ALIAS, ALPHA, CONTRAST_PAIRS, DARK_STEP } from "./spec.ts";

// The family of an engine step: `primary` of `ig-primary-600`.
const family = (step: string) => step.replace(/^ig-([a-z]+)-\w+$/, "$1");

describe("DARK_STEP", () => {
  it("names only tokens that alias an engine step", () => {
    const unknown = Object.keys(DARK_STEP).filter(
      (name) => engineHex(ALIAS[name]?.[0] ?? "") === null,
    );
    expect(unknown).toEqual([]);
  });

  it("gives each token a step the palette has", () => {
    const missing = Object.entries(DARK_STEP).filter(
      ([, step]) => !engineHex(step),
    );
    expect(missing).toEqual([]);
  });

  it("keeps each token in the family of its light alias", () => {
    const moved = Object.entries(DARK_STEP).filter(
      ([name, step]) => family(step) !== family(ALIAS[name][0]),
    );
    expect(moved).toEqual([]);
  });

  it("gives each token a step other than its light alias", () => {
    const same = Object.entries(DARK_STEP).filter(
      ([name, step]) => step === ALIAS[name][0],
    );
    expect(same).toEqual([]);
  });

  it("lists every text token that aliases a brand, status or accent step", () => {
    const text = Object.entries(ALIAS)
      .filter(
        ([name, [step]]) =>
          /^color-action-text$|^color-feedback-[a-z]+-default$|-color$/.test(
            name,
          ) && /^ig-(?!gray-|surface-|dark-)[a-z]+-\d+$/.test(step),
      )
      .map(([name]) => name);
    expect(text.filter((name) => !(name in DARK_STEP))).toEqual([]);
  });
});

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

  it("holds text in the action colour to 4.5:1 on the four light surfaces", () => {
    const surfaces = CONTRAST_PAIRS.filter(
      ([fg, , min = 4.5]) => fg === "color-action-text" && min === 4.5,
    ).map(([, bg]) => bg);
    expect(surfaces).toEqual([
      "color-surface-page",
      "color-surface-tint",
      "color-surface-card",
      "color-surface-subtle",
    ]);
  });

  it("holds the action fill to no minimum against the page", () => {
    expect(
      CONTRAST_PAIRS.filter(([fg]) => fg === "color-action-default"),
    ).toEqual([["color-action-default", "color-surface-page", 1]]);
  });

  it("measures every text colour that aliases a palette step against at least one background", () => {
    const measured = new Set(CONTRAST_PAIRS.map(([fg]) => fg));
    const text = [...Object.keys(ALIAS), ...Object.keys(ALPHA)].filter(
      (n) => /^color-(text|link|feedback)-/.test(n) && !n.endsWith("-surface"),
    );
    expect(text.filter((n) => !measured.has(n))).toEqual([]);
  });
});
