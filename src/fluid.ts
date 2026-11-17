// A fluid length: it grows in a straight line with the width of its container, between a minimum and a maximum.
import { round4 } from "./units.ts";

/**
 * Builds the `calc()` of a length that is `minPx` in a container `fromPx` wide and `maxPx` in one `toPx` wide.
 * The width is read in `cqi`, which is the viewport width when the element has no query container.
 */
export const fluidCalc = (
  minPx: number,
  maxPx: number,
  fromPx: number,
  toPx: number,
) => {
  const slope = (maxPx - minPx) / (toPx - fromPx);
  const base = minPx - slope * fromPx;
  const sign = base < 0 ? "-" : "+";
  return `calc(${round4(slope * 100)}cqi ${sign} ${round4(Math.abs(base) / 16)}rem)`;
};

/** Builds the `clamp()` for a size that is `minPx` in a container `fromPx` wide and `maxPx` in one `toPx` wide. */
export const fluid = (
  minPx: number,
  maxPx: number,
  fromPx: number,
  toPx: number,
) => {
  if (!(minPx < maxPx))
    throw new Error(
      `fluid(): the minimum ${minPx}px must be below the maximum ${maxPx}px.`,
    );
  if (!(fromPx < toPx))
    throw new Error(
      `fluid(): the width range must grow, got ${fromPx}px to ${toPx}px.`,
    );
  return `clamp(${round4(minPx / 16)}rem, ${fluidCalc(minPx, maxPx, fromPx, toPx)}, ${round4(maxPx / 16)}rem)`;
};
