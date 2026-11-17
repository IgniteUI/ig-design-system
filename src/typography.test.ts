import { describe, expect, it } from "vitest";
import {
  assertFluidRoles,
  assertTypeSetRoles,
  typeScaleOf,
} from "./typography.ts";

const roles = ["display-lg", "body-md"];
const entry = { sizePx: 16, line: 1.5, weight: 400 };

describe("assertFluidRoles", () => {
  it("rejects a fluid minimum for a name that is not a type role", () => {
    expect(() => assertFluidRoles({ headline: 30 }, roles)).toThrow(
      'TYPE_MIN names "headline", which is not a type role. The roles are: display-lg, body-md.',
    );
  });

  it("accepts a fluid minimum for a type role", () => {
    expect(() => assertFluidRoles({ "display-lg": 36 }, roles)).not.toThrow();
  });
});

describe("assertTypeSetRoles", () => {
  it("rejects a type set that leaves a role out", () => {
    expect(() =>
      assertTypeSetRoles("docs", { "display-lg": entry }, roles),
    ).toThrow(
      "TYPE_SETS.docs must list each type role once. Missing: body-md. The roles are: display-lg, body-md.",
    );
  });

  it("rejects a type set that names something that is not a role", () => {
    expect(() =>
      assertTypeSetRoles(
        "docs",
        { "display-lg": entry, "body-md": entry, headline: entry },
        roles,
      ),
    ).toThrow(
      "TYPE_SETS.docs must list each type role once. Not a role: headline. The roles are: display-lg, body-md.",
    );
  });

  it("names both the unknown and the missing roles", () => {
    expect(() =>
      assertTypeSetRoles("blog", { headline: entry }, roles),
    ).toThrow(
      "TYPE_SETS.blog must list each type role once. Not a role: headline. Missing: display-lg, body-md. The roles are: display-lg, body-md.",
    );
  });

  it("accepts a type set that lists each role once", () => {
    expect(() =>
      assertTypeSetRoles(
        "docs",
        { "display-lg": entry, "body-md": entry },
        roles,
      ),
    ).not.toThrow();
  });
});

describe("typeScaleOf", () => {
  const css =
    ":root {\n  --ig-h1-font-size: 3.25rem;\n  --ig-h1-line-height: 1.12;\n  --ig-body-1-font-size: 1rem;\n}\n";

  it("rejects engine output that lacks a slot", () => {
    expect(() => typeScaleOf(css, ["h1", "detail-1"])).toThrow(
      "slot missing in engine output: detail-1",
    );
  });

  it("reads each slot's properties", () => {
    expect(typeScaleOf(css, ["h1", "body-1"])).toEqual({
      h1: { "font-size": "3.25rem", "line-height": "1.12" },
      "body-1": { "font-size": "1rem" },
    });
  });
});
