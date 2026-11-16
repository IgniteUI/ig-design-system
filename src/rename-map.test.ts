import { describe, expect, it } from "vitest";
import { NEWSPACE, SPACEMAP } from "./rename-map.ts";
import { SPACE } from "./spec.ts";

describe("spacing migration map", () => {
  const steps = Object.values(SPACE);

  it("points every old spacing value at a step that exists", () => {
    for (const [old, target] of Object.entries(SPACEMAP))
      expect(steps, `--space-${old}`).toContain(target);
  });

  it("lists the same steps as the spacing scale", () => {
    expect(NEWSPACE).toEqual(steps);
  });
});
