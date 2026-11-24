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
  "color-accent-brand-hover": [
    "ig-info-400",
    "Hover step of `color-accent-brand`.",
  ],
  "color-accent-brand-active": [
    "ig-info-500",
    "Press state step of `color-accent-brand`.",
  ],
  "color-accent-ai": [
    "ig-secondary-seed",
    "Gradient partner to `color-accent-brand` and the AI marker. Never a fill on its own.",
  ],
  "color-accent-inverse": [
    "ig-sky-200",
    "On-dark accent only: stat numbers on `color-surface-inverse`. Never on white.",
  ],
  "color-accent-inverse-performance": [
    "ig-teal-200",
    "On-dark accent only: performance stat numbers on `color-surface-inverse`. Never on white.",
  ],
  "color-action-default": [
    "ig-primary-seed",
    "The engine\u2019s primary seed itself (--ig-primary-seed), not a fitted shade. The fill of every action: the primary CTA, with `color-action-on` as its label. Text in the action colour is `color-action-text`.",
  ],
  "color-action-hover": [
    "ig-primary-700",
    "Link hover on light surfaces (colour shift only, no underline).",
  ],
  "color-action-fill-hover": [
    "ig-primary-700",
    "Filled-button hover: the primary fill moves to this and nothing else changes. A step `color-action-on` reads on: darker under a white label, primary step 400 under a black one.",
  ],
  "color-action-active": [
    "ig-primary-800",
    "Inline link press state on light surfaces.",
  ],
  "color-action-text": [
    "ig-primary-600",
    "The action colour when it is text, an icon or a thin line on a surface: links, eyebrows, outline and ghost button labels, focus outlines. An engine step, which the engine solves to the same contrast for any seed.",
  ],
  "color-action-on": [
    "ig-surface-base",
    "Label and icon colour on `color-action-default` fills: black or white, whichever reads on the fill (the engine\u2019s adaptive contrast).",
  ],
  "color-link-utility": [
    "ig-info-500",
    "Links in the utility row above the nav, on `color-surface-page`.",
  ],
  "color-link-utility-hover": ["color-action-text", "Utility-row link hover."],
  "color-link-inverse": [
    "ig-sky-200",
    "Inline links on dark surfaces (`color-surface-inverse`).",
  ],
  "color-link-inverse-hover": [
    "ig-sky-100",
    "Hover of `color-link-inverse`: colour shift only.",
  ],
  "footer-link": [
    "ig-dark-gray-600",
    "Footer column links on the footer gradient.",
  ],
  "footer-link-hover": ["ig-dark-gray-900", "Footer link hover."],
  "color-focus-default": [
    "color-action-text",
    "Keyboard focus outline on light surfaces, `focus-ring-width` at `focus-ring-offset`, `:focus-visible` only.",
  ],
  "color-focus-inverse": [
    "ig-sky-100",
    "Keyboard focus outline inside a `data-on-dark` section.",
  ],
  // text
  "color-text-heading": [
    "ig-gray-900",
    "Headlines h1–h6 on `color-surface-page` and the catalog band.",
  ],
  "color-text-strong": [
    "ig-gray-800",
    "Strong text and secondary-button labels on `color-surface-page`; the body default in base styles.",
  ],
  "color-text-body": [
    "ig-gray-600",
    "Body and lead copy, utility-bar text and nav triggers at rest, on `color-surface-page` and `color-surface-subtle`.",
  ],
  "color-text-ui": [
    "ig-gray-700",
    "UI text — nav, buttons, list rows, chips — on `color-surface-page`.",
  ],
  "color-text-muted": [
    "ig-gray-500",
    "Muted copy, nano labels, card descriptions and catalog counts; body copy never goes lighter.",
  ],
  "color-text-inverse": [
    "ig-dark-gray-900",
    "Text on `color-surface-inverse`.",
  ],
  "color-text-inverse-muted": [
    "ig-dark-gray-400",
    "Stat-badge labels and muted copy on `color-surface-inverse`.",
  ],
  "color-icon-subtle": [
    "ig-gray-400",
    "The caret in the nav row (decorative, below the 3:1 icon floor, kept as in the source).",
  ],
  "color-feedback-error-default": [
    "ig-error-500",
    "Validation text and border on light surfaces.",
  ],
  "color-feedback-info-default": [
    "ig-primary-700",
    "Informational text and icons on light surfaces: a note, a tip.",
  ],
  "color-feedback-warning-inverse": [
    "ig-warn-200",
    "Warning text and icons on dark surfaces.",
  ],
  "color-feedback-info-inverse": [
    "ig-primary-300",
    "Informational text and icons on dark surfaces.",
  ],
  "color-feedback-success-inverse": [
    "ig-success-300",
    "Success icons on dark surfaces, such as a code block.",
  ],
  "color-feedback-success-default": [
    "ig-success-600",
    "Success text and icons on light surfaces: a confirmed state, a check mark.",
  ],
  "color-feedback-warning-default": [
    "ig-warn-500",
    "Warning text and icons on light surfaces.",
  ],
  "color-feedback-error-inverse": [
    "ig-error-300",
    "Validation text and border on the dark footer.",
  ],
  // surfaces
  "color-surface-page": ["ig-surface-base", "Page background; flat."],
  "color-surface-hero": [
    "ig-surface-sunken",
    "Top of the hero wash (`gradient-hero`).",
  ],
  "color-surface-subtle": [
    "ig-surface-sunken",
    "Alternating section bands, BrowserFrame title bar, callout strips and chips at rest.",
  ],
  "color-surface-card": ["ig-surface-raised", "Marketing card fill."],
  "color-surface-tint": [
    "ig-primary-50",
    "Soft blue fill: tinted chips, callouts, the catalog band, release strip at rest and monogram badges.",
  ],
  "color-surface-inverse-raised": [
    "ig-dark-surface-200",
    "The lightest dark surface: where a dark area lifts towards the light, such as the start of the footer gradient.",
  ],
  "color-surface-inverse-sunken": [
    "ig-dark-surface-900",
    "The darkest dark surface: the deepest part of a dark area, such as the end of the footer gradient.",
  ],
  "color-surface-inverse": [
    "ig-dark-surface-500",
    "The one dark treatment: stat badges, table header and dark stat panels (the engine dark-variant surface).",
  ],
  "color-surface-tint-strong": [
    "ig-primary-100",
    "Release strip on hover; also the open nav trigger.",
  ],
  "color-surface-muted": [
    "ig-surface-sunken",
    '"Coming soon" pill fill: a recessed surface, lighter grey in the light variant and a deeper navy in the dark one.',
  ],
  // footer
  "footer-background": [
    "color-surface-inverse-sunken",
    "Footer gradient end; flat fallback for `footer-background-gradient`.",
  ],
  "footer-text": [
    "ig-dark-gray-500",
    "Footer body copy, legal links and social glyphs.",
  ],
  "footer-strong": [
    "ig-dark-gray-800",
    "Footer sub-group labels (Web, Desktop, Bundles) and legal-link emphasis.",
  ],
  "footer-heading": [
    "ig-dark-gray-400",
    "Footer 12px uppercase group labels, placeholder and copyright.",
  ],
  "footer-icon": ["ig-dark-gray-500", "Footer social icons."],
  "footer-focus": ["ig-sky-100", "Keyboard focus ring inside the footer."],
  // borders
  "color-border-default": [
    "ig-gray-200",
    "Hairline border on cards, chips and tinted chips; secondary-button border.",
  ],
  "color-border-subtle": [
    "ig-gray-100",
    "Hairline under the nav; default catalog-card border.",
  ],
  "color-border-control": [
    "ig-gray-500",
    "Border of a form control (input, checkbox) on light surfaces. 3:1 against the page, the WCAG 1.4.11 minimum.",
  ],
  "color-border-accent": [
    "ig-primary-200",
    "Blue-tinted borders: soft blue fills, outline buttons and the release label.",
  ],
  // badges, tables
  "badge-bundle-background": [
    "ig-secondary-50",
    "Bundle badge fill (top-right of a ProductCard).",
  ],
  "badge-bundle-color": [
    "ig-secondary-700",
    "Bundle badge label on `badge-bundle-background`.",
  ],
  "badge-new-color": [
    "ig-success-600",
    "New status badge label on `badge-new-background`.",
  ],
  "badge-updated-color": [
    "ig-primary-700",
    "Updated status badge label on `badge-updated-background`.",
  ],
  "badge-preview-color": [
    "ig-warn-500",
    "Preview status badge label on `badge-preview-background`.",
  ],
  "badge-premium-color": [
    "ig-secondary-700",
    "Premium status badge label on `badge-premium-background`.",
  ],
  "rating-star": ["ig-warn-200", "Filled star of a rating. Decorative."],
  "badge-oss-color": [
    "ig-success-600",
    "OSS tag label on `badge-oss-background`.",
  ],
  "table-mark-yes-background": [
    "ig-gray-200",
    'Comparison table "Yes" mark fill.',
  ],
  "table-mark-yes-color": ["ig-gray-700", 'Comparison table "Yes" mark glyph.'],
  "table-mark-partial-background": [
    "ig-warn-100",
    'Comparison table "Partial" and "Gated" mark fill.',
  ],
  "table-mark-partial-color": [
    "ig-warn-800",
    'Comparison table "Partial" and "Gated" mark glyph.',
  ],
  "table-mark-no-background": [
    "ig-gray-100",
    'Comparison table "No" mark fill.',
  ],
  "table-mark-no-color": ["ig-gray-600", 'Comparison table "No" mark glyph.'],
  "table-header-sub-color": [
    "ig-dark-gray-400",
    "Sub-label under a comparison column name, on `color-surface-inverse`.",
  ],
  "table-header-sub-highlight-color": [
    "color-action-on",
    "Sub-label on the highlighted column header (`color-action-default` fill).",
  ],
  "table-header-detail-color": [
    "ig-dark-gray-600",
    'The "Detail" column header on `color-surface-inverse`.',
  ],
  "window-dot-red": ["ig-error-300", "BrowserFrame window dot."],
  "window-dot-amber": ["ig-warn-200", "BrowserFrame window dot."],
  "window-dot-green": ["ig-success-300", "BrowserFrame window dot."],
  // framework pills
  "fw-angular-color": [
    "ig-pink-500",
    "Angular framework base colour. The pill fill and border derive from it.",
  ],
  "fw-react-color": [
    "ig-cyan-500",
    "React framework base colour. The pill fill and border derive from it.",
  ],
  "fw-angular-background": [
    "ig-pink-50",
    "Angular framework pill fill; holds on hover.",
  ],
  "fw-angular-border": ["ig-pink-100", "Angular framework pill border."],
  "fw-react-background": ["ig-cyan-50", "React framework pill fill."],
  "fw-react-border": ["ig-cyan-100", "React framework pill border."],
  "fw-webcomponents-background": [
    "ig-primary-50",
    "Web Components framework pill fill.",
  ],
  "fw-webcomponents-border": [
    "ig-primary-200",
    "Web Components framework pill border.",
  ],
  "fw-winforms-background": [
    "ig-primary-50",
    "Windows Forms framework pill fill (shares the Web Components tint).",
  ],
  "fw-winforms-border": [
    "ig-primary-200",
    "Windows Forms framework pill border.",
  ],
  "fw-blazor-background": ["ig-secondary-50", "Blazor framework pill fill."],
  "fw-blazor-border": ["ig-secondary-200", "Blazor framework pill border."],
  "fw-wpf-background": ["ig-primary-100", "WPF framework pill fill."],
  "fw-wpf-border": ["ig-primary-200", "WPF framework pill border."],
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
  "color-action-text": "ig-primary-200",
  "color-feedback-error-default": "ig-error-100",
  "color-feedback-success-default": "ig-success-50",
  "color-feedback-warning-default": "ig-warn-100",
  "color-feedback-info-default": "ig-primary-200",
  "badge-bundle-color": "ig-secondary-200",
  "badge-new-color": "ig-success-50",
  "badge-updated-color": "ig-primary-200",
  "badge-preview-color": "ig-warn-100",
  "badge-premium-color": "ig-secondary-200",
  "badge-oss-color": "ig-success-50",
  "table-mark-partial-color": "ig-warn-50",
  "fw-angular-color": "ig-pink-100",
  "fw-react-color": "ig-cyan-50",
};

