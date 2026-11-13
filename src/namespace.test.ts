import { describe, expect, it } from "vitest";
import { cssVar, ns } from "./namespace.ts";

describe("ns", () => {
  it("prefixes a design system custom property", () => {
    expect(ns("--color-action-default: #155dfc;")).toBe(
      "--igd-color-action-default: #155dfc;",
    );
  });

  it("prefixes a design system name inside var()", () => {
    expect(ns("padding: var(--space-inset-md);")).toBe(
      "padding: var(--igd-space-inset-md);",
    );
  });

  it("leaves an engine name alone", () => {
    const text = "--color: var(--ig-primary-500); --ig-size: 3;";
    expect(ns(text)).toBe("--igd-color: var(--ig-primary-500); --ig-size: 3;");
  });

  it("leaves the custom properties the engine emits without a prefix alone", () => {
    const text =
      "--component-size: var(--ig-size); --is-large: 1; --y: 0; --y-contrast: xyz-d65 var(--y) var(--y) var(--y);";
    expect(ns(text)).toBe(text);
  });

  it("prefixes a name that only starts like a bare engine name", () => {
    expect(ns("--y-offset: 0; --is-largest: 1;")).toBe(
      "--igd-y-offset: 0; --igd-is-largest: 1;",
    );
  });

  it("leaves a class-name modifier alone", () => {
    const text = ".button--primary .a--b";
    expect(ns(text)).toBe(text);
  });

  it("gives the same text when applied twice", () => {
    const once = ns("--space-md: var(--space-lg); --ig-size: 3;");
    expect(ns(once)).toBe(once);
  });
});

describe("cssVar", () => {
  it("keeps the engine prefix of an engine name", () => {
    expect(cssVar("ig-dark-surface-200")).toBe("--ig-dark-surface-200");
  });

  it("adds the published prefix to a design system name", () => {
    expect(cssVar("color-text-muted")).toBe("--igd-color-text-muted");
  });
});
