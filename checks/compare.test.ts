import { describe, expect, it } from "vitest";
import { differences, PROPS } from "./compare.ts";

const row = (over: Partial<Record<(typeof PROPS)[number], string>> = {}) => [
  "P",
  ...PROPS.map((p) => over[p] ?? "x"),
];

describe("differences", () => {
  it("reports nothing for two equal snapshots", () => {
    expect(differences([row(), row()], [row(), row()])).toEqual([]);
  });

  it("names the property and both values, and counts the elements", () => {
    const before = [row({ fontSize: "16px" }), row({ fontSize: "16px" })];
    const after = [row({ fontSize: "19px" }), row({ fontSize: "19px" })];
    expect(differences(before, after)).toEqual([
      { prop: "fontSize", before: "16px", after: "19px", count: 2 },
    ]);
  });

  it("lists the most frequent difference first", () => {
    const before = [row(), row(), row({ color: "a" })];
    const after = [
      row({ height: "9" }),
      row({ height: "9" }),
      row({ color: "b" }),
    ];
    expect(differences(before, after).map((d) => d.prop)).toEqual([
      "height",
      "color",
    ]);
  });

  it("ignores the element name, which is not a compared property", () => {
    expect(
      differences(
        [["P", ...PROPS.map(() => "x")]],
        [["DIV", ...PROPS.map(() => "x")]],
      ),
    ).toEqual([]);
  });
});
