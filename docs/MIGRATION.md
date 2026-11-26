# Migration guide

What to change in a site when it moves to a new major version. A minor or a patch version needs no change. Each major version has a section here, the newest first; [the changelog](../CHANGELOG.md) lists everything each version changes. A site that adopts the design system for the first time starts with [Moving a site onto the design system](ADOPTING.md).

## From the prototype to 1.0

The token names of the first design system prototype and their replacements. A site that never used the prototype skips this section. Nothing from the old names is kept: no aliases, no deprecated files.

### Naming convention

Three tiers, role-based names, no colour words in semantic names (the three `window-dot-*` tokens are the exception).

1. **Raw** (`--ig-*`): engine steps, for example `--ig-primary-600`, `--ig-gray-200`. Only the semantic tier points at them.
2. **Semantic** (`--igd-color-*`, `--igd-space-*`, `--igd-radius-*`, `--igd-size-*`, `--igd-shadow-*`, `--igd-font-weight-*`, `--igd-opacity-*`, `--igd-z-index-*`, `--igd-breakpoint-*`): what a value is for. Use these in product code.
3. **Component** (`--igd-footer-*`, `--igd-table-*`, `--igd-fw-*`, `--igd-badge-*`, `--igd-tile-*`, `--igd-callout-*`): a decision made for one component, defined from the semantic tier.

Colour names read `color-{property}-{job}-{emphasis}-{state}`, the property being `foreground`, `background`, `border`, `focus` or `accent`: `color-background-action`, `color-foreground-link-hover`, `color-foreground-faint`, `color-background-tint`, `color-border-control`, `color-foreground-error`.

### Spacing scale

The 25-step scale collapsed to 12 engine steps, and the steps are now named by size (`3xs` to `6xl`), not by pixel value, because the live value follows `--ig-spacing` and `--ig-size`. Steps that sat one or two pixels apart merged into their nearest neighbour. Components do not use the steps directly for padding, margins and gaps: they use the roles `--igd-space-inset-*`, `--igd-space-stack-*` and `--igd-space-gap-*`.

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

The other renames, by kind:

### Colour

