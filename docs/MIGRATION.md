# Migration guide

This release is a clean break. The system now sits on the **igniteui-theming** engine, token names follow a three-tier convention, and nothing from the previous names is kept: no aliases, no deprecated files. This page lists every rename so a consumer can migrate with search-and-replace.

## 1. What changed

| Area | Before | Now |
|---|---|---|
| Palette, type, spacing, size, radius, elevation | Hand-picked literals | Engine output (`palette()`, `typography()`, `pad()`, `sizable()`, `border-radius()`, indigo elevations) |
| Token names | `--ig-blue`, `--text-muted`, `--space-6`, `--ig-t-…` | `--igd-color-{role}-{variant}-{state}`, `--igd-space-{size}`, `--igd-radius-{step}`, `--igd-shadow-{role}`, `--igd-type-{slot}-…` |
| Component styling | Inline literals and JS hover state | Tokens only; hover, focus, disabled, invalid and loading are CSS |
| Icons | An inline `<svg>` per component | One `Icon` component with stroke and size tokens |
| Forms | A bespoke input and checkbox inside the footer | `TextField` and `Checkbox` components |
| Entry points | `styles.css` importing `tokens/*.css` | `tokens.css` + `theme.css` |

Re-theming: set `--ig-size` (1 small, 2 medium, 3 large), `--ig-spacing`, `--ig-radius-factor` or `--ig-elevation-factor` on the root and every token follows.

## 2. Naming convention

Three tiers, role-based names, no colour words in semantic names.

1. **Raw** (`--ig-*`): engine steps, for example `--ig-primary-600`, `--ig-gray-200`. Only the semantic tier points at them.
2. **Semantic** (`--igd-color-*`, `--igd-space-*`, `--igd-radius-*`, `--igd-size-*`, `--igd-shadow-*`, `--igd-font-weight-*`, `--igd-opacity-*`, `--igd-z-index-*`, `--igd-breakpoint-*`): what a value is for. Use these in product code.
3. **Component** (`--igd-footer-*`, `--igd-table-*`, `--igd-fw-*`, `--igd-badge-*`, `--igd-tile-*`, `--igd-callout-*`): a decision made for one component, defined from the semantic tier.

Colour roles read `color-{role}-{variant}-{state}`: `color-action-default`, `color-action-hover`, `color-text-muted`, `color-surface-tint`, `color-border-control`, `color-feedback-error-default`.

## 3. Spacing scale

The 25-step scale collapsed to 12 engine steps, and the steps are now named by size (`3xs` to `6xl`), not by pixel value, because the live value follows `--ig-spacing` and `--ig-size`. Steps that sat one or two pixels apart merged into their nearest neighbour. Components do not use the steps directly for padding, margins and gaps: they use the roles `--space-inset-*`, `--space-stack-*` and `--space-gap-*`.

| Before | Now |
|---|---|
| `--space-2` | `--igd-space-3xs` |
| `--space-4` | `--igd-space-2xs` |
| `--space-6` | `--igd-space-xs` |
| `--space-8` | `--igd-space-xs` |
| `--space-10` | `--igd-space-xs` |
| `--space-12` | `--igd-space-sm` |
| `--space-14` | `--igd-space-sm` |
| `--space-16` | `--igd-space-md` |
| `--space-18` | `--igd-space-md` |
| `--space-20` | `--igd-space-lg` |
| `--space-22` | `--igd-space-xl` |
| `--space-24` | `--igd-space-xl` |
| `--space-26` | `--igd-space-xl` |
| `--space-28` | `--igd-space-2xl` |
| `--space-30` | `--igd-space-2xl` |
| `--space-32` | `--igd-space-2xl` |
| `--space-34` | `--igd-space-2xl` |
| `--space-36` | `--igd-space-3xl` |
| `--space-40` | `--igd-space-3xl` |
| `--space-44` | `--igd-space-4xl` |
| `--space-48` | `--igd-space-4xl` |
| `--space-52` | `--igd-space-4xl` |
| `--space-56` | `--igd-space-5xl` |
| `--space-64` | `--igd-space-5xl` |
| `--space-104` | `--igd-space-6xl` |

In a component, pick the role for the property: padding → `--igd-space-inset-{size}`, vertical margins → `--igd-space-stack-{size}`, gap and inline margins → `--igd-space-gap-{size}`.

## 4. Token renames

### Colour

