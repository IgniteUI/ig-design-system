// The vocabulary of the design system: the engine step each semantic token aliases, and the spacing, size, radius, shadow and type scales.

// ---- semantic colour tokens: name -> engine token (alias) ---------------------------------------
// Each entry: [engineToken, usage]. make.ts appends the measured contrast ratios to the usage.
export type AliasEntry = [engineToken: string, usage: string];
export const ALIAS: Record<string, AliasEntry> = {
  // brand + action
  "color-accent-brand": [
    "ig-info-seed",
    "Brand accent: gradient start, icon tile fill, glow source. Not a CTA fill and never text on white.",
  ],
  "color-accent-brand-hover": ["ig-info-400", "`color-accent-brand` on hover."],
  "color-accent-brand-active": [
    "ig-info-500",
    "`color-accent-brand` while pressed.",
  ],
  "color-accent-ai": [
    "ig-secondary-seed",
    "Gradient partner to `color-accent-brand` and the AI marker. Never a fill on its own.",
  ],
  "color-accent-inverse-1": [
    "ig-sky-200",
    "The first accent for a dark area: stat numbers. Never on a light surface.",
  ],
  "color-accent-inverse-2": [
    "ig-teal-200",
    "The second accent for a dark area, beside `color-accent-inverse-1`: a second set of stat numbers. Never on a light surface.",
  ],
  "color-background-action": [
    "ig-primary-seed",
    "The fill of the main button and of every filled action. It is the primary seed itself, not a fitted shade. Its label is `color-foreground-on-action`. Text in the action colour is `color-foreground-action`.",
  ],
  "color-foreground-link-hover": [
    "ig-primary-700",
    "A link on hover, on a light surface. The colour changes; no underline appears.",
  ],
  "color-foreground-link-active": [
    "ig-primary-800",
    "A link while pressed, on a light surface.",
  ],
  "color-background-action-hover": [
    "ig-primary-700",
    "The main button's fill on hover; nothing else about the button changes. A step `color-foreground-on-action` reads on: darker under a white label, primary step 400 under a black one.",
  ],
  "color-foreground-action": [
    "ig-primary-600",
    "Text, an icon or a thin line in the action colour on a light surface: links, eyebrows, outline and ghost button labels, focus outlines. An engine step, which the engine solves to the same contrast for any seed.",
  ],
  "color-foreground-link": [
    "ig-primary-600",
    "A link in text, on a light surface. The same steps as `color-foreground-action`, named for the link so a link reads it.",
  ],
  "color-foreground-on-action": [
    "ig-surface-base",
    "The label and icon on a `color-background-action` fill: black or white, whichever reads on it.",
  ],
  "color-foreground-link-inverse": [
    "ig-sky-200",
    "Inline links on dark surfaces (`color-background-inverse`).",
  ],
  "color-foreground-link-inverse-hover": [
    "ig-sky-100",
    "Hover of `color-foreground-link-inverse`: colour shift only.",
  ],
  "footer-link-foreground": [
    "ig-dark-gray-600",
    "Footer column links on the footer gradient.",
  ],
  "color-focus-ring": [
    "color-foreground-action",
    "The keyboard focus ring on a light surface: `focus-ring-width` at `focus-ring-offset`, `:focus-visible` only.",
  ],
  "color-focus-ring-inverse": [
    "ig-sky-100",
    "The keyboard focus ring in an area that stays dark, such as the footer. `base.css` uses it inside an element with `data-on-dark`.",
  ],
  // text
  "color-foreground-heading": ["ig-gray-900", "Headings, h1 to h6."],
  "color-foreground-default": [
    "ig-gray-800",
    "Body text: the default colour of the page's text, and the labels of secondary buttons.",
  ],
  "color-foreground-subtle": [
    "ig-gray-600",
    "Supporting text: the paragraph under a heading, the text of the utility bar, nav triggers at rest.",
  ],
  "color-foreground-control": [
    "ig-gray-700",
    "Text in controls: the nav, buttons, list rows, chips.",
  ],
  "color-foreground-faint": [
    "ig-gray-500",
    "Captions and small labels: card descriptions, counts. No body text is lighter than this.",
  ],
  "color-foreground-inverse": [
    "ig-dark-gray-900",
    "Text and icons on a dark area.",
  ],
  "color-foreground-inverse-faint": [
    "ig-dark-gray-400",
    "Captions and small labels on a dark area.",
  ],
  "color-foreground-decorative": [
    "ig-gray-400",
    "A decorative mark that carries no meaning, such as the caret in the nav row. It is lighter than 3:1 on purpose, so it never holds information.",
  ],
  "color-foreground-error": [
    "ig-error-500",
    "Validation text and border on light surfaces.",
  ],
  "color-foreground-info": [
    "ig-primary-700",
    "Informational text and icons on light surfaces: a note, a tip.",
  ],
  "color-foreground-warning-inverse": [
    "ig-warn-200",
    "Warning text and icons on dark surfaces.",
  ],
  "color-foreground-info-inverse": [
    "ig-primary-300",
    "Informational text and icons on dark surfaces.",
  ],
  "color-foreground-success-inverse": [
    "ig-success-300",
    "Success icons on dark surfaces, such as a code block.",
  ],
  "color-foreground-success": [
    "ig-success-600",
    "Success text and icons on light surfaces: a confirmed state, a check mark.",
  ],
  "color-foreground-warning": [
    "ig-warn-500",
    "Warning text and icons on light surfaces.",
  ],
  "color-foreground-error-inverse": [
    "ig-error-300",
    "Validation text and border on the dark footer.",
  ],
  // surfaces
  "color-background-page": ["ig-surface-base", "The page's background."],
  "color-background-subtle": [
    "ig-surface-sunken",
    "A quiet fill set apart from the page: a section band, a title bar, a chip or a Coming soon pill at rest, and the colour the wash behind the first section of a page starts from (`gradient-hero`).",
  ],
  "color-background-card": ["ig-surface-raised", "The fill of a card."],
  "color-background-tint": [
    "ig-primary-50",
    "Soft blue fill: tinted chips, callouts, the catalog band, release strip at rest and monogram badges.",
  ],
  "color-background-inverse-raised": [
    "ig-dark-surface-200",
    "The lightest dark surface: where a dark area lifts towards the light, such as the start of the footer gradient.",
  ],
  "color-background-inverse-sunken": [
    "ig-dark-surface-900",
    "The darkest dark surface: the deepest part of a dark area, such as the end of the footer gradient.",
  ],
  "color-background-inverse": [
    "ig-dark-surface-500",
    "The dark area of a light page: a dark band, a table header, a stat panel.",
  ],
  "color-background-tint-strong": [
    "ig-primary-100",
    "A stronger `color-background-tint`: the release strip on hover, the open nav trigger.",
  ],
  // footer
  "footer-background": [
    "color-background-inverse-sunken",
    "Footer gradient end; flat fallback for `footer-background-gradient`.",
  ],
  "footer-foreground": [
    "ig-dark-gray-500",
    "Footer body copy, legal links and social glyphs.",
  ],
  "footer-foreground-strong": [
    "ig-dark-gray-800",
    "Footer sub-group labels (Web, Desktop, Bundles) and legal-link emphasis.",
  ],
  "footer-foreground-faint": [
    "ig-dark-gray-400",
    "Footer 12px uppercase group labels, placeholder and copyright.",
  ],
  "footer-focus-ring": ["ig-sky-100", "Keyboard focus ring inside the footer."],
  // borders
  "color-border-default": [
    "ig-gray-200",
    "Hairline border on cards, chips and tinted chips; secondary-button border.",
  ],
  "color-border-subtle": [
    "ig-gray-100",
    "A quieter line: under the nav, around a catalog card.",
  ],
  "color-border-control": [
    "ig-gray-500",
    "Border of a form control (input, checkbox) on light surfaces. 3:1 against the page, the WCAG 1.4.11 minimum.",
  ],
  "color-border-action": [
    "ig-primary-200",
    "The border in the action colour: around a soft blue fill, an outline button, the release label.",
  ],
  // badges, tables
  "badge-bundle-background": [
    "ig-secondary-50",
    "Bundle badge fill (top-right of a ProductCard).",
  ],
  "badge-bundle-foreground": [
    "ig-secondary-700",
    "Bundle badge label on `badge-bundle-background`.",
  ],
  "badge-new-foreground": [
    "ig-success-600",
    "New status badge label on `badge-new-background`.",
  ],
  "badge-updated-foreground": [
    "ig-primary-700",
    "The label of the Updated badge, on `badge-updated-background`.",
  ],
  "badge-preview-foreground": [
    "ig-warn-500",
    "The label of the Preview badge, on `badge-preview-background`.",
  ],
  "badge-premium-foreground": [
    "ig-secondary-700",
    "The label of the Premium badge, on `badge-premium-background`.",
  ],
  "rating-star": ["ig-warn-200", "Filled star of a rating. Decorative."],
  "badge-oss-foreground": [
    "ig-success-600",
    "OSS tag label on `badge-oss-background`.",
  ],
  "table-mark-yes-background": [
    "ig-gray-200",
    'Comparison table "Yes" mark fill.',
  ],
  "table-mark-yes-foreground": [
    "ig-gray-700",
    'Comparison table "Yes" mark glyph.',
  ],
  "table-mark-partial-background": [
    "ig-warn-100",
    'Comparison table "Partial" and "Gated" mark fill.',
  ],
  "table-mark-partial-foreground": [
    "ig-warn-800",
    'Comparison table "Partial" and "Gated" mark glyph.',
  ],
  "table-mark-no-background": [
    "ig-gray-100",
    'Comparison table "No" mark fill.',
  ],
  "table-mark-no-foreground": [
    "ig-gray-600",
    'Comparison table "No" mark glyph.',
  ],
  "table-header-sub-foreground": [
    "ig-dark-gray-400",
    "Sub-label under a comparison column name, on `color-background-inverse`.",
  ],
  "table-header-sub-foreground-highlighted": [
    "color-foreground-on-action",
    "Sub-label on the highlighted column header (`color-background-action` fill).",
  ],
  "table-header-detail-foreground": [
    "ig-dark-gray-600",
    'The "Detail" column header on `color-background-inverse`.',
  ],
  "window-dot-red": ["ig-error-300", "BrowserFrame window dot."],
  "window-dot-amber": ["ig-warn-200", "BrowserFrame window dot."],
  "window-dot-green": ["ig-success-300", "BrowserFrame window dot."],
  // framework pills
  // icon tiles
  "tile-1": [
    "ig-info-seed",
    "Icon tile fill 1 of 8; a grid of icon tiles takes the fills in order. Now: CLI MCP on the AI toolchain row. Flat, never a gradient; white glyph.",
  ],
  "tile-2": [
    "ig-secondary-seed",
    "Icon tile fill 2 of 8; a grid of icon tiles takes the fills in order. Now: Agent Skills on the AI toolchain row.",
  ],
  "tile-3": [
    "ig-pink-400",
    "Icon tile fill 3 of 8; a grid of icon tiles takes the fills in order. Now: Theming MCP on the AI toolchain row.",
  ],
  "tile-4": [
    "ig-success-400",
    "Icon tile fill 4 of 8; a grid of icon tiles takes the fills in order. Now: AI Scaffolding on the AI toolchain row.",
  ],
  "tile-5": [
    "ig-cyan-200",
    "Icon tile fill 5 of 8; a grid of icon tiles takes the fills in order. Now: used when a grid has more than four tiles.",
  ],
  "tile-6": [
    "ig-warn-200",
    "Icon tile fill 6 of 8; a grid of icon tiles takes the fills in order. Now: used when a grid has more than four tiles.",
  ],
  "tile-7": [
    "ig-primary-seed",
    "Icon tile fill 7 of 8; a grid of icon tiles takes the fills in order. Now: used when a grid has more than four tiles.",
  ],
  "tile-8": [
    "ig-dark-surface-500",
    "Icon tile fill 8 of 8; a grid of icon tiles takes the fills in order. Now: used when a grid has more than four tiles.",
  ],
};

