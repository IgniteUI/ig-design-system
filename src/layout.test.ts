import { describe, expect, it } from "vitest";
import { layoutRules, sectionSpace } from "./layout.ts";

describe("layoutRules", () => {
  it("rejects a stylesheet without a sized rule", () => {
    expect(() =>
      layoutRules(":root {\n  --a: 1;\n}\n:root {\n  --b: 2;\n}\n"),
    ).toThrow(
      "layout stylesheet: one sized rule and at least one :root rule expected",
    );
  });

  it("rejects a stylesheet without a :root rule", () => {
    expect(() => layoutRules(":root, [data-size] {\n  --a: 1;\n}\n")).toThrow(
      "layout stylesheet: one sized rule and at least one :root rule expected",
    );
  });

  it("returns the sized rule and the joined :root declarations", () => {
    expect(
      layoutRules(
        ":root, [data-size] {\n  --a: 1;\n}\n\n:root {\n  --b: 2;\n}\n\n:root {\n  --c: 3;\n}\n",
      ),
    ).toEqual({
      sized: { selector: ":root, [data-size]", body: "  --a: 1;" },
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
