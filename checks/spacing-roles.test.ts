import { describe, expect, it } from "vitest";
import { rawSteps, role } from "./spacing-roles.ts";

describe("role", () => {
  it("maps padding properties to inset", () => {
    expect(role("padding")).toBe("inset");
    expect(role("padding-inline")).toBe("inset");
    expect(role("paddingTop")).toBe("inset");
  });

  it("maps gaps and inline margins to gap", () => {
    expect(role("gap")).toBe("gap");
    expect(role("row-gap")).toBe("gap");
    expect(role("marginLeft")).toBe("gap");
    expect(role("margin-inline")).toBe("gap");
  });

  it("maps the other margins to stack", () => {
    expect(role("margin")).toBe("stack");
    expect(role("margin-top")).toBe("stack");
    expect(role("marginBottom")).toBe("stack");
  });

  it("returns null for a property that is not spacing", () => {
    expect(role("width")).toBeNull();
    expect(role("border-radius")).toBeNull();
  });
});

describe("rawSteps", () => {
  it("reports a raw step used as padding in CSS and names the role token", () => {
    expect(rawSteps(".a { padding: var(--igd-space-md); }")).toEqual([
      {
        prop: "padding",
        value: "var(--igd-space-md)",
        fix: "var(--igd-space-inset-md)",
      },
    ]);
  });

  it("reports a raw step in a JSX style object", () => {
    expect(rawSteps('style={{ marginTop: "var(--igd-space-2xl)" }}')).toEqual([
      {
        prop: "marginTop",
        value: "var(--igd-space-2xl)",
        fix: "var(--igd-space-stack-2xl)",
      },
    ]);
  });

  it("reports each raw step of a gap", () => {
    expect(
      rawSteps(".a { gap: var(--igd-space-xs) var(--igd-space-lg); }"),
    ).toEqual([
      {
        prop: "gap",
        value: "var(--igd-space-xs)",
        fix: "var(--igd-space-gap-xs)",
      },
      {
        prop: "gap",
        value: "var(--igd-space-lg)",
        fix: "var(--igd-space-gap-lg)",
      },
    ]);
  });

  it("accepts a role token", () => {
    expect(rawSteps(".a { padding: var(--igd-space-inset-md); }")).toEqual([]);
  });

  it("accepts a raw step on a property that is not spacing", () => {
    expect(rawSteps(".a { width: var(--igd-space-4xl); }")).toEqual([]);
  });
});
