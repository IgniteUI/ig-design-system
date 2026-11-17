// Converts colours between hex, sRGB channels and OKLCH.

/** The red, green and blue channels, 0 to 255, of a `#rrggbb` colour. */
export const hexToRgb = (hex: string) =>
  [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

/** The two hex digits of a channel from 0 to 255. */
export const hexByte = (channel: number) =>
  Math.round(channel).toString(16).padStart(2, "0");

/** The `#rrggbb` colour of red, green and blue channels from 0 to 255. */
export const rgbToHex = (channels: number[]) =>
  `#${channels.map(hexByte).join("")}`;

/** The linear-light value of an sRGB channel from 0 to 255. Mirrors lum() in checks/gates-themes.ts. */
export const srgbToLinear = (channel: number) => {
  const x = channel / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
};

/** The OKLCH lightness, chroma and hue, in degrees, of a `#rrggbb` colour. */
export const hexToOklch = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  // The OKLab matrices: linear sRGB to cone response, then its cube root to lightness and the two opponent axes.
  const long = Math.cbrt(
    0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
  );
  const medium = Math.cbrt(
    0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
  );
  const short = Math.cbrt(
    0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b,
  );
  const greenRed =
    1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short;
  const blueYellow =
    0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short;
  return {
    l: 0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
    c: Math.hypot(greenRed, blueYellow),
    h: ((Math.atan2(blueYellow, greenRed) * 180) / Math.PI + 360) % 360,
  };
};