| Before | Now |
|---|---|
| `--ig-blue` | `--igd-color-accent-primary` |
| `--ig-blue-hover` | `--igd-color-accent-primary-hover` |
| `--ig-blue-press` | `--igd-color-accent-primary-active` |
| `--ig-violet` | `--igd-color-accent-secondary` |
| `--ig-sky` | `--igd-color-accent-inverse` |
| `--ig-teal` | `--igd-color-accent-inverse-alt` |
| `--action` | `--igd-color-action-default` |
| `--action-hover` | `--igd-color-action-hover` |
| `--action-hover-fill` | `--igd-color-action-fill-hover` |
| `--action-press` | `--igd-color-action-active` |
| `--on-action` | `--igd-color-action-on` |
| `--action-soft` | `--igd-color-action-subtle` |
| `--action-soft-border` | `--igd-color-action-subtle-border` |
| `--utility-link` | `--igd-color-link-utility` |
| `--utility-link-hover` | `--igd-color-link-utility-hover` |
| `--link-on-dark` | `--igd-color-link-inverse` |
| `--link-on-dark-hover` | `--igd-color-link-inverse-hover` |
| `--link-footer` | `--igd-footer-link` |
| `--link-footer-hover` | `--igd-footer-link-hover` |
| `--focus-ring` | `--igd-color-focus-default` |
| `--focus-ring-dark` | `--igd-color-focus-inverse` |
| `--ink` | `--igd-color-text-heading` |
| `--text-strong` | `--igd-color-text-primary` |
| `--text-body` | `--igd-color-text-secondary` |
| `--text-body-alt` | `--igd-color-text-ui` |
| `--text-muted` | `--igd-color-text-muted` |
| `--text-utility` | `--igd-color-text-secondary` |
| `--text-eyebrow` | `--igd-color-action-default` |
| `--text-on-dark` | `--igd-color-text-inverse` |
| `--text-on-dark-muted` | `--igd-color-text-inverse-muted` |
| `--text-label` | `--igd-color-text-muted` |
| `--text-card-body` | `--igd-color-text-muted` |
| `--text-count` | `--igd-color-text-muted` |
| `--text-chevron` | `--igd-color-icon-subtle` |
| `--text-error-on-dark` | `--igd-color-feedback-error-inverse` |
| `--surface-page` | `--igd-color-surface-page` |
| `--surface-hero-top` | `--igd-color-surface-hero` |
| `--surface-band` | `--igd-color-surface-subtle` |
| `--surface-chrome` | `--igd-color-surface-subtle` |
| `--surface-callout` | `--igd-color-surface-subtle` |
| `--surface-chip` | `--igd-color-surface-subtle` |
| `--surface-card` | `--igd-color-surface-card` |
| `--surface-tint` | `--igd-color-surface-tint` |
| `--surface-catalog` | `--igd-color-surface-tint` |
| `--surface-release` | `--igd-color-surface-tint` |
| `--surface-mono` | `--igd-color-surface-tint` |
| `--surface-release-hover` | `--igd-color-surface-tint-strong` |
| `--surface-soon` | `--igd-color-surface-muted` |
| `--surface-dark` | `--igd-color-surface-inverse` |
| `--border` | `--igd-color-border-default` |
| `--border-subtle` | `--igd-color-border-subtle` |
| `--border-tint` | `--igd-color-border-default` |
| `--border-chip` | `--igd-color-border-default` |
| `--border-blue` | `--igd-color-border-accent` |
| `--border-outline` | `--igd-color-border-accent` |
| `--emphasis-border` | `--igd-color-emphasis-border` |
| `--emphasis-ring` | `--igd-color-emphasis-ring` |
| `--emphasis-ring-hover` | `--igd-color-emphasis-ring-hover` |
| `--scrim` | `--igd-color-overlay-scrim` |
| `--surface-nav` | `--igd-nav-background` |
| `--footer-bg` | `--igd-footer-background` |
| `--footer-field` | `--igd-footer-field-background` |
| `--footer-field-pill` | `--igd-footer-field-pill-background` |
| `--footer-check-bg` | `--igd-footer-check-background` |
| `--footer-soc-hover-bg` | `--igd-footer-social-hover-background` |
| `--footer-soc-hover-border` | `--igd-footer-social-hover-border` |
| `--footer-card-fill` | `--igd-footer-card-background` |
| `--footer-bg-gradient` | `--igd-footer-background-gradient` |
| `--badge-bundle-bg` | `--igd-badge-bundle-background` |
| `--badge-bundle-fg` | `--igd-badge-bundle-color` |
| `--badge-oss-bg` | `--igd-badge-oss-background` |
| `--badge-oss-fg` | `--igd-badge-oss-color` |
| `--badge-yes-bg` | `--igd-table-mark-yes-background` |
| `--badge-yes-fg` | `--igd-table-mark-yes-color` |
| `--badge-warn-bg` | `--igd-table-mark-partial-background` |
| `--badge-warn-fg` | `--igd-table-mark-partial-color` |
| `--badge-no-bg` | `--igd-table-mark-no-background` |
| `--badge-no-fg` | `--igd-table-mark-no-color` |
| `--table-head-sub` | `--igd-table-header-sub-color` |
| `--table-head-sub-ours` | `--igd-table-header-sub-highlight-color` |
| `--table-head-detail` | `--igd-table-header-detail-color` |
| `--fw-angular-bg` | `--igd-fw-angular-background` |
| `--fw-react-bg` | `--igd-fw-react-background` |
| `--fw-wc-bg` | `--igd-fw-webcomponents-background` |
| `--fw-wc-border` | `--igd-fw-webcomponents-border` |
| `--fw-winforms-bg` | `--igd-fw-winforms-background` |
| `--fw-blazor-bg` | `--igd-fw-blazor-background` |
| `--fw-wpf-bg` | `--igd-fw-wpf-background` |

