# AGENTS.md

Guidance for an agent working in this repository. Read the README first; this file holds the decisions behind the code and the reason for each, so they are not undone by accident.

## Commands

```sh
npm ci
npx playwright install chromium   # the two browser gates measure rendered colours
npm test                          # type check, lint, build, unit tests, every check
npm run test:unit                 # Vitest only: src/*.test.ts and checks/*.test.ts
npm run lint                      # Biome: format and lint rules, writes nothing
npm run format                    # Biome: writes the format and the safe fixes
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

- `src/palette-sets.ts` builds five extra palettes with the engine: pink, cyan, sky and teal for accent colours, and a dark palette.
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

### 7. A type style is named for its role, and the large ones are fluid

- `src/spec.ts` lists 15 type styles. Each has a role name (`display-lg`, `title-sm`, `eyebrow`) and the engine slot that holds it.
- The class is `.igd-type-{role}` and its variables are `--igd-type-{role}-{property}`. A role reads its engine slot: `--igd-type-title-sm-font-size: var(--ig-h6-font-size)`.
- The engine has 13 type slots by default, and Ignite UI components read those 13. `body-xs` and `body-2xs` have none, so their variables hold the compiled values and no `--ig-` variable exists for them.
- The six heading slots descend in size: 70, 43, 27, 21, 18, 16px from `h1` to `h6`. Keep them in order when a size changes: an Ignite UI component on the page reads them as a heading scale.
- Line height is unitless.
- Five roles are fluid: `display-lg`, `display-md`, `display-sm`, `lead` and `body-lg`. Each grows in a straight line from its minimum in a 360px container to its full size in a 1280px one. `TYPE_MIN` and `TYPE_FLUID_RANGE` in `src/spec.ts` hold the numbers; `src/fluid.ts` builds the `clamp()`.
- The width is read in `cqi`: the width of the nearest query container, or of the viewport when the text is in none.
- The type classes are in `theme.css` only.
- The sizes in `TYPE` are the marketing site's. `TYPE_SETS` holds a second set, `docs`, with a value for every role. `data-igd-type="docs"` on the page or on a region selects it. A set changes size, line height, weight, letter spacing and case; the face of a role does not change.

Why role names: a slot name says nothing about use. `h4` is the stat number and `h6` the card title. A role name tells a developer what the style is for, as a colour token does.

Why unitless: a site may override a font size, and a fluid size changes with the container. A line height given as a length would follow neither.

Why fluid: a 70px heading does not fit a phone, and a component is meant to follow its container, not the page.

Why only five: text at 16px and below is already at a size that reads on a phone. Shrinking it further would hurt.

Why a set in the package: a docs page cannot take a 70px heading, and Blog, Docs and API docs would otherwise each repeat the same overrides and drift apart. The owner chose one shipped set per kind of site over per-site overrides. The `docs` values are the type scale `igniteui-astro-components` had. The set is not fluid: its largest size is 36px.

A new kind of site gets a new set in `TYPE_SETS`. The build stops when a set does not list each role once.

Not reviewed yet: the minimums (40, 30, 22, 18 and 17px) and the width range are a first version chosen by engineering, not by design. Changing one is one number in `src/spec.ts`.

Considered and not done: the engine lets you register more type slots, through `$ITypeScale` and `$IElementCategories`. `body-xs` and `body-2xs` could be registered and published as `--ig-body-xs-*`. They are not, for three reasons. No Ignite UI component reads a slot beyond the 13. The list can only be configured on the inner module `igniteui-theming/sass/typography/types`, before anything else loads the engine; through the main entry Sass fails with "module already loaded". And a site overrides type through `--igd-type-{role}-*`, which is the same for all 15 styles.

### 8. Use the engine, not a copy of it

- Colours come from `palette()`, contrast ratios from `contrast()`, the contrast variables from `adaptive-contrast()`, spacing and sizes from `pad()` and `sizable()`, radii from `border-radius()`, shadows from `elevations()`, type from `typography()`.
- The build starts no MCP server and no browser. Only the two gates use a browser.
- The main palette is built with `palette()` in full, and `theme.css` declares every custom property it emits for the light palette. Ignite UI components depend on every shade of the built-in families: primary, secondary, gray, surface, info, success, warn and error. Do not trim it.

Known gap: the engine's elevation presets cannot take a CSS colour such as `hsl(from var(--x) h s l / 0.26)`, so `make.ts` rewrites the shadow colours with a regular expression.

### 9. Tokens and element styles ship apart, and the dials are not set

- `tokens.css` and `theme.css` hold custom properties, the type classes, keyframes and one utility class. They contain no rule for `body`, headings, links or focus.
- `base.css` holds those element rules. It is optional and loads last.
- The package does not set `--ig-size`, `--ig-spacing`, `--ig-elevation-factor` or `--ig-radius-factor`. Each token falls back to its design value.
- A link in `base.css` is `color-action-text`, not `color-action-default`. The fill colour is not safe as text: it was about 3.4:1 on the dark page.

Why apart: a docs site has its own element styles. Loaded on top of it, the element rules reset heading margins, removed link underlines and changed the body size. That was seen in the `igniteui-astro-components` playground.

Why no dials: they are the engine's, so an Ignite UI component reads them. With `--ig-size: 3` set by the package, every Ignite UI control on a docs page grew (an input from 40px to 48px). The owner decided each site sets the dials for itself.

### 10. The showcase is generated, and it is where the tokens are documented

- `src/showcase.ts` writes `docs/showcase.html` from `dist/tokens.json` on every build. Do not edit the HTML.
- A new kind of token gets a section there. The page reads the rendered value in the browser, so it cannot disagree with the stylesheets.
- `check-vars` reads the page, so a `var()` in it that names no token fails `npm test`.
- The page follows the system colour scheme until the theme button is used, and stores a choice only while it differs from the system.

Why here: `igniteui-astro-components` had its own Colors and Typography pages for its own palette and type scale. The owner decided the foundations are documented with the tokens, and that the pages about Markdown content (lists, tables, code, images, badges) stay in that repository.

## Open

Nothing below is decided. Ask the owner before acting on one.

- No site consumes the package yet. It is `private`, has no licence and no release process, and its home organisation and public name are not settled.
- The checks run only in this repository. A consumer needs them as an installed command, compiled to JavaScript: Node does not run a `.ts` file from `node_modules`.
- The fluid type minimums have not been reviewed by design or seen on a real page.
- CI builds the default seed only. Another primary seed was tried by hand once (`#0f9d58`).
- Two design options are recorded under decision 2: the dark palette's surface roles for the inverse surfaces, and the engine's dark brand ramps for the dark theme.
- A fixed dark area, such as the footer, could be a `data-theme="dark"` region that uses the normal tokens. That would remove most `*-inverse` and footer colour tokens. It was raised and not pursued.

## Working here

- One PR at a time against `main`. PRs are squash-merged, and a stacked PR breaks when its base is squashed.
- The PR description must follow `.github/PULL_REQUEST_TEMPLATE.md`; a CI check enforces it.
- A change that moves no token should prove it: compare `dist/` and `reports/` with `main`, or measure the rendered result in a browser before and after.
- Verify a statement about the engine by running it against the installed version before writing it here. Two statements in this file had to be corrected because they were written from reading alone.