// ---- translucent colours: live = hsl(from <base> h s l / <opacity token>) ----------------------
export type AlphaEntry = [base: string, opacity: OpacityName, usage: string];
export const ALPHA: Record<string, AlphaEntry> = {
  "color-action-subtle": [
    "color-action-default",
    "opacity-subtle",
    "Tinted capsule fill behind `color-action-default` text.",
  ],
  "color-action-subtle-border": [
    "color-action-default",
    "opacity-strong",
    "Border of the `color-action-subtle` capsule.",
  ],
  "color-emphasis-border": [
    "color-accent-brand",
    "opacity-heavy",
    "Border of emphasised cards and the release strip at rest.",
  ],
  "color-emphasis-ring": [
    "color-accent-brand",
    "opacity-soft",
    "Inner ring of the release strip at rest.",
  ],
  "color-emphasis-ring-hover": [
    "color-accent-brand",
    "opacity-strong",
    "Inner ring of the release strip on hover.",
  ],
  "badge-oss-background": ["badge-oss-color", "opacity-soft", "OSS tag fill."],
  "badge-oss-border": ["badge-oss-color", "opacity-strong", "OSS tag border."],
  "badge-new-background": [
    "badge-new-color",
    "opacity-soft",
    "New status badge fill.",
  ],
  "badge-new-border": [
    "badge-new-color",
    "opacity-strong",
    "New status badge border.",
  ],
  "badge-updated-background": [
    "badge-updated-color",
    "opacity-soft",
    "Updated status badge fill.",
  ],
  "badge-updated-border": [
    "badge-updated-color",
    "opacity-strong",
    "Updated status badge border.",
  ],
  "badge-preview-background": [
    "badge-preview-color",
    "opacity-soft",
    "Preview status badge fill.",
  ],
  "badge-preview-border": [
    "badge-preview-color",
    "opacity-strong",
    "Preview status badge border.",
  ],
  "badge-premium-background": [
    "badge-premium-color",
    "opacity-soft",
    "Premium status badge fill.",
  ],
  "badge-premium-border": [
    "badge-premium-color",
    "opacity-strong",
    "Premium status badge border.",
  ],
  "color-surface-tint-ai": [
    "color-accent-ai",
    "opacity-subtle",
    "Soft fill in the secondary accent: a second category beside `color-surface-tint`.",
  ],
  "color-surface-tint-category": [
    "color-accent-inverse-performance",
    "opacity-subtle",
    "Soft fill for a third category, beside `color-surface-tint` and `color-surface-tint-ai`.",
  ],
  "color-surface-inverse-chip": [
    "color-surface-inverse",
    "opacity-chip",
    "Translucent dark chip that floats over a screenshot.",
  ],
  "color-feedback-info-surface": [
    "color-feedback-info-default",
    "opacity-subtle",
    "Tinted fill behind `color-feedback-info-default` text.",
  ],
  "color-feedback-error-surface": [
    "color-feedback-error-default",
    "opacity-subtle",
    "Tinted fill behind `color-feedback-error-default` text.",
  ],
  "color-feedback-success-surface": [
    "color-feedback-success-default",
    "opacity-subtle",
    "Tinted fill behind `color-feedback-success-default` text.",
  ],
  "color-feedback-warning-surface": [
    "color-feedback-warning-default",
    "opacity-subtle",
    "Tinted fill behind `color-feedback-warning-default` text.",
  ],
  "nav-background": [
    "color-surface-page",
    "opacity-nav",
    "Sticky nav background, under `nav-backdrop-blur`.",
  ],
  "color-overlay-scrim": [
    "color-surface-inverse",
    "opacity-strong",
    "Page dimmer behind an open nav panel.",
  ],
  "footer-rule": [
    "color-text-inverse",
    "opacity-subtle",
    "Footer hairline rules.",
  ],
  "footer-rule-strong": [
    "color-text-inverse",
    "opacity-muted",
    "Footer legal-link dividers and form control borders.",
  ],
  "footer-card-border": [
    "color-text-inverse",
    "opacity-subtle",
    "Border of the footer newsletter card.",
  ],
  "footer-field-background": [
    "color-text-inverse",
    "opacity-subtle",
    "Footer input fill (stacked newsletter).",
  ],
  "footer-field-inline-background": [
    "footer-background",
    "opacity-field",
    "Footer input fill inside the pill field.",
  ],
  "footer-check-background": [
    "color-text-inverse",
    "opacity-faint",
    "Footer checkbox fill, unchecked.",
  ],
  "footer-check-border": [
    "color-text-inverse",
    "opacity-heavy",
    "Footer checkbox border, unchecked.",
  ],
  "footer-social-hover-background": [
    "color-link-inverse",
    "opacity-muted",
    "Social button fill on hover.",
  ],
  "footer-social-hover-border": [
    "color-focus-inverse",
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
    "Width of the `color-focus-default` outline on `:focus-visible`.",
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
  tint: "color-shadow" | "color-surface-inverse",
  alpha: number,
];
export const SHADOW: Record<string, ShadowLayer[]> = {
  "shadow-card-hover": [
    [10, 30, -5, "color-shadow", 0.08],
    [4, 10, -5, "color-shadow", 0.04],
  ],
  "shadow-screenshot": [[44, 90, -34, "color-surface-inverse", 0.4]],
  "shadow-floating": [[16, 32, -12, "color-surface-inverse", 0.4]],
  "shadow-popover": [[26, 50, -22, "color-surface-inverse", 0.22]],
  "shadow-chip": [[24, 50, -12, "color-shadow", 0.6]],
  "shadow-panel": [
    [-2, 8, 0, "color-surface-inverse", 0.04],
    [18, 40, -12, "color-surface-inverse", 0.28],
    [40, 80, -24, "color-surface-inverse", 0.3],
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
    usage: "Homepage hero only, in `color-text-heading`.",
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
    usage: "Section heads, in `color-text-heading`.",
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
      "Sub-section and panel heads; `color-text-inverse` on dark. There is no h7.",
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
      "Stat badge values: `color-accent-inverse` or `color-accent-inverse-performance` on `color-surface-inverse`, `color-text-muted` on light; newsletter title.",
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
    usage: "Product names in a catalog card, in `color-text-heading`.",
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
      "Card titles, sentence case, in `color-text-heading` — body face, not the display face.",
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
    usage: "Lead under an h1 or h2, in `color-text-body`.",
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
    usage: "Running prose, in `color-text-body`.",
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
    usage: "Nav, buttons and list rows, in `color-text-ui`.",
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
    usage: "Eyebrows: ALL CAPS, in `color-action-text`.",
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
    usage: "Badge sublabels and nano meta labels (`color-text-muted`).",
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
  ["color-text-heading", "color-surface-page"],
  ["color-text-strong", "color-surface-page"],
  ["color-text-body", "color-surface-page"],
  ["color-text-body", "color-surface-subtle"],
  ["color-text-ui", "color-surface-page"],
  ["color-text-muted", "color-surface-page"],
  ["color-text-muted", "color-surface-subtle"],
  ["color-action-text", "color-surface-page"],
  ["color-action-text", "color-surface-tint"],
  ["color-action-text", "color-surface-card"],
  ["color-action-text", "color-surface-subtle"],
  ["color-action-on", "color-action-default"],
  ["color-action-on", "color-action-fill-hover"],
  ["color-text-muted", "color-surface-card"],
  ["color-text-muted", "color-surface-tint"],
  ["color-link-utility", "color-surface-page"],
  ["color-link-utility", "color-surface-subtle"],
  ["color-link-utility-hover", "color-surface-page"],
  ["color-link-inverse-hover", "color-surface-inverse"],
  ["color-action-hover", "color-surface-page"],
  ["color-text-inverse", "color-surface-inverse"],
  ["color-text-inverse-muted", "color-surface-inverse"],
  ["color-accent-inverse", "color-surface-inverse"],
  ["color-accent-inverse-performance", "color-surface-inverse"],
  ["color-link-inverse", "color-surface-inverse"],
  ["color-focus-inverse", "color-surface-inverse"],
  ["footer-link", "color-surface-inverse-raised"],
  ["footer-text", "color-surface-inverse-raised"],
  ["footer-strong", "color-surface-inverse-raised"],
  ["footer-heading", "color-surface-inverse-raised"],
  ["footer-icon", "color-surface-inverse-raised"],
  ["color-feedback-error-inverse", "color-surface-inverse-raised"],
  ["badge-bundle-color", "badge-bundle-background"],
  ["badge-oss-color", "color-surface-page"],
  ["badge-new-color", "color-surface-page"],
  ["badge-updated-color", "color-surface-page"],
  ["badge-preview-color", "color-surface-page"],
  ["badge-premium-color", "color-surface-page"],
  ["color-feedback-success-default", "color-surface-page"],
  ["color-feedback-info-default", "color-surface-page"],
  ["color-feedback-info-default", "color-surface-tint"],
  ["color-feedback-success-inverse", "color-surface-inverse", 3],
  ["color-feedback-warning-inverse", "color-surface-inverse"],
  ["color-feedback-info-inverse", "color-surface-inverse"],
  ["color-feedback-warning-default", "color-surface-page"],
  ["table-mark-yes-color", "table-mark-yes-background"],
  ["table-mark-partial-color", "table-mark-partial-background"],
  ["table-mark-no-color", "table-mark-no-background"],
  ["table-header-sub-color", "color-surface-inverse"],
  ["table-header-sub-highlight-color", "color-action-default"],
  ["table-header-detail-color", "color-surface-inverse"],
  ["color-icon-subtle", "color-surface-page", 1],
  ["color-border-control", "color-surface-page", 3],
  ["color-focus-inverse", "color-surface-inverse", 3],
  ["color-action-default", "color-surface-page", 1],
  ["color-feedback-error-default", "color-surface-page"],
  ["color-feedback-error-default", "color-surface-subtle"],
  ["color-focus-default", "color-surface-page", 3],
  ["color-text-ui", "color-surface-subtle"],
  ["color-text-body", "color-surface-muted"],
];
