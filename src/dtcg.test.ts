import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { color, dim, toDtcg } from "./dtcg.ts";
import type { Token, Tokens } from "./types.ts";

const t = (name: string, value: string): Token => ({ name, value, usage: "" });

const tokens = (over: Partial<Tokens> = {}): Tokens => ({
  name: "Test",
  version: 1,
  color: { themes: [], tokens: [] },
  type: {
    fonts: [],
    families: { display: "'A', sans-serif", body: "'B'", mono: "'C'" },
    groups: [],
  },
  spacing: { tokens: [] },
  radius: { tokens: [] },
  size: { tokens: [] },
  shadow: { tokens: [] },
  opacity: { tokens: [] },
  weight: { tokens: [] },
  gradient: { tokens: [] },
  breakpoint: { tokens: [] },
  zIndex: { tokens: [] },
  ...over,
});

describe("color", () => {
  it("converts a hex colour to sRGB components and keeps the hex", () => {
    expect(color("#FF0080")).toEqual({
      colorSpace: "srgb",
      components: [1, 0, 0.502],
      hex: "#ff0080",
    });
  });

  it("carries the alpha of an rgba() colour", () => {
    expect(color("rgba(255,0,0,0.25)")).toEqual({
      colorSpace: "srgb",
      components: [1, 0, 0],
      alpha: 0.25,
      hex: "#ff0000",
    });
  });

  it("drops an alpha of 1", () => {
    expect(color("rgba(0,0,0,1)")).not.toHaveProperty("alpha");
  });

  it("returns null for a value that is not a plain colour", () => {
    expect(color("var(--x)")).toBeNull();
    expect(color("hsl(from var(--x) h s l / 0.5)")).toBeNull();
  });
});

describe("dim", () => {
  it("splits a length into value and unit", () => {
    expect(dim("1.5rem")).toEqual({ value: 1.5, unit: "rem" });
    expect(dim("-2px")).toEqual({ value: -2, unit: "px" });
  });

  it("reads a bare 0 as 0px", () => {
    expect(dim("0")).toEqual({ value: 0, unit: "px" });
  });

  it("returns null for a unit the format has no dimension for", () => {
    expect(dim("0.12em")).toBeNull();
  });
});

