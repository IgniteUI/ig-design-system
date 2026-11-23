// The rules of the design system: each in plain words, with a pair of examples. The bad examples are wrong on purpose, so the site command skips this file.

/** A rule: what to do in plain words, why, and what to write and not to write. Backticks in `why` become code. */
export const RULES: {
  title: string;
  why: string;
  good: string;
  bad: string;
}[] = [
  {
    title: "Choose a colour by its job.",
    why: "Text, a background, a line and a button each have their own colours. A palette step such as `--ig-gray-600` is raw material for the design system and has no dark value of its own.",
    good: "color: var(--igd-color-text-muted);",
    bad: "color: var(--ig-gray-600);",
  },
  {
    title: "Say what a space is.",
    why: "Padding, a vertical margin and a gap each have their own sizes. Naming the kind of space lets padding and gaps be tuned apart later.",
    good: "padding: var(--igd-space-inset-md);",
    bad: "padding: var(--igd-space-md);",
  },
  {
    title: "Never type a colour.",
    why: "Not even one that looks right. When no colour fits, say which one is missing.",
    good: "color: var(--igd-color-action-text);",
    bad: "color: #1a5fff;",
  },
  {
    title: "Use one name for both themes.",
    why: "A colour already has a light and a dark value and switches by itself. Do not write the two themes by hand.",
    good: "background: var(--igd-color-surface-card);",
    bad: "background: light-dark(#fff, #1c1c1c);",
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

/** The id of the element that shows a rule in detail, from its place in RULES. */
export const ruleId = (index: number) => `rule-${index + 1}`;