| Before | Now |
|---|---|
| `--ig-blue` | `--igd-color-accent-brand` |
| `--ig-blue-hover` | `--igd-color-accent-brand-hover` |
| `--ig-blue-press` | `--igd-color-accent-brand-active` |
| `--ig-violet` | `--igd-color-accent-ai` |
| `--ig-sky` | `--igd-color-accent-inverse-1` |
| `--ig-teal` | `--igd-color-accent-inverse-2` |
| `--action` | `--igd-color-background-action` |
| `--action-hover` | `--igd-color-foreground-link-hover` |
| `--action-hover-fill` | `--igd-color-background-action-hover` |
| `--action-press` | `--igd-color-foreground-link-hover` |
| `--on-action` | `--igd-color-foreground-on-action` |
| `--action-soft` | `--igd-color-background-tint` |
| `--action-soft-border` | `--igd-color-border-action` |
| `--utility-link` | `--igd-color-foreground-link` |
| `--utility-link-hover` | `--igd-color-foreground-link-hover` |
| `--link-on-dark` | `--igd-color-foreground-link-inverse` |
| `--link-on-dark-hover` | `--igd-color-foreground-link-inverse-hover` |
| `--link-footer` | `--igd-footer-link-foreground` |
| `--link-footer-hover` | `--igd-color-foreground-inverse` |
| `--focus-ring` | `--igd-color-focus-ring` |
| `--focus-ring-dark` | `--igd-color-focus-ring-inverse` |
| `--ink` | `--igd-color-foreground-heading` |
| `--text-strong` | `--igd-color-foreground-default` |
| `--text-body` | `--igd-color-foreground-subtle` |
| `--text-body-alt` | `--igd-color-foreground-control` |
| `--text-muted` | `--igd-color-foreground-faint` |
| `--text-utility` | `--igd-color-foreground-subtle` |
| `--text-eyebrow` | `--igd-color-background-action` |
| `--text-on-dark` | `--igd-color-foreground-inverse` |
| `--text-on-dark-muted` | `--igd-color-foreground-inverse-faint` |
| `--text-label` | `--igd-color-foreground-faint` |
| `--text-card-body` | `--igd-color-foreground-faint` |
| `--text-count` | `--igd-color-foreground-faint` |
| `--text-chevron` | `--igd-color-foreground-decorative` |
| `--text-error-on-dark` | `--igd-color-foreground-error-inverse` |
| `--surface-page` | `--igd-color-background-page` |
| `--surface-hero-top` | `--igd-color-background-subtle` |
| `--surface-band` | `--igd-color-background-subtle` |
| `--surface-chrome` | `--igd-color-background-subtle` |
| `--surface-callout` | `--igd-color-background-subtle` |
| `--surface-chip` | `--igd-color-background-subtle` |
| `--surface-card` | `--igd-color-background-card` |
| `--surface-tint` | `--igd-color-background-tint` |
| `--surface-catalog` | `--igd-color-background-tint` |
| `--surface-release` | `--igd-color-background-tint` |
| `--surface-mono` | `--igd-color-background-tint` |
| `--surface-release-hover` | `--igd-color-background-tint-strong` |
| `--surface-soon` | `--igd-color-background-subtle` |
| `--surface-dark` | `--igd-color-background-inverse` |
| `--border` | `--igd-color-border-default` |
| `--border-subtle` | `--igd-color-border-subtle` |
| `--border-tint` | `--igd-color-border-default` |
| `--border-chip` | `--igd-color-border-default` |
| `--border-blue` | `--igd-color-border-action` |
| `--border-outline` | `--igd-color-border-action` |
| `--emphasis-border` | `--igd-release-strip-border` |
| `--emphasis-ring` | `--igd-release-strip-ring` |
| `--emphasis-ring-hover` | `--igd-release-strip-ring-hover` |
| `--scrim` | `--igd-color-background-scrim` |
| `--surface-nav` | `--igd-nav-background` |
| `--footer-bg` | `--igd-footer-background` |
| `--footer-field` | `--igd-footer-field-background` |
| `--footer-field-pill` | `--igd-footer-field-inline-background` |
| `--footer-check-bg` | `--igd-footer-check-background` |
| `--footer-soc-hover-bg` | `--igd-footer-social-background-hover` |
| `--footer-soc-hover-border` | `--igd-footer-social-border-hover` |
| `--footer-card-fill` | `--igd-footer-card-background` |
| `--footer-bg-gradient` | `--igd-footer-background-gradient` |
| `--badge-bundle-bg` | `--igd-badge-bundle-background` |
| `--badge-bundle-fg` | `--igd-badge-bundle-foreground` |
| `--badge-oss-bg` | `--igd-badge-oss-background` |
| `--badge-oss-fg` | `--igd-badge-oss-foreground` |
| `--badge-yes-bg` | `--igd-table-mark-yes-background` |
| `--badge-yes-fg` | `--igd-table-mark-yes-foreground` |
| `--badge-warn-bg` | `--igd-table-mark-partial-background` |
| `--badge-warn-fg` | `--igd-table-mark-partial-foreground` |
| `--badge-no-bg` | `--igd-table-mark-no-background` |
| `--badge-no-fg` | `--igd-table-mark-no-foreground` |
| `--table-head-sub` | `--igd-table-header-sub-foreground` |
| `--table-head-sub-ours` | `--igd-table-header-sub-foreground-highlighted` |
| `--table-head-detail` | `--igd-table-header-detail-foreground` |
| `--fw-angular-bg` | `--igd-color-background-card` |
| `--fw-react-bg` | `--igd-color-background-card` |
| `--fw-wc-bg` | `--igd-color-background-card` |
| `--fw-wc-border` | `--igd-color-border-default` |
| `--fw-winforms-bg` | `--igd-color-background-card` |
| `--fw-blazor-bg` | `--igd-color-background-card` |
| `--fw-wpf-bg` | `--igd-color-background-card` |

### Size and layout

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
| `--bp-sm` | `--igd-breakpoint-sm` |
| `--bp-md` | `--igd-breakpoint-md` |
| `--bp-lg` | `--igd-breakpoint-lg` |
| `--bp-xl` | `--igd-breakpoint-xl` |
| `--gutter` | `--igd-container-gutter` |
| `--grid-split` | `--igd-layout-split` |

### Radius