// ---- dark variant: text token -> the engine step it reads under [data-theme="dark"] ---------------
// Each is a lighter step of the family its alias in ALIAS names.
export const DARK_STEP: Record<string, string> = {
  "color-foreground-action": "ig-primary-200",
  "color-foreground-link": "ig-primary-200",
  "color-foreground-error": "ig-error-100",
  "color-foreground-success": "ig-success-50",
  "color-foreground-warning": "ig-warn-100",
  "color-foreground-info": "ig-primary-200",
  "badge-bundle-foreground": "ig-secondary-200",
  "badge-new-foreground": "ig-success-50",
  "badge-updated-foreground": "ig-primary-200",
  "badge-preview-foreground": "ig-warn-100",
  "badge-premium-foreground": "ig-secondary-200",
  "badge-oss-foreground": "ig-success-50",
  "table-mark-partial-foreground": "ig-warn-50",
};

// ---- translucent colours: live = hsl(from <base> h s l / <opacity token>) ----------------------
export type AlphaEntry = [base: string, opacity: OpacityName, usage: string];
export const ALPHA: Record<string, AlphaEntry> = {
  "release-strip-border": [
    "color-accent-brand",
    "opacity-heavy",
    "Border of emphasised cards and the release strip at rest.",
  ],
  "release-strip-ring": [
    "color-accent-brand",
    "opacity-soft",
    "Inner ring of the release strip at rest.",
  ],
  "release-strip-ring-hover": [
    "color-accent-brand",
    "opacity-strong",
    "Inner ring of the release strip on hover.",
  ],
  "badge-oss-background": [
    "badge-oss-foreground",
    "opacity-soft",
    "OSS tag fill.",
  ],
  "badge-updated-background": [
    "badge-updated-foreground",
    "opacity-soft",
    "The fill of the Updated badge.",
  ],
  "badge-updated-border": [
    "badge-updated-foreground",
    "opacity-strong",
    "The border of the Updated badge.",
  ],
  "badge-preview-background": [
    "badge-preview-foreground",
    "opacity-soft",
    "The fill of the Preview badge.",
  ],
  "badge-preview-border": [
    "badge-preview-foreground",
    "opacity-strong",
    "The border of the Preview badge.",
  ],
  "badge-premium-background": [
    "badge-premium-foreground",
    "opacity-soft",
    "The fill of the Premium badge.",
  ],
  "badge-premium-border": [
    "badge-premium-foreground",
    "opacity-strong",
    "The border of the Premium badge.",
  ],
  "badge-new-background": [
    "badge-new-foreground",
    "opacity-soft",
    "New status badge fill.",
  ],
  "badge-new-border": [
    "badge-new-foreground",
    "opacity-strong",
    "New status badge border.",
  ],
  "color-background-category-2": [
    "color-accent-ai",
    "opacity-subtle",
    "The soft fill of a second category, beside `color-background-tint`.",
  ],
  "color-background-category-3": [
    "color-accent-inverse-2",
    "opacity-subtle",
    "The soft fill of a third category, beside `color-background-tint` and `color-background-category-2`.",
  ],
  "color-background-inverse-overlay": [
    "color-background-inverse",
    "opacity-chip",
    "A see-through dark fill for a chip over a picture.",
  ],
  "color-background-info": [
    "color-foreground-info",
    "opacity-subtle",
    "Tinted fill behind `color-foreground-info` text.",
  ],
  "color-background-error": [
    "color-foreground-error",
    "opacity-subtle",
    "Tinted fill behind `color-foreground-error` text.",
  ],
  "color-background-success": [
    "color-foreground-success",
    "opacity-subtle",
    "Tinted fill behind `color-foreground-success` text.",
  ],
  "color-background-warning": [
    "color-foreground-warning",
    "opacity-subtle",
    "Tinted fill behind `color-foreground-warning` text.",
  ],
  "nav-background": [
    "color-background-page",
    "opacity-nav",
    "Sticky nav background, under `nav-backdrop-blur`.",
  ],
  "color-background-scrim": [
    "color-background-inverse",
    "opacity-strong",
    "Dims the page behind an open panel.",
  ],
  "footer-border-subtle": [
    "color-foreground-inverse",
    "opacity-subtle",
    "Footer hairline rules.",
  ],
  "footer-border": [
    "color-foreground-inverse",
    "opacity-muted",
    "Footer legal-link dividers and form control borders.",
  ],
  "footer-card-border": [
    "color-foreground-inverse",
    "opacity-subtle",
    "Border of the footer newsletter card.",
  ],
  "footer-field-background": [
    "color-foreground-inverse",
    "opacity-subtle",
    "Footer input fill (stacked newsletter).",
  ],
  "footer-field-inline-background": [
    "footer-background",
    "opacity-field",
    "Footer input fill inside the pill field.",
  ],
  "footer-check-background": [
    "color-foreground-inverse",
    "opacity-faint",
    "Footer checkbox fill, unchecked.",
  ],
  "footer-check-border": [
    "color-foreground-inverse",
    "opacity-heavy",
    "Footer checkbox border, unchecked.",
  ],
  "footer-social-background-hover": [
    "color-foreground-link-inverse",
    "opacity-muted",
    "Social button fill on hover.",
  ],
  "footer-social-border-hover": [
    "color-focus-ring-inverse",
    "opacity-heavy",
    "Social button border on hover.",
  ],
};

