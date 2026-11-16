// The seed colours and scales of every palette. A brand colour change starts here.
import fs from "node:fs";

const scales: Record<string, { range: number[]; curve: number[] }> = JSON.parse(
  fs.readFileSync("src/scales.json", "utf8"),
);
const sc = Object.entries(scales)
  .map(
    ([k, v]) =>
      `'${k}': (range: (${v.range.join(", ")}), curve: (${v.curve.join(", ")}))`,
  )
  .join(", ");
const seeds =
  "$primary: #155dfc, $secondary: #9810fa, $info: #0099ff, $success: #028a54, $warn: #f59e0b";
/** The engine palette() call of each palette the design system builds. */
export const sets = {
  light: `palette(${seeds}, $surface: #ffffff, $gray: #64748b, $scales: (${sc}))`,
  dark: `palette(${seeds}, $surface: #0f172a, $gray: #cbd5e1)`,
  pink: "palette($primary: #ec4899, $secondary: #9810fa, $surface: #ffffff)",
  cyan: "palette($primary: #06b6d4, $secondary: #9810fa, $surface: #ffffff)",
  sky: "palette($primary: #38bdf8, $secondary: #9810fa, $surface: #ffffff)",
  teal: "palette($primary: #2dd4bf, $secondary: #9810fa, $surface: #ffffff)",
};