| Before | Now |
|---|---|
| `--radius-pill` | `--igd-radius-action` |
| `--radius-flare` | `--igd-nav-panel-radius` |
| `--radius-lg` | `--igd-radius-card-featured` |
| `--radius-card` | `--igd-radius-card` |
| `--radius-media` | `--igd-radius-card` |
| `--radius-tile` | `--igd-radius-tile` |
| `--radius-link` | `--igd-radius-tile` |
| `--radius-mono` | `--igd-radius-badge` |
| `--radius-badge` | `--igd-radius-control` |
| `--radius-check` | `--igd-radius-control` |

### Weight and letter spacing

| Before | Now |
|---|---|
| `--weight-regular` | `--igd-font-weight-regular` |
| `--weight-medium` | `--igd-font-weight-medium` |
| `--weight-semibold` | `--igd-font-weight-semibold` |
| `--weight-bold` | `--igd-font-weight-bold` |
| `--weight-extrabold` | `--igd-font-weight-extrabold` |
| `--weight-black` | `--igd-font-weight-black` |
| `--tracking-label` | `--igd-letter-spacing-label` |
| `--tracking-badge` | `--igd-letter-spacing-badge` |
| `--tracking-mono` | `--igd-letter-spacing-mono` |

### Motion

| Before | Now |
|---|---|
| `--dur-chip` | `--igd-duration-chip` |
| `--dur-fast` | `--igd-duration-fast` |
| `--dur-button` | `--igd-duration-button` |
| `--dur-slow` | `--igd-duration-slow` |
| `--dur-float` | `--igd-duration-float` |
| `--ease` | `--igd-easing-default` |
| `--transition` | `--igd-transition-default` |

### Layers

| Before | Now |
|---|---|
| `--z-base` | `--igd-z-index-base` |
| `--z-raised` | `--igd-z-index-raised` |
| `--z-media` | `--igd-z-index-media` |
| `--z-lift` | `--igd-z-index-lift` |
| `--z-sticky` | `--igd-z-index-sticky` |
| `--z-nav` | `--igd-z-index-nav` |
| `--z-panel` | `--igd-z-index-panel` |
| `--z-overlay` | `--igd-z-index-overlay` |

### Shadow and effects

| Before | Now |
|---|---|
| `--blur-nav` | `--igd-nav-backdrop-blur` |
| `--emphasis-fill` | `--igd-gradient-emphasis` |
| `--border-gradient-bundle` | `--igd-gradient-border-bundle` |
| `--shadow-card` | `--igd-shadow-none` |
| `--shadow-catalog-card` | `--igd-shadow-none` |
| `--shadow-card-hover` | `--igd-shadow-card-hover` |
| `--shadow-cta` | `--igd-shadow-action-lg` |
| `--shadow-cta-hover` | `--igd-shadow-action-lg` |
| `--shadow-pill-hover` | `--igd-shadow-action-sm` |
| `--shadow-media` | `--igd-shadow-screenshot` |
| `--shadow-badge` | `--igd-shadow-floating` |
| `--shadow-bundle` | `--igd-shadow-action-md` |
| `--shadow-release` | `--igd-callout-release-shadow` |
| `--shadow-release-hover` | `--igd-callout-release-shadow-hover` |
| `--shadow-panel-filter` | `--igd-shadow-popover-filter` |

### Type styles

A type style is named for its role. The class is `.igd-type-{role}` and its variables are `--igd-type-{role}-{font-family|font-size|font-weight|line-height|letter-spacing|text-transform}`. Line height is a unitless multiple of the font size.

| Before | Now | Engine slot |
|---|---|---|
| `display-h1` | `.igd-type-display-lg` | `h1` |
| `display-h2` | `.igd-type-display-md` | `h2` |
| `display-h3` | `.igd-type-display-sm` | `h3` |
| `display-stat` | `.igd-type-stat` | `h4` |
| `product-name` | `.igd-type-title-md` | `h5` |
| `card-title` | `.igd-type-title-sm` | `h6` |
| `body-lead` | `.igd-type-lead` | `subtitle-1` |
| `callout-title` | `.igd-type-label-lg` | `subtitle-2` |
| `body-text` | `.igd-type-body-lg` | `body-1` |
| `body-ui` | `.igd-type-body-md` | `body-2` |
| `button` | `.igd-type-label-md` | `button` |
| `body-caption` | `.igd-type-body-sm` | `caption` |
| `eyebrow` | `.igd-type-eyebrow` | `overline` |
| `body-micro` | `.igd-type-body-xs` | none |
| `body-nano` | `.igd-type-body-2xs` | none |