// ---- px scales (nominal px at default density: size=large, spacing=1) --------------------------
// Raw spacing steps. The name is a size, not a pixel claim: the live value follows --ig-spacing and --ig-size.
export const SPACE = {
  "3xs": 2,
  "2xs": 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 64,
  "6xl": 96,
} satisfies Record<string, number>;
export type SpaceStep = keyof typeof SPACE;
// Semantic spacing: what the space is for. Components use these for padding, margins and gaps; each role can be retuned on its own.
export type SpaceRoleEntry = [usage: string, sizes: SpaceStep[]];
export const SPACE_ROLES: Record<"inset" | "stack" | "gap", SpaceRoleEntry> = {
  inset: [
    "Padding inside a container: the space between an edge and its content.",
    ["3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl"],
  ],
  stack: [
    "Vertical distance between elements stacked on top of each other (margins).",
    ["3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl"],
  ],
  gap: [
    "Distance between items that sit side by side or in a grid (gap, inline margins).",
    ["3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl"],
  ],
};
export type SizeEntry = [px: number, usage: string];
export const SIZE: Record<string, SizeEntry> = {
  "border-width-default": [1, "Hairline borders and dividers."],
  "border-width-strong": [1.5, "Checkbox and gradient-border strokes."],
  "focus-ring-width": [
    3,
    "Width of the `color-focus-ring` outline on `:focus-visible`.",
  ],
  "focus-ring-offset": [
    2,
    "Offset of the focus outline; the element itself never moves or changes fill on focus.",
  ],
  "window-dot-size": [11, "BrowserFrame window dot."],
  "size-icon-stroke": [2.2, "Stroke width of every `Icon` (viewBox units)."],
  "size-icon-stroke-strong": [
    3,
    '`Icon` weight="strong": check marks and close marks on a filled disc.',
  ],
  "size-icon-xs": [12, "Glyph in a comparison mark; caret in a trigger."],
  "size-icon-sm": [14, "Inline arrow in a link or a small control."],
  "size-icon-md": [16, "Default icon and checkbox box."],
  "size-icon-lg": [20, "Nav icon button glyph; comparison mark circle."],
  "size-control-sm": [36, "Icon button and social button."],
  "size-control-md": [
    40,
    "Navigation CTA, pill field and its button, compliance seals.",
  ],
  "size-control-lg": [44, "Stacked field and its button."],
  "size-control-xl": [48, "Minimum accordion row height on mobile."],
  "nav-height": [70, "Navigation bar minimum height."],
  "badge-mono-size": [32, "Monogram badge box."],
  "size-tile": [44, "Icon tile box."],
  "fw-logo-height": [16, "Framework logo inside a pill."],
  "logo-height": [24, "Header and footer wordmark."],
  "product-logo-height": [26, "Product logo in a catalog card."],
  "product-logo-max-width": [160, "Product logo maximum width."],
  "stat-badge-offset": [
    18,
    "How far a floating stat badge overhangs its frame.",
  ],
  "stat-badge-inset": [24, "Inset of a bottom-anchored stat badge."],
  "glow-size-lg": [760, "Footer glow, large."],
  "glow-size-md": [640, "Footer glow, medium."],
  "field-min-width": [220, "Minimum width of a flexible field."],
  "callout-min-width": [220, "Minimum width of the copy block in a callout."],
  "callout-max-width": [1080, "Maximum width of the release strip."],
  "newsletter-min-width": [
    320,
    "Minimum column width in the newsletter block.",
  ],
  "footer-column-min-width": [180, "Minimum footer column width."],
  "nav-panel-max-width": [1280, "Default nav panel maximum width."],
  "bleed-width": [1180, "Content width a bleeding frame measures against."],
  "container-max-width": [1280, "Max content width."],
  "container-hero-max-width": [1120, "Max width of hero text."],
  "container-prose-max-width": [880, "Max width of prose."],
  "catalog-card-min-width": [
    340,
    "Min card width in the catalog grid: repeat(auto-fill, minmax(var(--igd-catalog-card-min-width), 1fr)).",
  ],
};
export type TrackingEntry = [em: string, usage: string];
// em, from the type slots
export const TRACKING: Record<string, TrackingEntry> = {
  "letter-spacing-label": ["0.12em", "Uppercase table and column headers."],
  "letter-spacing-badge": ["0.04em", "Uppercase badges."],
  "letter-spacing-mono": ["0.02em", "Monogram badge."],
};
export type RadiusEntry = [
  designPx: number,
  usage: string,
  minPx?: number,
  maxPx?: number,
];
// The engine's border-radius() clamps between min and max.
export const RADIUS: Record<string, RadiusEntry> = {
  "radius-action": [
    9999,
    "Every action, chip and framework selector. Fully round at any height today; never sharper than 4px.",
    4,
    9999,
  ],
  "nav-panel-radius": [30, "Flared top corners of an open nav panel.", 0, 30],
  "radius-card-featured": [
    24,
    "Emphasis and catalog cards. Never a circle: capped at 28px.",
    4,
    28,
  ],
  "radius-card": [
    16,
    "Marketing cards and media frames. Capped at 24px.",
    0,
    24,
  ],
  "radius-tile": [
    12,
    "Icon tiles, stat badges and nav link rows. Capped at 16px so a tile never becomes a circle.",
    4,
    16,
  ],
  "radius-badge": [8, "Small elements and the monogram badge.", 2, 12],
  "radius-control": [6, "OSS tag and checkbox.", 2, 8],
};
// The neutral shadows, as www.infragistics.com ships them. Each layer is [y, blur, spread, tint, alpha]; the tint is a token name.
export type ShadowLayer = [
  y: number,
  blur: number,
  spread: number,
  tint: "color-shadow" | "color-background-inverse",
  alpha: number,
];
export const SHADOW: Record<string, ShadowLayer[]> = {
  "shadow-card-hover": [
    [10, 30, -5, "color-shadow", 0.08],
    [4, 10, -5, "color-shadow", 0.04],
  ],
  "shadow-screenshot": [[44, 90, -34, "color-background-inverse", 0.4]],
  "shadow-floating": [[16, 32, -12, "color-background-inverse", 0.4]],
  "shadow-popover": [[26, 50, -22, "color-background-inverse", 0.22]],
  "shadow-chip": [[24, 50, -12, "color-shadow", 0.6]],
  "shadow-panel": [
    [-2, 8, 0, "color-background-inverse", 0.04],
    [18, 40, -12, "color-background-inverse", 0.28],
    [40, 80, -24, "color-background-inverse", 0.3],
  ],
};
// Vertical padding of a page section: the two spacing steps it runs between, and the container widths it grows across.
export const SECTION_SPACE = {
  min: "5xl",
  max: "6xl",
  from: 360,
  to: 1280,
} satisfies { min: SpaceStep; max: SpaceStep; from: number; to: number };
export type OpacityEntry = [value: number, usage: string];
export const OPACITY = {
  "opacity-faint": [0.04, "Barely-there tint."],
  "opacity-subtle": [0.08, "Soft fills and hairlines."],
  "opacity-soft": [0.12, "Tag fills and inner rings."],
  "opacity-muted": [0.16, "Glows and control borders."],
  "opacity-strong": [0.25, "Capsule borders and scrims."],
  "opacity-heavy": [0.4, "Emphasis borders and strong glows."],
  "opacity-field": [0.6, "Input fill on the dark footer."],
  "opacity-chip": [0.82, "Dark chips over a screenshot."],
  "opacity-nav": [0.96, "Sticky nav background."],
  "opacity-disabled": [0.45, "Disabled controls."],
} satisfies Record<string, OpacityEntry>;
export type OpacityName = keyof typeof OPACITY;
export const WEIGHT: Record<string, number> = {
  "font-weight-regular": 400,
  "font-weight-medium": 500,
  "font-weight-semibold": 600,
  "font-weight-bold": 700,
  "font-weight-extrabold": 800,
  "font-weight-black": 900,
};
export type BreakpointEntry = [px: number, usage: string];
export const BREAKPOINT: Record<string, BreakpointEntry> = {
  "breakpoint-sm": [
    640,
    "Two-up copy/media splits stack; footer collapses to accordions; catalog drops to one column.",
  ],
  "breakpoint-md": [
    768,
    "Nav collapses to a menu button; the utility bar hides.",
  ],
  "breakpoint-lg": [
    1024,
    "Feature grid goes 3-up → 2-up; the nav items collapse to a menu.",
  ],
  "breakpoint-xl": [
    1280,
    "Container reaches full width; the gutter stops growing; secondary nav links hide below it.",
  ],
};
export type ZIndexEntry = [value: number, usage: string];
export const ZINDEX: Record<string, ZIndexEntry> = {
  "z-index-base": [1, "Section content sitting above an ambient glow."],
  "z-index-raised": [
    2,
    "Full-card link overlays; the footer above a card body.",
  ],
  "z-index-media": [3, "Floating stat badges over a browser frame."],
  "z-index-lift": [5, "The G2 card that straddles two bands."],
  "z-index-sticky": [40, "Sticky filter bar on the catalog and the nav scrim."],
  "z-index-nav": [
    50,
    "The site header. Nothing in page content may exceed this.",
  ],
  "z-index-panel": [60, "Nav dropdown panels."],
  "z-index-overlay": [100, "Anything modal."],
};

