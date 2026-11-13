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
    expect(rawSteps(".a { padding: var(--space-md); }")).toEqual([
      {
        prop: "padding",
        value: "var(--space-md)",
        fix: "var(--space-inset-md)",
      },
    ]);
  });

  it("reports a raw step in a JSX style object", () => {
    expect(rawSteps('style={{ marginTop: "var(--space-2xl)" }}')).toEqual([
      {
        prop: "marginTop",
        value: "var(--space-2xl)",
        fix: "var(--space-stack-2xl)",
      },
    ]);
  });

  it("reports each raw step of a gap", () => {
    expect(rawSteps(".a { gap: var(--space-xs) var(--space-lg); }")).toEqual([
      { prop: "gap", value: "var(--space-xs)", fix: "var(--space-gap-xs)" },
      { prop: "gap", value: "var(--space-lg)", fix: "var(--space-gap-lg)" },
    ]);
  });

  it("accepts a role token", () => {
    expect(rawSteps(".a { padding: var(--space-inset-md); }")).toEqual([]);
  });

  it("accepts a raw step on a property that is not spacing", () => {
    expect(rawSteps(".a { width: var(--space-4xl); }")).toEqual([]);
  });
});
