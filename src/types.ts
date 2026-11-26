// The shape of dist/tokens.json.
import type { FamilyName } from "./spec.ts";

/** The token families of tokens.json, in reading order. */
export const TOKEN_FAMILIES = [
  "color",
  "spacing",
  "radius",
  "size",
  "shadow",
  "opacity",
  "weight",
  "gradient",
  "breakpoint",
  "zIndex",
] as const;
export type TokenFamilyName = (typeof TOKEN_FAMILIES)[number];

/** Where a colour comes from: a published engine step, a step of a palette the package does not publish, another token, another token at an opacity, or the engine's adaptive contrast on a fill. */
export type Source =
  | { kind: "step"; step: string }
  | { kind: "palette"; palette: string; step: string }
  | { kind: "token"; token: string }
  | { kind: "opacity"; token: string; percent: number }
  | { kind: "contrast"; on: string };
export type Token = {
  name: string;
  value: string;
  usage: string;
  /** Where a colour comes from. */
  source?: Source;
  /** The token a state colour follows in the browser, through a formula in theme.css. */
  follows?: string;
};
export type TokenFamily = { note?: string; tokens: Token[] };
export type Font = {
  family: string;
  file: string;
  weight: string;
  style: string;
};
export type TypeStyle = {
  name: string;
  fontSize: string;
  fontSizeMin?: string;
  lineHeight: string;
  fontWeight: number;
  usage: string;
  sample: string;
  letterSpacing?: string;
  family?: FamilyName;
};
export type TypeSetStyle = {
  name: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
  textTransform?: string;
};
export type TypeGroup = {
  name: string;
  family: FamilyName;
  styles: TypeStyle[];
};
export type Tokens = {
  name: string;
  version: number;
  color: { themes: { id: string; name: string }[]; tokens: Token[] };
  type: {
    fonts: Font[];
    families: Record<FamilyName, string>;
    fluid: { from: number; to: number };
    sets: Record<string, TypeSetStyle[]>;
    groups: TypeGroup[];
  };
  spacing: TokenFamily;
  radius: TokenFamily;
  size: TokenFamily;
  shadow: TokenFamily;
  opacity: TokenFamily;
  weight: TokenFamily;
  gradient: TokenFamily;
  breakpoint: TokenFamily;
  zIndex: TokenFamily;
};