### Size, radius, border, typography, motion and everything else

| Before | Now |
|---|---|
| `--size-border` | `--igd-border-width-default` |
| `--size-border-strong` | `--igd-border-width-strong` |
| `--size-focus-ring` | `--igd-focus-ring-width` |
| `--size-focus-offset` | `--igd-focus-ring-offset` |
| `--size-dot` | `--igd-window-dot-size` |
| `--size-control-cta` | `--igd-size-control-md` |
| `--size-touch` | `--igd-size-control-xl` |
| `--size-nav` | `--igd-nav-height` |
| `--size-mono` | `--igd-badge-mono-size` |
| `--size-logo-fw` | `--igd-fw-logo-height` |
| `--size-logo-nav` | `--igd-logo-height` |
| `--size-logo-product` | `--igd-product-logo-height` |
| `--size-logo-max` | `--igd-product-logo-max-width` |
| `--size-badge-offset` | `--igd-stat-badge-offset` |
| `--size-badge-inset` | `--igd-stat-badge-inset` |
| `--size-glow-lg` | `--igd-glow-size-lg` |
| `--size-glow-md` | `--igd-glow-size-md` |
| `--size-field-min` | `--igd-field-min-width` |
| `--size-callout-min` | `--igd-callout-min-width` |
| `--size-callout-max` | `--igd-callout-max-width` |
| `--size-newsletter-min` | `--igd-newsletter-min-width` |
| `--size-footer-col-min` | `--igd-footer-column-min-width` |
| `--size-panel` | `--igd-nav-panel-max-width` |
| `--size-bleed` | `--igd-bleed-width` |
| `--container` | `--igd-container-max-width` |
| `--container-hero` | `--igd-container-hero-max-width` |
| `--container-prose` | `--igd-container-prose-max-width` |
| `--catalog-min` | `--igd-catalog-card-min-width` |
| `--radius-pill` | `--igd-radius-full` |
| `--radius-flare` | `--igd-nav-panel-radius` |
| `--radius-lg` | `--igd-radius-xl` |
| `--radius-card` | `--igd-radius-lg` |
| `--radius-media` | `--igd-radius-lg` |
| `--radius-tile` | `--igd-radius-md` |
| `--radius-link` | `--igd-radius-md` |
| `--radius-mono` | `--igd-radius-sm` |
| `--radius-badge` | `--igd-radius-xs` |
| `--radius-check` | `--igd-radius-xs` |
| `--weight-regular` | `--igd-font-weight-regular` |
| `--weight-medium` | `--igd-font-weight-medium` |
| `--weight-semibold` | `--igd-font-weight-semibold` |
| `--weight-bold` | `--igd-font-weight-bold` |
| `--weight-extrabold` | `--igd-font-weight-extrabold` |
| `--weight-black` | `--igd-font-weight-black` |
| `--tracking-label` | `--igd-letter-spacing-label` |
| `--tracking-badge` | `--igd-letter-spacing-badge` |
| `--tracking-mono` | `--igd-letter-spacing-mono` |
| `--dur-chip` | `--igd-duration-chip` |
| `--dur-fast` | `--igd-duration-fast` |
| `--dur-button` | `--igd-duration-button` |
| `--dur-slow` | `--igd-duration-slow` |
| `--dur-float` | `--igd-duration-float` |
| `--ease` | `--igd-easing-default` |
| `--transition` | `--igd-transition-default` |
| `--z-base` | `--igd-z-index-base` |
| `--z-raised` | `--igd-z-index-raised` |
| `--z-media` | `--igd-z-index-media` |
| `--z-lift` | `--igd-z-index-lift` |
| `--z-sticky` | `--igd-z-index-sticky` |
| `--z-nav` | `--igd-z-index-nav` |
| `--z-panel` | `--igd-z-index-panel` |
| `--z-overlay` | `--igd-z-index-overlay` |
| `--bp-sm` | `--igd-breakpoint-sm` |
| `--bp-md` | `--igd-breakpoint-md` |
| `--bp-lg` | `--igd-breakpoint-lg` |
| `--bp-xl` | `--igd-breakpoint-xl` |
| `--blur-nav` | `--igd-nav-backdrop-blur` |
| `--gutter` | `--igd-container-gutter` |
| `--grid-split` | `--igd-layout-split` |
| `--emphasis-fill` | `--igd-gradient-emphasis` |
| `--border-gradient-bundle` | `--igd-gradient-border-bundle` |
| `--shadow-card` | `--igd-shadow-none` |
| `--shadow-catalog-card` | `--igd-shadow-none` |
| `--shadow-card-hover` | `--igd-shadow-raised` |
| `--shadow-cta` | `--igd-shadow-accent-lg` |
| `--shadow-cta-hover` | `--igd-shadow-accent-lg` |
| `--shadow-pill-hover` | `--igd-shadow-accent-sm` |
| `--shadow-media` | `--igd-shadow-overlay` |
| `--shadow-badge` | `--igd-shadow-floating` |
| `--shadow-bundle` | `--igd-shadow-accent-md` |
| `--shadow-release` | `--igd-callout-release-shadow` |
| `--shadow-release-hover` | `--igd-callout-release-shadow-hover` |
| `--shadow-panel-filter` | `--igd-shadow-popover-filter` |

