// The do and don't pairs of the guide. The bad examples are wrong on purpose, so the site command skips this file.

/** A rule as a pair of examples: what to write, what not to, and why. Backticks in `why` become code. */
export const RULES: { good: string; bad: string; why: string }[] = [
  {
    good: "color: var(--igd-color-text-muted);",
    bad: "color: var(--ig-gray-600);",
    why: "Read a colour by its job. A palette step such as `--ig-gray-600` is raw material for the design system and has no dark value of its own.",
  },
  {
    good: "padding: var(--igd-space-inset-md);",
    bad: "padding: var(--igd-space-md);",
    why: "Use a spacing role, not the raw step. The role says what the space is, so padding and gaps can be tuned apart later.",
  },
  {
    good: "color: var(--igd-color-action-text);",
    bad: "color: #1a5fff;",
    why: "Do not type a colour, even one that looks right. When no token fits, say which one is missing.",
  },
  {
    good: "background: var(--igd-color-surface-card);",
    bad: "background: light-dark(#fff, #1c1c1c);",
    why: "A token already has a value per theme. Do not write the two themes by hand.",
  },
  {
    good: '<section style="--ig-spacing: 0.5">',
    bad: ".card { --igd-space-md: 8px; }",
    why: "Change a dial on the page or on a region. Never set a spacing, size or radius step inside a component.",
  },
  {
    good: "max-width: 24rem;",
    bad: "max-width: var(--igd-space-6xl);",
    why: "Widths, heights and offsets are not tokens. Type them; do not borrow a spacing step for a size.",
  },
];
