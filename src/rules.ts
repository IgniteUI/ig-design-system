// The rules for code that uses the tokens, each in plain words with a pair of examples. The site and llms.txt print them.
import type { CheckId } from "../checks/rules.ts";

/**
 * A rule: what to do in plain words, why, and what to write and not to write. Backticks in `why` become code.
 * `check` names the rule of the check command that reports `bad`; a rule without one is not checked.
 */
export const RULES: readonly {
  title: string;
  why: string;
  good: string;
  bad: string;
  check?: CheckId;
}[] = [
  {
    title: "Choose a colour by its job.",
    why: "Text, a background, a line and a button each have their own colours. A palette step such as `--ig-gray-600` is raw material: it names a shade, not a job, so it is wrong as soon as the design changes.",
    good: "color: var(--igd-color-foreground-faint);",
    bad: "color: var(--ig-gray-600);",
    check: "raw-palette",
  },
  {
    title: "Say what a space is.",
    why: "Padding, a vertical margin and a gap or an inline margin each have their own sizes. Naming the kind of space lets padding and gaps be tuned apart later.",
    good: "padding: var(--igd-space-inset-md);",
    bad: "padding: var(--igd-space-md);",
    check: "spacing-role",
  },
  {
    title: "Never type a colour.",
    why: "Not even one that looks right. When no colour fits, say which one is missing.",
    good: "color: var(--igd-color-foreground-action);",
    bad: "color: #1a5fff;",
    check: "colour-literal",
  },
  {
    title: "Use one name for both variants of the theme.",
    why: "A colour already has a light and a dark value and switches by itself. Do not write the light and the dark variant by hand.",
    good: "background: var(--igd-color-background-card);",
    bad: "background: light-dark(#fff, #1c1c1c);",
    check: "colour-literal",
  },
  {
    title: "Resize with a dial, never inside a component.",
    why: "A dial on the page or on one region makes everything in it denser, rounder or flatter at once. A component never changes a size step itself.",
    good: '<section style="--ig-spacing: 0.5">',
    bad: ".card { --igd-space-md: 8px; }",
  },
  {
    title: "Widths and heights are yours to type.",
    why: "They belong to the layout, not to the design system. Do not borrow a spacing step for a size.",
    good: "max-width: 24rem;",
    bad: "max-width: var(--igd-space-6xl);",
  },
];