// ---- type: the roles, the engine slot each uses and the values passed to the engine's typography() ----
// Sizes are in px and the engine returns them in rem. line is a unitless multiple of the size.
// The 13 type slots igniteui-theming has. Mirrors $ITypeScale in the engine.
export const ENGINE_TYPE_SLOTS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "subtitle-1",
  "subtitle-2",
  "body-1",
  "body-2",
  "button",
  "caption",
  "overline",
];
// name is the published role; slot is the engine slot that holds it, or a build-only key when the engine has none; was is the name docs/MIGRATION.md maps from.
export type TypeRow = {
  slot: string;
  name: string;
  was: string;
  family: FamilyName;
  sizePx: number;
  line: number;
  weight: number;
  tracking: string;
  transform: "none" | "uppercase";
  usage: string;
  sample: string;
};
export const TYPE: TypeRow[] = [
  {
    slot: "h1",
    name: "display-lg",
    was: "display-h1",
    family: "display",
    sizePx: 52,
    line: 1.12,
    weight: 900,
    tracking: "-0.0257em",
    transform: "none",
    usage: "Homepage hero only, in `color-foreground-heading`.",
    sample: "Enterprise UI Components, Accelerated by AI",
  },
  {
    slot: "h2",
    name: "display-md",
    was: "display-h2",
    family: "display",
    sizePx: 43,
    line: 1.06,
    weight: 800,
    tracking: "-0.0256em",
    transform: "none",
    usage: "Section heads, in `color-foreground-heading`.",
    sample: "Meet the Industry’s Fastest Data Grid",
  },
  {
    slot: "h3",
    name: "display-sm",
    was: "display-h3",
    family: "display",
    sizePx: 23,
    line: 1.2,
    weight: 800,
    tracking: "-0.0222em",
    transform: "none",
    usage:
      "Sub-section and panel heads; `color-foreground-inverse` on dark. There is no h7.",
    sample: "Sales Dashboard",
  },
  {
    slot: "h4",
    name: "stat",
    was: "display-stat",
    family: "display",
    sizePx: 26,
    line: 1.1,
    weight: 800,
    tracking: "0",
    transform: "none",
    usage:
      "Stat badge values: `color-accent-inverse-1` or `color-accent-inverse-2` on `color-background-inverse`, `color-foreground-faint` on light; newsletter title.",
    sample: "100K+ Rows",
  },
  {
    slot: "h5",
    name: "title-md",
    was: "product-name",
    family: "display",
    sizePx: 18,
    line: 1.3,
    weight: 800,
    tracking: "-0.0167em",
    transform: "none",
    usage: "Product names in a catalog card, in `color-foreground-heading`.",
    sample: "Ignite UI",
  },
  {
    slot: "h6",
    name: "title-sm",
    was: "card-title",
    family: "body",
    sizePx: 16,
    line: 1.4,
    weight: 600,
    tracking: "0",
    transform: "none",
    usage:
      "Card titles, sentence case, in `color-foreground-heading` — body face, not the display face.",
    sample: "Query Builder",
  },
  {
    slot: "subtitle-1",
    name: "lead",
    was: "body-lead",
    family: "body",
    sizePx: 19,
    line: 1.6,
    weight: 400,
    tracking: "0",
    transform: "none",
    usage: "Lead under an h1 or h2, in `color-foreground-subtle`.",
    sample:
      "Build enterprise applications with 300+ framework agnostic UI components.",
  },
  {
    slot: "subtitle-2",
    name: "label-lg",
    was: "callout-title",
    family: "body",
    sizePx: 17,
    line: 1.5,
    weight: 700,
    tracking: "0",
    transform: "none",
    usage: "Hero button label and callout titles.",
    sample: "Introducing Ignite UI 2026",
  },
  {
    slot: "body-1",
    name: "body-lg",
    was: "body-text",
    family: "body",
    sizePx: 16,
    line: 1.62,
    weight: 400,
    tracking: "0",
    transform: "none",
    usage: "Running prose, in `color-foreground-subtle`.",
    sample: "Enterprise-grade virtualization renders 100,000 rows without lag.",
  },
  {
    slot: "body-2",
    name: "body-md",
    was: "body-ui",
    family: "body",
    sizePx: 15,
    line: 1.5,
    weight: 400,
    tracking: "0",
    transform: "none",
    usage: "Nav, buttons and list rows, in `color-foreground-control`.",
    sample: "Advanced virtualization and hundreds of built-in features.",
  },
  {
    slot: "button",
    name: "label-md",
    was: "button",
    family: "body",
    sizePx: 15,
    line: 1.5,
    weight: 600,
    tracking: "0",
    transform: "none",
    usage: "Button and CTA labels.",
    sample: "Start Free Trial",
  },
  {
    slot: "caption",
    name: "body-sm",
    was: "body-caption",
    family: "body",
    sizePx: 14,
    line: 1.55,
    weight: 400,
    tracking: "0",
    transform: "none",
    usage: "Captions, card descriptions and table detail copy.",
    sample: "Visual query composition with nested groups.",
  },
  {
    slot: "overline",
    name: "eyebrow",
    was: "eyebrow",
    family: "body",
    sizePx: 12,
    line: 1.5,
    weight: 600,
    tracking: "0.16em",
    transform: "uppercase",
    usage: "Eyebrows: ALL CAPS, in `color-foreground-action`.",
    sample: "DEVELOPER TOOLS",
  },
  {
    slot: "detail-1",
    name: "body-xs",
    was: "body-micro",
    family: "body",
    sizePx: 13,
    line: 1.5,
    weight: 400,
    tracking: "0",
    transform: "none",
    usage: "Micro text: utility bar, legal copy, chips.",
    sample: "North American Sales: 1-800-231-8588",
  },
  {
    slot: "detail-2",
    name: "body-2xs",
    was: "body-nano",
    family: "body",
    sizePx: 11,
    line: 1.4,
    weight: 400,
    tracking: "0",
    transform: "none",
    usage: "Badge sublabels and nano meta labels (`color-foreground-faint`).",
    sample: "Fastest grid",
  },
];
export type FamilyName = "display" | "body" | "mono";
// The container widths, in px, between which a fluid type role grows from its minimum to its size in TYPE.
export const TYPE_FLUID_RANGE = { from: 360, to: 1280 };
// The size, in px, of a fluid type role in a container TYPE_FLUID_RANGE.from wide. A role that is not listed has one size.
export const TYPE_MIN: Record<string, number> = {
  "display-lg": 36,
  "display-md": 30,
  "display-sm": 20,
  lead: 17,
};
// A type set gives the roles other values for one kind of site. The face of each role stays the one in TYPE.
export type TypeSetEntry = {
  sizePx: number;
  line: number;
  weight: number;
  tracking?: string;
  transform?: "none" | "uppercase";
};
// docs: the sizes of the documentation, API reference and blog pages, taken from igniteui-astro-components.
export const TYPE_SETS: Record<string, Record<string, TypeSetEntry>> = {
  docs: {
    "display-lg": { sizePx: 36, line: 1.1111, weight: 700 },
    "display-md": { sizePx: 24, line: 1.3333, weight: 700 },
    "display-sm": { sizePx: 20, line: 1.4, weight: 700 },
    stat: { sizePx: 18, line: 1.5556, weight: 700 },
    "title-md": { sizePx: 16, line: 1.5, weight: 700 },
    "title-sm": { sizePx: 14, line: 1.4286, weight: 600 },
    lead: { sizePx: 16, line: 1.5, weight: 500, tracking: "0.0094em" },
    "label-lg": { sizePx: 14, line: 1.7143, weight: 600, tracking: "0.0071em" },
    "body-lg": { sizePx: 16, line: 1.75, weight: 400 },
    "body-md": { sizePx: 14, line: 1.4286, weight: 500 },
    "label-md": { sizePx: 16, line: 1.5, weight: 400 },
    "body-sm": { sizePx: 12, line: 1.5, weight: 500 },
    eyebrow: {
      sizePx: 10,
      line: 2,
      weight: 400,
      tracking: "0.15em",
      transform: "uppercase",
    },
    "body-xs": { sizePx: 13, line: 1.5385, weight: 400, tracking: "0.0231em" },
    "body-2xs": { sizePx: 13, line: 1.2308, weight: 600, tracking: "0.0115em" },
  },
};
export const FAMILIES: Record<FamilyName, string> = {
  display: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  body: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};
