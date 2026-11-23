// Reads the facts of a logo from its SVG file.

export type Logo = {
  width: number;
  height: number;
  /** The fill colours of the file, upper case and six digits, in the order they first appear. */
  fills: string[];
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
  return { width: Number(box[2]), height: Number(box[3]), fills };
};

/** A hex colour as "R, G, B". */
export const rgb = (hex: string) =>
  [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)).join(", ");
