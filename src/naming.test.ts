import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { NOT_USED, PROPERTIES, STATES } from "./naming.ts";

const colours = (
  JSON.parse(fs.readFileSync("dist/tokens.json", "utf8")).color.tokens as {
    name: string;
  }[]
)
  .map((t) => t.name)
  .filter((n) => !n.startsWith("ig-"));
const semantic = colours.filter((n) => n.startsWith("color-"));
const properties: string[] = PROPERTIES.map((p) => p.word);
const states: string[] = STATES.map((s) => s.word);

describe("the colour names", () => {
  it("has semantic colours to check", () => {
    expect(semantic.length).toBeGreaterThan(40);
  });

  it.each(semantic.map((n) => [n]))(
    "%s names its property right after color-",
    (name) => {
      expect(properties).toContain(name.split("-")[1]);
    },
  );

  it.each(colours.map((n) => [n]))(
    "%s uses no word the names leave out",
    (name) => {
      for (const word of name.split("-"))
        expect(Object.keys(NOT_USED), `${name}: ${word}`).not.toContain(word);
    },
  );

  it.each(colours.map((n) => [n]))(
    "%s puts a state word last, if it has one",
    (name) => {
      const words = name.split("-");
      const at = words.findIndex((w) => states.includes(w));
      if (at >= 0) expect(at, name).toBe(words.length - 1);
    },
  );
});

describe("the naming rules in the documents", () => {
  const readme = fs.readFileSync("README.md", "utf8");
  const llms = fs.readFileSync("llms.txt", "utf8");

  it("README.md and llms.txt explain every property word", () => {
    for (const { word } of PROPERTIES) {
      expect(readme).toContain(`\`${word}\``);
      expect(llms).toContain(`\`${word}\``);
    }
  });
});

describe("a brand colour that is not ours", () => {
  const all = JSON.parse(fs.readFileSync("dist/tokens.json", "utf8")).color
    .tokens as { name: string; value: string; usage: string }[];
  const thirdParty = all.filter((t) =>
    /^framework-(angular|react)-/.test(t.name),
  );

  it("covers the Angular and React pills", () => {
    expect(thirdParty).toHaveLength(6);
  });

  it.each(thirdParty.map((t) => [t.name, t]))(
    "%s is typed, not read from our palettes, and says so",
    (_, t) => {
      expect(t.value).toMatch(/^#[0-9a-f]{6}$/);
      expect(t.usage).toContain("A brand colour that is not ours");
    },
  );
});
