import { describe, expect, it } from "vitest";
import { ns } from "./namespace.ts";

describe("ns", () => {
  it("renames an engine custom property", () => {
    expect(ns("--ig-primary-500: #155dfc;")).toBe(
      "--igd-primary-500: #155dfc;",
    );
  });

  it("renames an engine name inside var()", () => {
    expect(ns("color: var(--ig-gray-900);")).toBe(
      "color: var(--igd-gray-900);",
    );
  });

  it("renames a bare token name in JSON and in an alias", () => {
    expect(ns('"name": "ig-gray-900", "value": "{ig-surface-base}"')).toBe(
      '"name": "igd-gray-900", "value": "{igd-surface-base}"',
    );
  });

  it("leaves a name that only contains ig- alone", () => {
    const text = "config-value big-step --color-ig-thing";
    expect(ns(text)).toBe(text);
  });

  it("leaves ig- alone when no letter follows", () => {
    expect(ns("ig-500 ig-")).toBe("ig-500 ig-");
  });

  it("leaves a published name alone", () => {
    const text = "--igd-size: 3; igd-primary-500";
    expect(ns(text)).toBe(text);
  });

  it("gives the same text when applied twice", () => {
    const once = ns("--ig-size: var(--ig-size-large); {ig-primary-600}");
    expect(ns(once)).toBe(once);
  });
});
