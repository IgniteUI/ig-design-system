// Formats numbers and lengths for CSS.

/** A number with four decimals at most and no trailing zeros. */
export const round4 = (n: number) => (+n.toFixed(4)).toString();

/** A pixel length in rem, at 16px to the rem. */
export const rem = (px: number) => `${round4(px / 16)}rem`;
