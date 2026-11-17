// The rules a site that uses the design system is checked against. Each takes the text of one file and returns its findings.
import { rawSteps } from "./spacing-roles.ts";

export type Finding = { line: number; rule: string; message: string };

// The palette families of the engine. Mirrored by the families palette() is called with in src/palette-sets.ts.
const FAMILIES = "primary|secondary|gray|surface|info|success|warn|error";
const STEP = `(?:${FAMILIES})-(?:[0-9A]\\d{1,3}|seed|base|sunken|raised|overlay)(?:-contrast|-raw)?`;

const lineOf = (text: string, index: number) =>
  text.slice(0, index).split("\n").length;

// Line and block comments are blanked, so a rule never reports commented-out code and line numbers stay the same.
const withoutComments = (text: string) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "))
    .replace(
      /(^|[^:"'])\/\/[^\n]*/g,
      (c, lead: string) => lead + " ".repeat(c.length - lead.length),
    );

/** Names of the custom properties a text declares, with the leading `--`. */
export const declaredNames = (text: string) =>
  new Set(
    [...withoutComments(text).matchAll(/(?<![\w-])(--[\w-]+)\s*:/g)].map(
      (m) => m[1],
    ),
  );

/** A `var(--igd-*)` that neither the design system nor the site declares. A var() with a fallback is a hook a page may set, and is skipped. */
export const unknownTokens = (text: string, known: Set<string>): Finding[] =>
  [...withoutComments(text).matchAll(/var\(\s*(--igd-[\w-]+)\s*(?=\))/g)]
    .filter((m) => !known.has(m[1]) && !m[1].endsWith("-"))
    .map((m) => ({
      line: lineOf(text, m.index),
      rule: "unknown-token",
      message: `${m[1]} is not a design system token and this site does not declare it. Check the name against tokens.json.`,
    }));

/** A raw palette step read by site code. */
export const rawPaletteReads = (text: string): Finding[] =>
  [
    ...withoutComments(text).matchAll(
      new RegExp(`var\\(\\s*(--ig-${STEP})(?![\\w-])`, "g"),
    ),
  ].map((m) => ({
    line: lineOf(text, m.index),
    rule: "raw-palette",
    message: `${m[1]} is a raw palette step. Read a semantic token, such as --igd-color-text-primary or --igd-color-border-default.`,
  }));

/** A palette step declared by site code, which replaces the design system's colour for every token built on it. */
export const paletteOverrides = (text: string): Finding[] =>
  [
    ...withoutComments(text).matchAll(
      new RegExp(`(?<![\\w-])(--ig-${STEP})\\s*:`, "g"),
    ),
  ].map((m) => ({
    line: lineOf(text, m.index),
    rule: "palette-override",
    message: `${m[1]} is declared here. The palette belongs to the design system; change a seed there, or override a semantic token on a scope.`,
  }));

/** A raw spacing step used for padding, a margin or a gap. */
export const spacingRoles = (text: string): Finding[] => {
  const clean = withoutComments(text);
  const found: Finding[] = [];
  let from = 0;
  for (const s of rawSteps(clean)) {
    const index = clean.indexOf(s.value, from);
    from = index + s.value.length;
    found.push({
      line: lineOf(text, index),
      rule: "spacing-role",
      message: `${s.prop} uses ${s.value}; use ${s.fix}.`,
    });
  }
  return found;
};

/** A colour typed in by hand, as the value of a property. Reported only in strict mode. */
export const colourLiterals = (text: string): Finding[] => {
  const clean = withoutComments(text);
  return [
    ...clean.matchAll(
      /(?<![\w&-])#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g,
    ),
  ]
    .filter((m) => {
      const lineStart = clean.lastIndexOf("\n", m.index) + 1;
      const before = clean.slice(lineStart, m.index);
      const after = clean.slice(m.index + m[0].length).split("\n")[0];
      // An id selector opens a block, and a fragment link has no property before it.
      return before.includes(":") && !/^[\w-]*\s*\{/.test(after);
    })
    .map((m) => ({
      line: lineOf(text, m.index),
      rule: "colour-literal",
      message: `${m[0]} is typed in. Use a colour token.`,
    }));
};

/** Every finding in one file. `known` holds the names the design system and the site declare. */
export const checkText = (
  text: string,
  known: Set<string>,
  strict = false,
): Finding[] =>
  [
    ...unknownTokens(text, known),
    ...rawPaletteReads(text),
    ...paletteOverrides(text),
    ...spacingRoles(text),
    ...(strict ? colourLiterals(text) : []),
  ].sort((a, b) => a.line - b.line);