Type classes: `.ig-t-{slot}` → `.igd-type-{slot}`. Type variables: `--igd-type-{slot}-{font-size|font-weight|line-height|font-family}` follow the engine slot names (`h1`–`h6`, `subtitle-1`, `subtitle-2`, `body-1`, `body-2`, `button`, `caption`, `overline`, `detail-1`, `detail-2`).

## 5. Component API changes

| Component | Change |
|---|---|
| `Button` | New `loading` prop. `disabled` is now a documented state (`aria-disabled`, no hover response). Hover and focus are CSS. |
| `ArrowLink` | `color` (a CSS string) became `tone`: `action` \| `heading` \| `inverse`. `size` is `sm` \| `md` \| `lg` (engine type slots), not a number. |
| `IconTile` | `size` is a name (`tile`, `sm`, `md`, `lg`, `xl`), not a number. Numeric sizes were removed. |
| `FeatureCard` | `iconFill` was removed (it did nothing). Hover lift is CSS and also fires on keyboard focus. |
| `StatBadge` | `duration` still sets seconds and now overrides `--duration-float`. |
| `NavBar` | `panelWidth` is a CSS length (default `var(--igd-nav-panel-max-width)`), not a number. |
| `CalloutStrip`, `PlatformChip`, `FrameworkPill`, `NavLink` | Hover and focus moved to CSS; no prop changes. |
| `SiteFooter` | The newsletter block is built from `TextField`, `Button` and `Checkbox`. Props unchanged. |
| New | `Icon`, `TextField`, `Checkbox` |

## 6. Removed

These no longer exist and have no replacement file:

- `styles.css` and `tokens/{base,colors,effects,fonts,spacing,typography}.css` (use `tokens.css` and `theme.css`)
- `ui_kits/`, `templates/` (site navigation, marketing page, blog header), `guidelines/`, `*.card.html`
- The standalone and single-file HTML exports, `archived/`, `migration-map.json`, `_ds_manifest.json`, `_ds_bundle.js`
- `assets/asset-remap.js` and `assets/notes/`
- Per-group prompt files and per-component `.d.ts`: props live in `components/index.d.ts`, guidance in `components/<Name>/README.md`
- The old W3C-format token export: `tokens.json` is the single token source

## 7. Checklist

1. Replace names using the tables above (longest names first).
2. Replace `styles.css` with `tokens.css` then `theme.css`.
3. Replace numeric `IconTile` and `ArrowLink` sizes; drop `iconFill`.
4. Drop any local hover state you layered on a component: the CSS covers it.
5. Search for hard-coded hex, px and ms in your own code; map each to a token or ask for one.
