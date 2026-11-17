import { describe, expect, it } from "vitest";
import { layoutRules, sectionSpace } from "./layout.ts";

describe("layoutRules", () => {
  it("rejects a stylesheet without a dialed rule", () => {
    expect(() =>
      layoutRules(":root {\n  --a: 1;\n}\n:root {\n  --b: 2;\n}\n"),
    ).toThrow(
      "layout stylesheet: rules of one dialed selector and at least one :root rule expected",
    );
  });

  it("rejects a stylesheet without a :root rule", () => {
    expect(() =>
      layoutRules(":root, [data-ig-scope] {\n  --a: 1;\n}\n"),
    ).toThrow(
      "layout stylesheet: rules of one dialed selector and at least one :root rule expected",
    );
  });

  it("rejects dialed rules of two selectors", () => {
    expect(() =>
      layoutRules(
        ":root, [data-ig-scope] {\n  --a: 1;\n}\n[data-x] {\n  --b: 2;\n}\n:root {\n  --c: 3;\n}\n",
      ),
    ).toThrow("rules of one dialed selector");
  });

  it("joins the dialed rules into one and the :root rules into one", () => {
    expect(
      layoutRules(
        ":root, [data-ig-scope] {\n  --a: 1;\n}\n\n:root, [data-ig-scope] {\n  --d: 4;\n}\n\n:root {\n  --b: 2;\n}\n\n:root {\n  --c: 3;\n}\n",
      ),
    ).toEqual({
      dialed: {
        selector: ":root, [data-ig-scope]",
        body: "  --a: 1;\n  --d: 4;",
      },
      root: "  --b: 2;\n  --c: 3;",
    });
  });
});

describe("sectionSpace", () => {
  it("grows between the two spacing steps of SECTION_SPACE", () => {
    expect(sectionSpace()).toBe(
      "clamp(var(--space-5xl), calc(3.4783cqi + 3.2174rem), var(--space-6xl))",
    );
  });
});
