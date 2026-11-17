// Rules the built files in dist/ must hold. They read the files a site loads, not the generator.
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { definedVars, undefinedVars } from "../checks/check-vars.ts";
import { DARK_STEP, SPACE, SPACE_ROLES, TYPE, TYPE_SETS } from "./spec.ts";
import { TOKEN_FAMILIES } from "./types.ts";

const read = (f: string) => fs.readFileSync(`dist/${f}`, "utf8");
const tokens = read("tokens.css");
const theme = read("theme.css");
const base = read("base.css");
const fonts = read("fonts.css");
const defined = definedVars(tokens + theme);
const roles = TYPE.map((row) => row.name);

describe("dist/tokens.css", () => {
  it("holds custom properties only, with no @font-face", () => {
    expect(tokens).not.toContain("@font-face");
  });

  it("publishes every design system token as --igd-* and every engine name as --ig-*", () => {
    const names = [...tokens.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((m) => m[1]);
    expect(names.filter((n) => !/^--(igd|ig)-/.test(n))).toEqual([]);
  });

  it("declares each spacing step and each spacing role", () => {
    for (const step of Object.keys(SPACE))
      expect(defined, step).toContain(`igd-space-${step}`);
    for (const [role, [, sizes]] of Object.entries(SPACE_ROLES))
      for (const size of sizes)
        expect(defined, `${role}-${size}`).toContain(
          `igd-space-${role}-${size}`,
        );
  });
});

describe("dist/theme.css", () => {
  it("declares a .igd-type-{role} class for each of the 15 type roles", () => {
    expect(roles).toHaveLength(15);
    for (const role of roles)
      expect(theme, role).toMatch(new RegExp(`\\.igd-type-${role}\\s*[{,]`));
  });

  it("declares the six properties of each type role", () => {
    for (const role of roles)
      for (const prop of [
        "font-family",
        "font-size",
        "font-weight",
        "line-height",
        "letter-spacing",
        "text-transform",
      ])
        expect(defined, `${role} ${prop}`).toContain(
          `igd-type-${role}-${prop}`,
        );
  });

  it("gives each type set a selector on data-igd-type", () => {
    for (const set of Object.keys(TYPE_SETS))
      expect(theme).toContain(`[data-igd-type="${set}"]`);
  });

  it("switches the dark theme with --igd-theme-dark and color-scheme", () => {
    const dark = theme.match(/\[data-theme="dark"\]\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(dark).toContain("--igd-theme-dark: 1");
    expect(dark).toContain("color-scheme: dark");
    expect(dark).toMatch(/--ig-gray-900:/);
    expect(dark).toMatch(/--ig-surface-base:/);
  });

  it("declares each dark step under the dark theme only, so a scope inherits the value of its theme", () => {
    const dark = theme.match(/\[data-theme="dark"\]\s*\{([^}]*)\}/)?.[1] ?? "";
    for (const name of Object.keys(DARK_STEP)) {
      expect(dark, name).toContain(`--igd-${name}:`);
      expect(theme.split(`--igd-${name}:`), name).toHaveLength(2);
    }
  });

  it("reads only custom properties that are declared", () => {
    expect(undefinedVars(theme, defined)).toEqual([]);
  });

  it("sets no element style: no rule for body, a heading or a link", () => {
    expect(theme).not.toMatch(/(^|[},\s])(body|h[1-6]|a)\s*[{,]/m);
  });
});

describe("dist/base.css", () => {
  it("reads only custom properties the two stylesheets declare", () => {
    expect(undefinedVars(base, defined)).toEqual([]);
  });

  it("reads no unprefixed name", () => {
    const read_ = [...base.matchAll(/var\(--([\w-]+)/g)].map((m) => m[1]);
    expect(read_.filter((n) => !/^(igd|ig)-/.test(n))).toEqual([]);
  });

  it("colours a link with color-action-text, which is safe as text in both themes", () => {
    expect(base).toMatch(
      /\ba\s*\{[^}]*color:\s*var\(--igd-color-action-text\)/,
    );
    expect(base).not.toMatch(
      /\ba\s*\{[^}]*color:\s*var\(--igd-color-action-default\)/,
    );
  });
});

describe("the token inventory", () => {
  const json = JSON.parse(read("tokens.json"));
  const listed: string[] = TOKEN_FAMILIES.flatMap((f) =>
    json[f].tokens.map((t: { name: string }) => t.name),
  );

  it("shows every semantic and component token of tokens.json in the showcase", () => {
    const showcase = fs.readFileSync("docs/showcase.html", "utf8");
    const shown = new Set(
      [...showcase.matchAll(/data-token="([^"]+)"/g)].map((m) => m[1]),
    );
    expect(listed.filter((n) => !n.startsWith("ig-") && !shown.has(n))).toEqual(
      [],
    );
  });

  it("lists every --igd-* property the stylesheets declare in llms-full.txt", () => {
    const full = fs.readFileSync("llms-full.txt", "utf8");
    const missing = [...defined].filter(
      (n) =>
        n.startsWith("igd-") &&
        !n.startsWith("igd-type-") &&
        !full.includes(`\`--${n}\``),
    );
    expect(missing).toEqual([]);
  });
});

describe("dist/fonts.css", () => {
  it("points every @font-face at a file that ships in dist/fonts", () => {
    const urls = [...fonts.matchAll(/url\('([^']+)'\)/g)].map((m) => m[1]);
    expect(urls).toHaveLength(3);
    for (const url of urls)
      expect(fs.existsSync(`dist/${url}`), url).toBe(true);
  });
});