export const SIZE_RATIO: Record<"small" | "medium" | "large", number> = {
  small: 0.75,
  medium: 0.875,
  large: 1,
}; // density steps applied by sizable()/pad()

// The colour pairings measured for contrast: [text or outline, background, minimum ratio]. The minimum is 4.5 unless given.
export type ContrastPair = [fg: string, bg: string, min?: number];
export const CONTRAST_PAIRS: ContrastPair[] = [
  ["color-foreground-heading", "color-background-page"],
  ["color-foreground-default", "color-background-page"],
  ["color-foreground-subtle", "color-background-page"],
  ["color-foreground-subtle", "color-background-subtle"],
  ["color-foreground-control", "color-background-page"],
  ["color-foreground-faint", "color-background-page"],
  ["color-foreground-faint", "color-background-subtle"],
  ["color-foreground-action", "color-background-page"],
  ["color-foreground-link", "color-background-page"],
  ["color-foreground-link-active", "color-background-page"],
  ["badge-updated-foreground", "color-background-page"],
  ["badge-preview-foreground", "color-background-page"],
  ["badge-premium-foreground", "color-background-page"],
  ["color-foreground-action", "color-background-tint"],
  ["color-foreground-action", "color-background-card"],
  ["color-foreground-action", "color-background-subtle"],
  ["color-foreground-on-action", "color-background-action"],
  ["color-foreground-on-action", "color-background-action-hover"],
  ["color-foreground-faint", "color-background-card"],
  ["color-foreground-faint", "color-background-tint"],
  ["color-foreground-link-inverse-hover", "color-background-inverse"],
  ["color-foreground-link-hover", "color-background-page"],
  ["color-foreground-inverse", "color-background-inverse"],
  ["color-foreground-inverse-faint", "color-background-inverse"],
  ["color-accent-inverse-1", "color-background-inverse"],
  ["color-accent-inverse-2", "color-background-inverse"],
  ["color-foreground-link-inverse", "color-background-inverse"],
  ["color-focus-ring-inverse", "color-background-inverse"],
  ["footer-link-foreground", "color-background-inverse-raised"],
  ["footer-foreground", "color-background-inverse-raised"],
  ["footer-foreground-strong", "color-background-inverse-raised"],
  ["footer-foreground-faint", "color-background-inverse-raised"],
  ["color-foreground-error-inverse", "color-background-inverse-raised"],
  ["badge-bundle-foreground", "badge-bundle-background"],
  ["badge-oss-foreground", "color-background-page"],
  ["badge-new-foreground", "color-background-page"],
  ["color-foreground-success", "color-background-page"],
  ["color-foreground-info", "color-background-page"],
  ["color-foreground-info", "color-background-tint"],
  ["color-foreground-success-inverse", "color-background-inverse", 3],
  ["color-foreground-warning-inverse", "color-background-inverse"],
  ["color-foreground-info-inverse", "color-background-inverse"],
  ["color-foreground-warning", "color-background-page"],
  ["table-mark-yes-foreground", "table-mark-yes-background"],
  ["table-mark-partial-foreground", "table-mark-partial-background"],
  ["table-mark-no-foreground", "table-mark-no-background"],
  ["table-header-sub-foreground", "color-background-inverse"],
  ["table-header-sub-foreground-highlighted", "color-background-action"],
  ["table-header-detail-foreground", "color-background-inverse"],
  ["color-foreground-decorative", "color-background-page", 1],
  ["color-border-control", "color-background-page", 3],
  ["color-focus-ring-inverse", "color-background-inverse", 3],
  ["color-background-action", "color-background-page", 1],
  ["color-foreground-error", "color-background-page"],
  ["color-foreground-error", "color-background-subtle"],
  ["color-focus-ring", "color-background-page", 3],
  ["color-foreground-control", "color-background-subtle"],
];
