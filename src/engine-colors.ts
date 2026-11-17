// Looks up the colour of an engine palette step, or of a token that aliases one, in src/palettes.json.
import fs from "node:fs";
import { fromRoot } from "./paths.ts";
import { ALIAS } from "./spec.ts";

type Palette = Record<string, string>;
const PALETTES: Record<string, Palette> = JSON.parse(
  fs.readFileSync(fromRoot("src/palettes.json"), "utf8"),
);
export const LIGHT_PALETTE = PALETTES.light;
export const DARK_PALETTE = PALETTES.dark;

/** The palette families of the engine. Mirrored by FAMILIES in checks/site.ts. */
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
/** The families tokens.json lists shade by shade, in the order it lists them. */
export const SHADE_FAMILIES = [
  "primary",
  "secondary",
  "info",
  "success",
  "warn",
  "error",
  "gray",
];
/** The families the engine emits a seed variable for. */
export const SEED_FAMILIES = ["primary", "secondary", "info"];
export const SURFACE_ROLES = ["base", "sunken", "raised", "overlay"];

// A step of an accent palette, such as ig-pink-400.
const ACCENT_STEP = /^ig-(pink|cyan|sky|teal)-(\d+)$/;
// A numbered step of the dark palette's gray or surface ramp, such as ig-dark-gray-500.
const DARK_STEP = /^ig-dark-(gray|surface)-(\d+)$/;
// A surface role of the dark palette, such as ig-dark-surface-raised.
const DARK_ROLE = /^ig-dark-surface-(sunken|raised|overlay|base)$/;
// A shade, seed or surface role of the light palette, such as ig-primary-A100 or ig-surface-base.
const LIGHT_STEP = /^ig-([a-z]+-(?:A?\d+|seed|base|sunken|raised|overlay))$/;

/** The hex colour of an engine step, or null when `name` is not one. */
export const engineHex = (name: string): string | null => {
  let m = name.match(DARK_STEP);
  if (m) return PALETTES.dark[`${m[1]}-${m[2]}`];
  m = name.match(DARK_ROLE);
  if (m) return PALETTES.dark[`surface-${m[1]}`];
  m = name.match(ACCENT_STEP);
  if (m) return PALETTES[m[1]][`primary-${m[2]}`];
  m = name.match(LIGHT_STEP);
  if (m) return PALETTES.light[m[1]];
  return null;
};

/** The hex colour a token or engine step resolves to. `published` holds the values the build computes in place of an alias. */
export const hexOf = (
  name: string,
  published: Record<string, string> = {},
): string => {
  if (published[name]) return published[name];
  const alias = ALIAS[name];
  if (alias) return hexOf(alias[0], published);
  const hex = engineHex(name);
  if (!hex) throw new Error(`unknown colour ${name}`);
  return hex;
};

export const isAccentStep = (step: string) => ACCENT_STEP.test(step);

/** True for a step of an accent palette or of the dark palette: the token that uses it carries the colour itself. */
export const isUnpublishedStep = (step: string) =>
  ACCENT_STEP.test(step) || DARK_STEP.test(step);

/** The sentence a token note gets when its step is not published, or an empty string. */
export const unpublishedStepNote = (step: string) => {
  if (ACCENT_STEP.test(step))
    return ` Engine step ${step.replace(ACCENT_STEP, "$2 of the $1 palette")}.`;
  if (DARK_STEP.test(step))
    return ` Engine step ${step.replace(DARK_STEP, "$2 of the dark palette's $1 ramp")}.`;
  return "";
};
