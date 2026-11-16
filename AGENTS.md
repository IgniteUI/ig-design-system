# AGENTS.md

Guidance for an agent working in this repository. Read the README first; this file holds the decisions behind the code and the reason for each, so they are not undone by accident.

## Commands

```sh
npm ci
npx playwright install chromium   # the two browser gates measure rendered colours
npm test                          # type check, lint, build, unit tests, every check
npm run palettes                  # only after a seed or a scale changes
```

Node 22.18 or newer runs the `.ts` files directly. Do not add `tsx`: it rewrites the functions passed to Playwright's `page.evaluate` and the gates crash with `__name is not defined`.

`dist/`, `docs/` and `reports/` are generated and committed. Change `src/`, rebuild, commit the result. CI fails when `dist/` or `docs/` differ from a fresh build.

## Decisions

Do not reverse one of these without asking the owner.

### 1. `--ig-*` is the engine's namespace, `--igd-*` is ours

- A custom property is `--ig-*` only when `igniteui-theming` itself emits that exact name: the palette (`--ig-primary-500`, `--ig-primary-A100`, `--ig-primary-500-contrast`), the dials (`--ig-size`, `--ig-spacing`, `--ig-radius-factor`, `--ig-elevation-factor`), `--ig-elevation-<n>` and the type slot variables.
- The engine also emits `--ig-<name>-<step>` for a custom family built with its `shades()` function and passed to the `palette()` mixin. That is engine output too. The package publishes no custom family today.
- Everything the design system defines is `--igd-*`, in the semantic tier and in the component tier. The same goes for classes and keyframes: `.igd-type-display-lg`, `igd-float`.
- The generator works in bare names. `src/namespace.ts` adds `--igd-` as the last build step.

Why: an Ignite UI component on the same page reads the `--ig-*` names, so the page has one palette and one set of dials. A name the generator makes up under `--ig-`, such as the former `--ig-elevation-tint-<n>`, looks like engine API and is not.

### 2. The accent palettes and the dark palette are built, not published

- `src/palette-sets.ts` builds four extra palettes with the engine: pink, cyan, sky, teal.
- Their ramps are not in `dist/`. A token that uses a step carries the colour itself: `--igd-tile-3: #e23b8f`, not `var(--ig-pink-400)`.
- The spec still names the step (`"tile-3": ["ig-pink-400", …]`). That name is internal to the build.
- The dark palette is handled the same way. There is no `--ig-dark-gray-<n>` or `--ig-dark-surface-<n>` in `dist/`.
  - The dark theme sets the engine's own names: `[data-theme="dark"] { --ig-gray-500: #bcc1c9; }`. The engine does the same for a dark palette.
  - A token for an area that is dark in both themes carries the colour: `--igd-color-surface-inverse: #0f172a`. The spec names the step as `ig-dark-surface-500`.
- A dark area uses the three inverse surface levels, not a component's own colour: `color-surface-inverse-raised`, `color-surface-inverse`, `color-surface-inverse-sunken`. `footer-background` points at the last one.

Why: the theme reads 6 colours from the 4 accent palettes, so 40 published variables were not worth their size. The names were not the problem there: `--ig-pink-400` follows the pattern the engine uses for a custom family.

Why, for the dark palette: `--ig-dark-gray-<n>` was a name of ours. The engine emits a dark palette under the same names as a light one, `--ig-gray-<n>`, and a theme decides which values they hold.

Why the palettes are still built: none of the colours in use is a seed. Each is a step the engine solved for contrast. Pink `#ec4899` as text on white is about 3.5:1; step 500 (`#c42579`) clears 4.5:1. Typing in one colour per accent would drop that solving.

Considered and not done:
- The dark palette also has the engine's surface roles (`raised`, `sunken`, `overlay`). They are within a shade or two of the numeric steps the inverse surfaces use. Pointing the inverse surfaces at the roles would shift the footer's colours slightly, so it needs a design decision.
- The dark theme swaps the gray and surface ramps only. The engine's dark palette also re-solves the brand ramps against the dark surface; using those would change dark-theme colours.
- The engine's `shades($name, $color, $shades, $surface, $generator, $scale)` builds one family from a seed with any list of steps, two at least. With the ten steps `50` to `900` it gives the same 40 colours as the four full palettes. The owner decided to keep the `palette()` build.
- A shorter list of steps changes the colours. `shades()` places a step by its position in the list, not by the number in its name: `('400', '500')` returns the two ends of the ramp, `#fee6ec` and `#290a18` for the pink seed.

To add an accent colour: add a palette to `palette-sets.ts`, run `npm run palettes`, add the family to `ACCENT_STEP` and to `engineHex()` in `src/make.ts`, then alias a step in `src/spec.ts`.

