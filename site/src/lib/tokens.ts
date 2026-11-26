// Sorts and looks up the tokens of tokens.json for the pages.
import type { Token } from "./design-system.ts";

/** The semantic colour groups, by the property word that follows `color-`, in the order the Tokens page lists them. */
export const COLOUR_GROUPS: [key: string, title: string][] = [
  ["foreground", "Foreground"],
  ["background", "Background"],
  ["border", "Border"],
  ["focus", "Focus"],
  ["accent", "Accent"],
];

/** How a colour is previewed: as text, as an outline, or as a fill. */
export type Preview = "fill" | "text" | "outline";
const TEXT_GROUPS = ["foreground"];
const OUTLINE_GROUPS = ["border", "focus"];

/** The preview a semantic colour group gets. */
export const previewOf = (group: string): Preview =>
  TEXT_GROUPS.includes(group)
    ? "text"
    : OUTLINE_GROUPS.includes(group)
      ? "outline"
      : "fill";

/** Sorts the colour tokens into the raw families, the semantic groups and the component tier. */
export const groupColours = (tokens: Token[]) => {
  const raw: Record<string, Token[]> = {};
  const semantic: Record<string, Token[]> = {};
  const component: Token[] = [];
  for (const t of tokens) {
    const family = t.name.match(/^ig-([a-z]+)-/)?.[1];
    if (family) {
      raw[family] ??= [];
      raw[family].push(t);
    } else if (t.name.startsWith("color-")) {
      const key = t.name.split("-")[1];
      const group = COLOUR_GROUPS.some(([k]) => k === key) ? key : "other";
      semantic[group] ??= [];
      semantic[group].push(t);
    } else component.push(t);
  }
  return { raw, semantic, component };
};

// Mirrors PALETTE_FAMILIES and SURFACE_ROLES in src/engine-colors.ts of the package.
export const PALETTE_FAMILIES = [
  "primary",
  "secondary",
  "gray",
  "surface",
  "info",
  "success",
  "warn",
  "error",
];
const SURFACE_ROLES = ["base", "sunken", "raised", "overlay"];

/** The numbered shades of a raw family, or its roles when tokens.json lists it by role, as it does the surface. */
export const rampOf = (family: Token[]) => {
  const shades = family.filter((t) => /-\d+$/.test(t.name));
  return shades.length
    ? shades
    : family.filter((t) =>
        SURFACE_ROLES.includes(t.name.split("-").pop() ?? ""),
      );
};

/** Whether a token is one the others are built from: a palette step, a raw spacing step or an engine elevation, plain or tinted. */
export const isEngine = (name: string) =>
  /^ig-/.test(name) ||
  /^space-\d?[a-z]+$/.test(name) ||
  /^elevation-(?:tint-)?\d+$/.test(name);

const REFERENCE = /^\{([\w-]+)\}$/;

/** The engine token a token's value leads to through its references, if it leads to one. */
export const engineOf = (token: Token, all: Token[]): string | undefined => {
  const seen = new Set<string>();
  let value = token.value;
  for (
    let name = value.match(REFERENCE)?.[1];
    name && !seen.has(name);
    name = value.match(REFERENCE)?.[1]
  ) {
    if (isEngine(name)) return name;
    seen.add(name);
    value = all.find((t) => t.name === name)?.value ?? "";
  }
  return undefined;
};

/** The tokens that lead to each engine token, by its name. */
export const readersOf = (all: Token[]) => {
  const readers: Record<string, Token[]> = {};
  for (const t of all) {
    if (isEngine(t.name)) continue;
    const engine = engineOf(t, all);
    if (!engine) continue;
    readers[engine] ??= [];
    readers[engine].push(t);
  }
  return readers;
};

/** Finds tokens by name, in the order named, or stops the build with the name that is missing. */
export const pick = (tokens: Token[], names: string[], where: string) =>
  names.map((n) => {
    const t = tokens.find((x) => x.name === n);
    if (!t)
      throw new Error(
        `The site shows "${n}", which is not a ${where} token in tokens.json. Rename it in site/src/data or remove it from the list.`,
      );
    return t;
  });
