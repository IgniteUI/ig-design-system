# Infragistics design system

One source for the look of infragistics.com: colours, type, spacing, roundness and elevation as design tokens, plus the automatic checks that keep every site consistent. The tokens are generated with [igniteui-theming](https://github.com/IgniteUI/igniteui-theming), the same engine Ignite UI customers use.

> **Status: proof of concept.** This repository is a temporary home while its final organisation is decided. The package is marked `private` and has no licence yet. Names and structure may still change.

## What is in the package

Everything a site needs is in `dist/`. There is no framework code in it, so any site can use it, whatever it is built with.

| File | What it is |
|---|---|
| `dist/tokens.css` | Every token as a CSS custom property, with its default value. Load it first. |
| `dist/theme.css` | The live layer: tokens that follow the theming dials, state colours derived from their base token, the dark theme, type classes and base styles. Load it second. |
| `dist/tokens.json` | The token source: names, values and what each token is for. |
| `dist/infragistics.tokens.json` | The same tokens in the Design Tokens Community Group format (2025.10), for design tools and native platforms. |
| `dist/fonts/` | Plus Jakarta Sans, DM Sans and JetBrains Mono (variable, Latin). |

```html
<link rel="stylesheet" href="dist/tokens.css">
<link rel="stylesheet" href="dist/theme.css">
```

```css
.promo-button {
  background: var(--igd-color-action-default);
  color: var(--igd-color-action-on);
  padding: var(--igd-space-inset-sm) var(--igd-space-inset-xl);
  border-radius: var(--igd-radius-full);
}
.promo-button:hover { background: var(--igd-color-action-fill-hover); }
```

## Token tiers

| Tier | Prefix | Who uses it |
|---|---|---|
| Raw | `--ig-*` | Engine output, under the engine's own names: palette steps, seeds, elevations, type slots and the theming dials. Only the design system reaches in here. |
| Semantic | `--igd-color-*`, `--igd-space-*`, `--igd-radius-*`, `--igd-size-*`, `--igd-shadow-*`, … | Site code uses these. The name says what the value is for. |
| Component | `--igd-footer-*`, `--igd-nav-*`, `--igd-table-*`, … | One component's own choice, built from the semantic tier. |

Every token the design system defines is published as `--igd-*`, so it cannot collide with a site's own custom properties. Engine output keeps `--ig-*`. An Ignite UI component on the same page reads the same names, so the page has one palette and one set of dials (`--ig-size`, `--ig-spacing`, `--ig-radius-factor`, `--ig-elevation-factor`). The package declares every custom property the engine's `palette()` emits for the light palette, under the engine's names: the shades, the accent shades (`--ig-primary-A100`), the surface shades and roles, the seeds, and a `*-contrast` variable for each. So an Ignite UI component finds its palette colours here. A component still needs its own component theme and typography from Ignite UI. The generator works in bare names and `src/namespace.ts` applies the published prefix as the last build step.

Token names in `tokens.json` and in the DTCG file carry no prefix: the prefix belongs to CSS.

**Accent and dark palettes.** Five more palettes are built with the engine: pink, cyan, sky and teal for accent colours, and a dark palette for the dark theme and for the areas that stay dark in both themes. Their ramps are not published. A token that uses a step carries the colour itself (`--igd-tile-3: #e23b8f`), and its description names the step. The theme reads 6 colours from the four accent palettes and 9 steps of the dark ramps outside the dark theme, so publishing 64 variables was not worth their size. They are still built, not typed in, because each colour in use is a step the engine solved for contrast, not a seed.

The classes and keyframes the package defines follow the same rule: `.igd-type-h1` … `.igd-type-detail-2` for the 15 type styles, `.igd-hide-below-md`, and the `igd-float` and `igd-app-shimmer` keyframes.

**Colour** names follow `color-{role}-{variant}-{state}`, for example `color-action-default` (`--igd-color-action-default` in CSS), `color-text-muted`, `color-surface-tint`. No semantic or component name carries a hue: the accents are `color-accent-primary`, `-secondary`, `-inverse` and `-inverse-alt`, the icon tile fills are `tile-1` … `tile-8`, and the glows take the name of the accent they derive from. A hue appears only in the raw tier, where the name says what the value is. Use `color-action-default` for fills and `color-action-text` for anything drawn on a surface (links, outline labels, focus rings).

**Spacing** has two tiers. The steps are `space-3xs` … `space-6xl`; the name is a size, not a pixel value, because the live value follows the spacing and size dials. On top of them sit three roles, and these are what components use:

- `space-inset-{size}` for padding
- `space-stack-{size}` for vertical margins
- `space-gap-{size}` for gaps and inline margins

## Theming

Set a dial on the root, or on any element, and every token below it follows.

| Dial | Values |
|---|---|
| `--ig-size` | 1 small, 2 medium, 3 large (default) |
| `--ig-spacing` | multiplier, default 1 |
| `--ig-radius-factor` | unset by default (each role takes its design value); 0 is each role's minimum, 1 its maximum |
| `--ig-elevation-factor` | multiplier, default 1 |
| `data-theme="dark"` | the dark theme, on the page or on one region |
| `data-ig-scope` | a region that carries its own base colours |

**Brand colours.** The brand colours are a build input. The seeds live in `src/palette-sets.ts` (primary `#155dfc`, secondary `#9810fa`, info `#0099ff`); change one, run `npm run palettes` and `npm run build`, and the engine solves the whole ramp again for contrast. Nothing re-derives a ramp in the browser. The action colour used as text keeps the seed while the seed clears 4.5:1 on the light surfaces, and is darkened to the first primary step that does otherwise. `tokens.css` publishes that darkened colour. The label on the action fill is black or white, whichever reads on the seed. A primary seed below 3:1 against the page stops the build with a message, because a filled control would not stand out.

**Derived colours.** Hover, active, focus, tint and shadow colours are computed from their base token, so nobody picks them by hand. Override a base token, on the page or on a `data-ig-scope` region, and its states follow. The action colour used as text or as an outline is adjusted in lightness where it would be too light (or, in the dark theme, too dark) to read. Fills keep the exact colour with a black or white label.

**Dark theme.** Built from the engine's dark palette. `[data-theme="dark"]` gives the engine's gray shades and surface roles their dark-palette values; every semantic name keeps its meaning.

**Dark areas.** An area that is dark in both themes uses the inverse surfaces: `color-surface-inverse-raised` (lightest), `color-surface-inverse` and `color-surface-inverse-sunken` (darkest), with `color-text-inverse` on top.

## Checks

`npm run check` runs all of them. A failure exits non-zero, so CI stops.

| Check | What it stops |
|---|---|
| `checks/lint.ts` | A hand-typed colour, size, duration or easing in a component source |
| `checks/check-vars.ts` | A `var()` that points at a token that does not exist |
| `checks/spacing-roles.ts` | A raw spacing step used for padding, a margin or a gap |
| `checks/gates-derived.ts` | A hover, focus or active colour that is not derived from its base, or a derived token that drifts from the engine's value |
| `checks/gates-themes.ts` | Any of 58 colour pairings below WCAG AA, measured in a browser in the light and the dark theme |

The rules of the three source checks and the functions of the generator have unit tests in `src/*.test.ts` and `checks/*.test.ts`. Each script exports its functions and does its file work only when it is the script Node was started with.

Today the checks run against the reference components in this repository. Packaging them as one command that any consuming repository can run on its own code is the next step.

## Repository layout

```
src/         the generator: spec.ts (the vocabulary), make.ts (builds dist/), namespace.ts (applies the --igd- prefix), dtcg.ts, types.ts (the shape of tokens.json)
checks/      the checks listed above
dist/        the generated package (committed, so a site can use it without building)
reports/     contrast and derived-colour reports from the last build
reference/   React reference components and their stylesheet. They prove the tokens and feed the checks; they are not part of the package
docs/        MIGRATION.md: old token names to new ones
AGENTS.md    the decisions behind the code and the reason for each
```

To change a token, edit `src/spec.ts` (or the generator) and rebuild. The tables in `spec.ts` are typed, so a value in the wrong slot or an unknown opacity name fails `npm run typecheck`. Never edit `dist/` by hand; CI fails if `dist/` does not match the source.

## Build

Requires Node 22.18 or newer. The generator and the checks are TypeScript and Node runs them directly, with no build step. The sources use erasable syntax only (no `enum`, no `namespace`, no parameter properties) and import each other with the `.ts` extension.

```sh
npm ci
npx playwright install chromium   # the contrast checks measure real rendered colours
npm test                          # type check, lint, build, unit tests, then every check
npm run test:unit                 # Vitest: the unit tests next to the sources (`*.test.ts`)
npm run lint                      # Biome: format and lint rules, no changes written
npm run format                    # Biome: write the format and the safe lint fixes
```

`src/palettes.json` holds the compiled engine palettes: the raw colour of every shade, as hex. `npm run palettes` regenerates it from the seed colours in `src/palette-sets.ts` with Sass alone.

The generator takes its numbers from the engine: `palette()` for the colours, `contrast()` for the ratios quoted in the token notes, `adaptive-contrast()` for the contrast variables, `typography()`, `elevations()`, `pad()`, `sizable()` and `border-radius()` for the rest.

## Open items

- Home organisation, licence and public package name
- The checks as one installable command for consuming repositories
- A reduced-motion, focus and target-size check (it exists for the reference components, but depends on a showcase page that is not in this repository yet)