### 3. Brand seeds are a build input

- The seeds live in `src/palette-sets.ts`. Changing one means `npm run palettes` and `npm run build`.
- There is no runtime seed change and no `seed.js`.
- A primary seed below 3:1 against the page stops the build. A seed that does not clear 4.5:1 as text is darkened for text, and `tokens.css` publishes the darkened colour.

Why: the engine solves each shade for contrast when Sass compiles. A ramp shifted in the browser is an approximation of that, and it cost a third of `theme.css`.

### 4. State colours are derived from their base token

- Hover, active, tint, border and shadow colours are computed from a base with `oklch(from var(--base) …)`. The deltas are measured at build time between two engine values, so the default equals the engine's colour.
- Override a base, on the page or on a `data-ig-scope` region, and its states follow.
- The darkening formula for text exists twice: `textExpr()` in `src/make.ts` for `theme.css`, and `as-text()` in the guard stylesheet for the published value. Change both.

Why: nobody picks a state colour by hand, and a region can carry its own colours.

### 5. A label on a fill is black or white, by the engine's `adaptive-contrast()`

- `color-action-on`, `tile-on` and `table-header-sub-highlight-color` use it.
- Do not switch to native CSS `contrast-color()` yet. It is Baseline only since April 2026; Safari on iOS 18 does not have it, and there the label would fall back to the inherited text colour. Revisit in late 2027.
- It does not apply to a brand colour used as text on a surface. That needs a darker version of the colour, not black or white.

### 6. Names carry a role, never a hue

- Semantic and component names have no colour word: `color-accent-primary`, `tile-1` … `tile-8`, `glow-inverse`.
- The `color-` category word stays on the semantic tier, so `color-border-default` cannot be mistaken for `border-width-default`.
- Token names in `tokens.json` and in the DTCG file carry no prefix. The prefix belongs to CSS.

Why: a seed can change, and a token called "blue" would then be another colour.

### 7. A type style is named for its role

- `src/spec.ts` lists 15 type styles. Each has a role name (`display-lg`, `title-sm`, `eyebrow`) and the engine slot that holds it.
- The class is `.igd-type-{role}` and its variables are `--igd-type-{role}-{property}`. A role reads its engine slot: `--igd-type-title-sm-font-size: var(--ig-h5-font-size)`.
- The engine has 13 type slots by default, and Ignite UI components read those 13. `body-xs` and `body-2xs` have none, so their variables hold the compiled values and no `--ig-` variable exists for them.
- Line height is unitless.
- The six heading slots descend in size: 70, 43, 27, 21, 18, 16px from `h1` to `h6`. Keep them in order when a size changes: an Ignite UI component on the page reads them as a heading scale.

Why: a slot name says nothing about use. `h4` is the stat number and `h6` the card title. A role name tells a developer what the style is for, as a colour token does.

Why unitless: a site may override a font size. A line height given as a length would not follow it.

Considered and not done: the engine lets you register more type slots, through `$ITypeScale` and `$IElementCategories`. `body-xs` and `body-2xs` could be registered and published as `--ig-body-xs-*`. They are not, for three reasons. No Ignite UI component reads a slot beyond the 13. The list can only be configured on the inner module `igniteui-theming/sass/typography/types`, before anything else loads the engine; through the main entry Sass fails with "module already loaded". And a site overrides type through `--igd-type-{role}-*`, which is the same for all 15 styles.

Not decided yet:
- The sizes are fixed. `display-lg` is 70px on a phone. Fluid sizes need minimum sizes from design.

### 8. Use the engine, not a copy of it

- Colours come from `palette()`, contrast ratios from `contrast()`, the contrast variables from `adaptive-contrast()`, spacing and sizes from `pad()` and `sizable()`, radii from `border-radius()`, shadows from `elevations()`, type from `typography()`.
- The build starts no MCP server and no browser. Only the two gates use a browser.
- The main palette is built with `palette()` in full, and `theme.css` declares every custom property it emits for the light palette. Ignite UI components depend on every shade of the built-in families: primary, secondary, gray, surface, info, success, warn and error. Do not trim it.

Known gap: the engine's elevation presets cannot take a CSS colour such as `hsl(from var(--x) h s l / 0.26)`, so `make.ts` rewrites the shadow colours with a regular expression.

## Working here

- One PR at a time against `main`. PRs are squash-merged, and a stacked PR breaks when its base is squashed.
- The PR description must follow `.github/PULL_REQUEST_TEMPLATE.md`; a CI check enforces it.
- A change that moves no token should prove it: compare `dist/` and `reports/` with `main`.
