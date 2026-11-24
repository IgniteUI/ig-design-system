import { describe, expect, it } from "vitest";
import {
  engineOf,
  groupColours,
  isEngine,
  pick,
  previewOf,
  rampOf,
  readersOf,
} from "./tokens.ts";

const t = (name: string) => ({ name, value: "#000000", usage: "" });

describe("groupColours", () => {
  const { raw, semantic, component } = groupColours([
    t("ig-primary-500"),
    t("ig-gray-900"),
    t("color-action-default"),
    t("color-text-muted"),
    t("color-overlay-scrim"),
    t("footer-link"),
  ]);

  it("puts an engine name in its family", () => {
    expect(Object.keys(raw)).toEqual(["primary", "gray"]);
  });

  it("groups a semantic colour by its role", () => {
    expect(semantic.action.map((x) => x.name)).toEqual([
      "color-action-default",
    ]);
    expect(semantic.text.map((x) => x.name)).toEqual(["color-text-muted"]);
  });

  it("puts a semantic colour with no listed role under other", () => {
    expect(semantic.other.map((x) => x.name)).toEqual(["color-overlay-scrim"]);
  });

  it("puts every other colour in the component tier", () => {
    expect(component.map((x) => x.name)).toEqual(["footer-link"]);
  });
});

describe("previewOf", () => {
  it("previews text and links as text, borders and focus as an outline, the rest as a fill", () => {
    expect(
      ["text", "link", "border", "focus", "surface"].map(previewOf),
    ).toEqual(["text", "text", "outline", "outline", "fill"]);
  });
});

describe("rampOf", () => {
  it("keeps the numbered shades of a family and drops its accents and seed", () => {
    expect(
      rampOf([
        t("ig-gray-50"),
        t("ig-gray-900"),
        t("ig-gray-A100"),
        t("ig-gray-seed"),
      ]).map((x) => x.name),
    ).toEqual(["ig-gray-50", "ig-gray-900"]);
  });

  it("lists a family with no numbered shade by its roles, as the surface is", () => {
    expect(
      rampOf([
        t("ig-surface-base"),
        t("ig-surface-sunken"),
        t("ig-surface-seed"),
      ]).map((x) => x.name),
    ).toEqual(["ig-surface-base", "ig-surface-sunken"]);
  });
});

describe("pick", () => {
  const tokens = [t("radius-sm"), t("radius-lg")];

  it("returns the tokens in the order they are named", () => {
    expect(
      pick(tokens, ["radius-lg", "radius-sm"], "radius").map((x) => x.name),
    ).toEqual(["radius-lg", "radius-sm"]);
  });

  it("stops the build on a name tokens.json does not have, and says where to fix it", () => {
    expect(() => pick(tokens, ["radius-huge"], "radius")).toThrow(
      'The site shows "radius-huge", which is not a radius token in tokens.json. Rename it in site/src/data or remove it from the list.',
    );
  });
});

describe("the engine tokens", () => {
  const all = [
    { name: "ig-gray-500", value: "#68717d", usage: "" },
    { name: "color-text-muted", value: "{ig-gray-500}", usage: "" },
    { name: "caption-color", value: "{color-text-muted}", usage: "" },
    { name: "space-md", value: "1rem", usage: "" },
    { name: "space-inset-md", value: "{space-md}", usage: "" },
    { name: "color-surface-inverse", value: "#0f172a", usage: "" },
    { name: "footer-background", value: "{color-surface-inverse}", usage: "" },
    { name: "loop-a", value: "{loop-b}", usage: "" },
    { name: "loop-b", value: "{loop-a}", usage: "" },
  ];

  it("counts a palette step, a raw spacing step and an engine elevation as engine tokens, and a role not", () => {
    expect(
      ["ig-gray-500", "space-md", "space-2xl", "elevation-8"].every(isEngine),
    ).toBe(true);
    expect(
      [
        "space-inset-md",
        "color-text-muted",
        "elevation-tint-1",
        "radius-md",
      ].some(isEngine),
    ).toBe(false);
  });

  it("follows references through a semantic token to the engine step", () => {
    expect(engineOf(all[2], all)).toBe("ig-gray-500");
  });

  it("finds no engine token for a value written as a colour, or for a loop of references", () => {
    expect(engineOf(all[6], all)).toBeUndefined();
    expect(engineOf(all[7], all)).toBeUndefined();
  });

  it("lists each engine token's readers, direct and through a reference", () => {
    const readers = readersOf(all);
    expect(readers["ig-gray-500"].map((t) => t.name)).toEqual([
      "color-text-muted",
      "caption-color",
    ]);
    expect(readers["space-md"].map((t) => t.name)).toEqual(["space-inset-md"]);
  });
});
