// What the logo page shows: the files, the surfaces a logo sits on and the usage pictures.

import logoFile from "@/assets/logos/ig-logo.svg";
import logoSource from "@/assets/logos/ig-logo.svg?raw";
import darkFile from "@/assets/logos/ig-logo-dark.svg";
import darkSource from "@/assets/logos/ig-logo-dark.svg?raw";
import markFile from "@/assets/logos/ig-logomark.svg";
import { readLogo } from "@/lib/logo.ts";

/** The logo files, where each one is used, and the theme of the surface it sits on. */
export const LOGOS = {
  logo: {
    file: "ig-logo.svg",
    image: logoFile,
    title: "Logo",
    alt: "Infragistics",
    use: "The default. On white and on every light surface.",
    theme: "light",
  },
  dark: {
    file: "ig-logo-dark.svg",
    image: darkFile,
    title: "Logo for dark surfaces",
    alt: "Infragistics",
    use: "The same drawing with a lighter wordmark. On the dark theme and on a dark area.",
    theme: "dark",
  },
  mark: {
    file: "ig-logomark.svg",
    image: markFile,
    title: "Logomark",
    alt: "Infragistics symbol",
    use: "The symbol alone, where the name is already said or the space is square: a favicon, an avatar, an app icon.",
    theme: "light",
  },
} as const;
export type LogoKey = keyof typeof LOGOS;

const logo = readLogo(logoSource, LOGOS.logo.file);
const dark = readLogo(darkSource, LOGOS.dark.file);
const [wordmark, blue, white] = logo.fills;

/** The proportion of the logo: its width over its height. */
export const PROPORTION = Math.round((logo.width / logo.height) * 100) / 100;

/** The colours of the logo, read from the files. */
export const LOGO_COLOURS = {
  blue,
  white,
  wordmark,
  darkWordmark: dark.fills[0],
};

/** The surfaces the page shows a logo on: the token, and the theme whose logo sits on it. */
export const SURFACES: [token: string, theme: "light" | "dark"][] = [
  ["color-surface-page", "light"],
  ["color-surface-subtle", "light"],
  ["color-surface-card", "light"],
  ["color-surface-tint", "light"],
  ["color-surface-page", "dark"],
  ["color-surface-subtle", "dark"],
  ["color-surface-card", "dark"],
  ["color-surface-inverse", "dark"],
];

/** The lowest contrast the wordmark may have against its surface: the WCAG 1.4.11 minimum for a graphic. */
export const MIN_CONTRAST = 3;

/** The smallest height of the logo and of the logomark, in pixels. A proposal until the brand owner approves it. */
export const SMALLEST = { logo: 16, mark: 16 };

/** The usage pictures: the treatment the picture applies, whether it is right, and the rule. */
export const USAGES: { treatment: string; ok: boolean; rule: string }[] = [
  {
    treatment: "plain",
    ok: true,
    rule: "Use the file, at any size from the smallest up.",
  },
  {
    treatment: "on-dark",
    ok: true,
    rule: "Use the logo for dark surfaces on a dark surface.",
  },
  {
    treatment: "lockup",
    ok: true,
    rule: "Add a name beside the logo with a thin rule between them, in the heading typeface.",
  },
  { treatment: "stretch", ok: false, rule: "Do not stretch or squeeze it." },
  { treatment: "recolour", ok: false, rule: "Do not change its colours." },
  { treatment: "rotate", ok: false, rule: "Do not rotate or tilt it." },
  {
    treatment: "effect",
    ok: false,
    rule: "Do not add a shadow, a glow or an outline.",
  },
  {
    treatment: "wrong-dark",
    ok: false,
    rule: "Do not put the default logo on a dark surface.",
  },
  {
    treatment: "busy",
    ok: false,
    rule: "Do not put it on a gradient, a photo or a pattern.",
  },
  {
    treatment: "crowd",
    ok: false,
    rule: "Do not let text or another logo into its clear space.",
  },
  {
    treatment: "retype",
    ok: false,
    rule: "Do not type the name in a font next to the symbol.",
  },
  { treatment: "crop", ok: false, rule: "Do not crop it or cut the wordmark." },
];