describe("toDtcg", () => {
  it("writes a colour alias as a reference into the color group", () => {
    const { groups, errs } = toDtcg(
      tokens({
        color: {
          themes: [],
          tokens: [
            t("ig-gray-900", "#111111"),
            t("color-text", "{ig-gray-900}"),
          ],
        },
      }),
      "",
    );
    expect(errs).toEqual([]);
    expect(groups.color["color-text"]).toEqual({
      $value: "{color.ig-gray-900}",
    });
  });

  it("reports an alias that points at a missing token", () => {
    const { errs } = toDtcg(
      tokens({ color: { themes: [], tokens: [t("color-text", "{ig-nope}")] } }),
      "",
    );
    expect(errs).toEqual([
      "alias to missing token color.ig-nope (from color.color-text)",
    ]);
  });

  it("lists a colour the format cannot express as CSS-only", () => {
    const { groups, cssOnly } = toDtcg(
      tokens({
        color: { themes: [], tokens: [t("glow", "hsl(from red h s l / 0.5)")] },
      }),
      "",
    );
    expect(groups.color.glow).toBeUndefined();
    expect(cssOnly.glow).toEqual({
      value: "hsl(from red h s l / 0.5)",
      reason: "not a plain colour",
    });
  });

  it("puts an em size in letterSpacing as a number", () => {
    const { groups } = toDtcg(
      tokens({ size: { tokens: [t("letter-spacing-label", "0.12em")] } }),
      "",
    );
    expect(groups.letterSpacing["letter-spacing-label"]).toEqual({
      $value: 0.12,
    });
    expect(groups.size["letter-spacing-label"]).toBeUndefined();
  });

  it("writes a two-layer shadow as an array of layers", () => {
    const { groups } = toDtcg(
      tokens({
        shadow: {
          tokens: [
            t(
              "shadow-raised",
              "0 1px 2px 0 rgba(0,0,0,0.2), inset 0 0 0 1px rgba(0,0,0,0.1)",
            ),
          ],
        },
      }),
      "",
    );
    const layers = groups.shadow["shadow-raised"] as { $value: object[] };
    expect(layers.$value).toHaveLength(2);
    expect(layers.$value[0]).toMatchObject({
      offsetY: { value: 1, unit: "px" },
      blur: { value: 2, unit: "px" },
    });
    expect(layers.$value[1]).toMatchObject({ inset: true });
  });

  it("lists `none` and a drop-shadow filter as CSS-only shadows", () => {
    const { cssOnly } = toDtcg(
      tokens({
        shadow: {
          tokens: [
            t("shadow-none", "none"),
            t("shadow-filter", "drop-shadow(0 1px 2px rgba(0,0,0,0.2))"),
          ],
        },
      }),
      "",
    );
    expect(cssOnly["shadow-none"].reason).toBe("no shadow");
    expect(cssOnly["shadow-filter"].reason).toBe(
      "a CSS filter, not a box shadow",
    );
  });

  it("keeps the angle of a linear gradient under $extensions and spreads stops without a position", () => {
    const value = "linear-gradient(92deg, #000000, #ffffff)";
    const { groups } = toDtcg(
      tokens({ gradient: { tokens: [t("gradient-brand", value)] } }),
      "",
    );
    expect(groups.gradient["gradient-brand"]).toMatchObject({
      $value: [{ position: 0 }, { position: 1 }],
      $extensions: { "com.infragistics.css": { angle: 92, value } },
    });
  });

  it("lists a radial glow as CSS-only", () => {
    const { cssOnly } = toDtcg(
      tokens({
        gradient: {
          tokens: [
            t("glow-blue", "radial-gradient(circle, #000000, transparent 62%)"),
          ],
        },
      }),
      "",
    );
    expect(cssOnly["glow-blue"].reason).toBe("a radial glow");
  });

  it("writes line height as a multiple of the font size and letter spacing in the font unit", () => {
    const { groups, errs } = toDtcg(
      tokens({
        type: {
          fonts: [],
          families: { display: "'A', sans-serif", body: "'B'", mono: "'C'" },
          groups: [
            {
              name: "Body",
              family: "body",
              styles: [
                {
                  name: "type-overline",
                  fontSize: "0.75rem",
                  lineHeight: "1.125rem",
                  fontWeight: 600,
                  letterSpacing: "0.16em",
                  usage: "",
                  sample: "",
                },
              ],
            },
          ],
        },
      }),
      "",
    );
    expect(errs).toEqual([]);
    expect(groups.typography["type-overline"]).toEqual({
      $value: {
        fontFamily: "{fontFamily.font-body}",
        fontSize: { value: 0.75, unit: "rem" },
        fontWeight: 600,
        letterSpacing: { value: 0.12, unit: "rem" },
        lineHeight: 1.5,
      },
    });
  });

  it("reads durations and easings from the theme stylesheet", () => {
    const { groups } = toDtcg(
      tokens(),
      ":root {\n  --duration-fast: 160ms;\n  --easing-default: cubic-bezier(0.33, 1, 0.68, 1);\n}",
    );
    expect(groups.duration["duration-fast"]).toEqual({
      $value: { value: 160, unit: "ms" },
    });
    expect(groups.easing["easing-default"]).toEqual({
      $value: [0.33, 1, 0.68, 1],
    });
  });

  it("drops the duration and easing groups when the stylesheet has none", () => {
    const { groups } = toDtcg(tokens(), "");
    expect(groups).not.toHaveProperty("duration");
    expect(groups).not.toHaveProperty("easing");
  });

  it("converts the committed tokens to 457 tokens with 8 CSS-only and no error", () => {
    const { flat, cssOnly, errs } = toDtcg(
      JSON.parse(fs.readFileSync("dist/tokens.json", "utf8")),
      fs.readFileSync("dist/theme.css", "utf8"),
    );
    expect(errs).toEqual([]);
    expect(Object.keys(flat)).toHaveLength(457);
    expect(Object.keys(cssOnly)).toHaveLength(8);
  });
});
