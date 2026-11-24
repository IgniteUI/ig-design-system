// Reads the facts of a logo from its SVG file.

export type Logo = {
  width: number;
  height: number;
  /** The fill colours of the file, upper case and six digits, in the order they first appear. */
  fills: string[];
  /** The width of the symbol: the widest rectangle of the file. Zero in a file with no rectangle. */
  symbol: number;
  /** Where the wordmark starts: the left edge of the first shape drawn right of the symbol. Zero in a file with none. */
  wordmark: number;
};

/** Reads the size and the fill colours of an SVG logo, or stops the build when the file has neither. */
export const readLogo = (svg: string, file: string): Logo => {
  const box =
    svg
      .match(/viewBox="([\d.\s-]+)"/)?.[1]
      .trim()
      .split(/\s+/) ?? [];
  const fills = [
    ...new Set(
      [...svg.matchAll(/fill="(#[0-9a-fA-F]{3,6})"/g)].map((m) => {
        const h = m[1].toUpperCase();
        return h.length === 4
          ? `#${[...h.slice(1)].map((c) => c + c).join("")}`
          : h;
      }),
    ),
  ];
  if (box.length !== 4 || !fills.length)
    throw new Error(
      `${file} needs a viewBox of four numbers and at least one hex fill. The logo page reads its proportions and colours from them.`,
    );
  const rects = [...svg.matchAll(/<rect\b[^>]*>/g)].map(([tag]) => ({
    x: Number(tag.match(/\bx="([\d.-]+)"/)?.[1] ?? 0),
    width: Number(tag.match(/\bwidth="([\d.]+)"/)?.[1] ?? 0),
  }));
  const square = rects.reduce(
    (widest, r) => (r.width > widest.width ? r : widest),
    { x: 0, width: 0 },
  );
  const edge = square.x + square.width;
  // A path starts at the point after its first M.
  const starts = [...svg.matchAll(/\bd="M\s*([\d.-]+)/g)]
    .map((m) => Number(m[1]))
    .filter((x) => x > edge);
  return {
    width: Number(box[2]),
    height: Number(box[3]),
    fills,
    symbol: square.width,
    wordmark: starts.length ? Math.min(...starts) : 0,
  };
};

/** A hex colour as "R, G, B". */
export const rgb = (hex: string) =>
  [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)).join(", ");
