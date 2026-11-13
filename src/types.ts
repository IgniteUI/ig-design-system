// The shape of dist/tokens.json, written by make.ts and read by dtcg.ts.
import type { FamilyName } from "./spec.ts";

export type Token = { name: string; value: string; usage: string };
export type TokenFamily = { note?: string; tokens: Token[] };
export type Font = { family: string; file: string; weight: string; style: string };
export type TypeStyle = { name: string; fontSize: string; lineHeight: string; fontWeight: number; usage: string; sample: string; letterSpacing?: string; family?: FamilyName };
export type TypeGroup = { name: string; family: FamilyName; styles: TypeStyle[] };
export type Tokens = {
  name: string;
  version: number;
  color: { themes: { id: string; name: string }[]; tokens: Token[] };
  type: { fonts: Font[]; families: Record<FamilyName, string>; groups: TypeGroup[] };
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
