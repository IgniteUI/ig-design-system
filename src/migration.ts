// Writes docs/MIGRATION.md from the old-to-new tables in rename-map.ts.
// Usage: node src/migration.ts <out.md>
import fs from "node:fs";
import * as M from "./rename-map.ts";
import { ENGINE_TYPE_SLOTS, SPACE, TYPE } from "./spec.ts";

const OUT = process.argv[2];
const tbl = (rows: string[][], a: string, b: string) =>
  `| ${a} | ${b} |\n|---|---|\n` +
  rows.map(([x, y]) => `| \`--${x}\` | \`--igd-${y}\` |`).join("\n") +
  "\n";
const groups: [string, string[][]][] = [
  ["Colour", Object.entries(M.COLOR)],
  [
    "Size, radius, border, typography, motion and everything else",
    [...Object.entries(M.SIZEMAP), ...Object.entries(M.OTHER)],
  ],
];
const NAME: Record<number, string> = Object.fromEntries(
  Object.entries(SPACE).map(([k, v]) => [v, k]),
);
const sp = Object.entries(M.SPACEMAP).map(([o, n]) => [
  `space-${o}`,
  `space-${NAME[n]}`,
]);
let md = `# Migration guide

Old token names from the first design system prototype and their replacements. A site that never used the prototype does not need this page; see \`docs/ADOPTING.md\`. Nothing from the old names is kept: no aliases, no deprecated files.

## 1. Naming convention

Three tiers, role-based names, no colour words in semantic names (the three \`window-dot-*\` tokens are the exception).

1. **Raw** (\`--ig-*\`): engine steps, for example \`--ig-primary-600\`, \`--ig-gray-200\`. Only the semantic tier points at them.
2. **Semantic** (\`--igd-color-*\`, \`--igd-space-*\`, \`--igd-radius-*\`, \`--igd-size-*\`, \`--igd-shadow-*\`, \`--igd-font-weight-*\`, \`--igd-opacity-*\`, \`--igd-z-index-*\`, \`--igd-breakpoint-*\`): what a value is for. Use these in product code.
3. **Component** (\`--igd-footer-*\`, \`--igd-table-*\`, \`--igd-fw-*\`, \`--igd-badge-*\`, \`--igd-tile-*\`, \`--igd-callout-*\`): a decision made for one component, defined from the semantic tier.

Colour roles read \`color-{role}-{variant}-{state}\`: \`color-action-default\`, \`color-action-hover\`, \`color-text-muted\`, \`color-surface-tint\`, \`color-border-control\`, \`color-feedback-error-default\`.

## 2. Spacing scale

The 25-step scale collapsed to 12 engine steps, and the steps are now named by size (\`3xs\` to \`6xl\`), not by pixel value, because the live value follows \`--ig-spacing\` and \`--ig-size\`. Steps that sat one or two pixels apart merged into their nearest neighbour. Components do not use the steps directly for padding, margins and gaps: they use the roles \`--igd-space-inset-*\`, \`--igd-space-stack-*\` and \`--igd-space-gap-*\`.

${tbl(sp, "Before", "Now")}
In a component, pick the role for the property: padding → \`--igd-space-inset-{size}\`, vertical margins → \`--igd-space-stack-{size}\`, gap and inline margins → \`--igd-space-gap-{size}\`.

## 3. Token renames

`;
for (const [t, rows] of groups)
  md += `### ${t}\n\n${tbl(rows, "Before", "Now")}\n`;
md += `### Type styles\n\nA type style is named for its role. The class is \`.igd-type-{role}\` and its variables are \`--igd-type-{role}-{font-family|font-size|font-weight|line-height|letter-spacing|text-transform}\`. Line height is a unitless multiple of the font size.\n\n| Before | Now | Engine slot |\n|---|---|---|\n${TYPE.map(({ slot, name, was }) => `| \`${was}\` | \`.igd-type-${name}\` | ${ENGINE_TYPE_SLOTS.includes(slot) ? `\`${slot}\`` : "none"} |`).join("\n")}
`;
fs.writeFileSync(OUT, md);
console.log("migration", md.length);
