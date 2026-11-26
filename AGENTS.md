# AGENTS.md

Guidance for an agent working in this repository. Read the README first; this file holds the decisions behind the code and the reason for each, so they are not undone by accident.

## Commands

```sh
npm ci
npx playwright install chromium   # three gates measure the tokens in a browser
npm test                          # type check, lint, build, unit tests, every check
npm run test:unit                 # Vitest only: src/*.test.ts and checks/*.test.ts
npm run lint                      # Biome: format and lint rules, writes nothing
npm run format                    # Biome: writes the format and the safe fixes
npm run palettes                  # only after a seed or a scale changes
```

Node 22.18 or newer runs the `.ts` files directly. Do not add `tsx`: it rewrites the functions passed to Playwright's `page.evaluate` and the gates crash with `__name is not defined`.

`dist/`, `reports/`, `docs/MIGRATION.md`, `llms.txt`, `llms-full.txt` and `src/palettes.json` are generated and committed. `docs/ADOPTING.md` is written by hand. Change `src/`, rebuild, commit the result. CI fails when a generated file differs from a fresh build.

Run one check after `npm run build`: `node checks/gates-themes.ts`, `node checks/resolve.ts`, or any other file under `checks/`.

Add a token: add it to `src/spec.ts`, add its pairings to `CONTRAST_PAIRS` there when it is a text or outline colour and its dark-theme step to `DARK_STEP` when it is text in a brand or status colour, run `npm test`, and commit the source with the generated files.

## Generator layout

`npm run build` runs these in order. Each writes the files named.

| File | What it does |
|---|---|
| `src/spec.ts` | The vocabulary: token names, the engine step each aliases, the step a text token reads in the dark variant, scales, type rows, contrast pairings. Start here to add or change a token. |
| `src/palette-sets.ts`, `src/palettes.ts` | The seeds and the `palette()` call of each palette; `npm run palettes` compiles them to `src/palettes.json`. |
| `src/make.ts` | The entry point. Calls the modules below and writes `dist/tokens.json`, `tokens.css`, `theme.css`, `base.css`, `fonts.css`, `dist/fonts/` and `reports/`. |
| `src/typography.ts` | Compiles the type scale and the type sets with the engine's `typography()`. |
| `src/layout.ts` | Spacing, sizes, radius and elevations through `pad()`, `sizable()`, `border-radius()` and `elevations()`. |
| `src/shadows.ts` | The site shadows, the tinted elevations and the semantic shadow table. |
| `src/contrast.ts` | The label colour on the action fill, the step its hover fill takes, the measured ratios and the pairings check. |
| `src/engine-colors.ts` | Looks a token or an engine step up in `src/palettes.json`. |
| `src/tokens-json.ts` | Builds the `tokens.json` object. |
| `src/stylesheets.ts` | The text of `tokens.css`, `fonts.css` and `base.css`. |
| `src/theme.ts`, `src/derived.ts` | The text of `theme.css`; `derived.ts` is its derived-colour section. |
| `src/namespace.ts` | Adds `--igd-` to every custom property in `dist/*.css` that is not engine output. |
| `src/migration.ts`, `src/dtcg.ts`, `src/llms.ts` | Write `docs/MIGRATION.md`, `dist/infragistics.tokens.json` and the two llms files. |
| `src/usage.ts` | The stylesheets in load order, the dials, and the install and check commands. `llms.txt` and the site print them from here. |
| `src/rules.ts` | The rules for code that uses the tokens, each with a do and a don't. `llms.txt` and the Guide's Rules page print them; a test runs each through the check command. |
| `site/` | The documentation site, an Astro project with its own `package.json`. It reads `dist/tokens.json`, the Markdown documents and `package.json`. |
| `checks/cli.ts`, `checks/site.ts`, `checks/rules.ts` | The site command, its rules and the list of what it reports and does not, compiled with the modules they import to `dist/cli/` by `tsc -p tsconfig.cli.json`. |

## Decisions

Do not reverse one of these without asking the owner.

### 1. `--ig-*` is the engine's namespace, `--igd-*` is ours

- A custom property is `--ig-*` only when `igniteui-theming` itself emits that exact name: the palette (`--ig-primary-500`, `--ig-primary-A100`, `--ig-primary-500-contrast`), the dials (`--ig-size`, `--ig-spacing`, `--ig-radius-factor`, `--ig-elevation-factor`), `--ig-elevation-<n>` and the type slot variables.
- The engine also emits `--ig-<name>-<step>` for a custom family built with its `shades()` function and passed to the `palette()` mixin. That is engine output too. The package publishes no custom family today.
- Everything the design system defines is `--igd-*`, in the semantic tier and in the component tier. The same goes for classes and keyframes: `.igd-type-display-lg`, `igd-float`.
- The generator works in bare names. `src/namespace.ts` adds `--igd-` once the stylesheets are written, before the exports and the llms files are generated.

Why: an Ignite UI component on the same page reads the `--ig-*` names, so the page has one palette and one set of dials. A name the generator makes up under `--ig-`, such as `--ig-elevation-tint-<n>`, looks like engine API and is not.

### 2. The accent palettes and the dark palette are built, not published

- `src/palette-sets.ts` builds five extra palettes with the engine: pink, cyan, sky and teal for accent colours, and a dark palette.
- Their ramps are not in `dist/`. A token that uses a step carries the colour itself: `--igd-tile-3: #e23b8f`, not `var(--ig-pink-400)`.
- The spec still names the step (`"tile-3": ["ig-pink-400", …]`). That name is internal to the build.
- The dark palette is handled the same way. There is no `--ig-dark-gray-<n>` or `--ig-dark-surface-<n>` in `dist/`.
  - The dark variant sets the engine's own names: `[data-theme="dark"] { --ig-gray-500: #bcc1c9; }`. The engine does the same for a dark palette.
  - A token for an area that is dark in both variants carries the colour: `--igd-color-surface-inverse: #0f172a`. The spec names the step as `ig-dark-surface-500`.
- A dark area uses the three inverse surface levels, not a component's own colour: `color-surface-inverse-raised`, `color-surface-inverse`, `color-surface-inverse-sunken`. `footer-background` points at the last one.

Why: the theme reads 11 steps of the 4 accent palettes, so publishing the full ramps is not worth their size. The names were not the problem there: `--ig-pink-400` follows the pattern the engine uses for a custom family.

Why, for the dark palette: `--ig-dark-gray-<n>` was a name of ours. The engine emits a dark palette under the same names as a light one, `--ig-gray-<n>`, and a theme decides which values they hold.

Why the palettes are still built: none of the colours in use is a seed. Each is a step the engine solved for contrast. Pink `#ec4899` as text on white is about 3.5:1; step 500 (`#c42579`) clears 4.5:1. Typing in one colour per accent would drop that solving.

Considered and not done:
- The dark palette also has the engine's surface roles (`raised`, `sunken`, `overlay`). They are within a shade or two of the numeric steps the inverse surfaces use. Pointing the inverse surfaces at the roles would shift the footer's colours slightly, so it needs a design decision.
- The dark variant swaps the gray and surface ramps only. The engine's dark palette also re-solves the brand ramps against the dark surface; using those would change dark-variant colours.
- The engine's `shades($name, $color, $shades, $surface, $generator, $scale)` builds one family from a seed with any list of steps, two at least. With the ten steps `50` to `900` it gives the same 40 colours as the four full palettes. The owner decided to keep the `palette()` build.
- A shorter list of steps changes the colours. `shades()` places a step by its position in the list, not by the number in its name: `('400', '500')` returns the two ends of the ramp, `#fee6ec` and `#290a18` for the pink seed.

To add an accent colour: add a palette to `palette-sets.ts`, run `npm run palettes`, add the family to the `ACCENT_STEP` pattern in `src/engine-colors.ts`, then alias a step in `src/spec.ts`.

### 3. Brand seeds are a build input

- The seeds live in `src/palette-sets.ts`. Changing one means `npm run palettes` and `npm run build`.
- There is no runtime seed change and no `seed.js`.
- The success seed is green, `#028a54`, the one the docs sites had. Error has no seed in `palette-sets.ts`: it is the engine's default, `#ff134a`, which the docs sites also used. Why green: success is read as a status (the Do frame, a copied state), and the marketing site's teal `#0d9488` is a brand accent with its own token, `color-accent-inverse-performance`.
- Text in the action colour, `color-action-text`, reads an engine step: `ig-primary-600` in the light variant and `ig-primary-200` in the dark one. Why: the engine solves each step to a fixed contrast against the surface for any seed, about 5.2:1 on white for step 600, so a step is safe as text and a seed is not.
- The action fill, `color-action-default`, is the seed, and its label is the engine's contrast colour (decision 5). The fill is held to no contrast against the page: a `#ffee00` seed builds, with a black label on the fill and step 600 as text.
- `compile()` in `src/sass.ts` stops the build when the engine warns, for example that a hue cannot reach the contrast a step asks for. Sass deprecation notices are ignored.

Why: the engine solves each shade for contrast when Sass compiles. A ramp shifted in the browser is an approximation of that.

### 4. State colours are derived from their base token

- Hover, active, tint, border and shadow colours are computed from a base with `oklch(from var(--base) …)`. The deltas are measured at build time between two engine values, so the default equals the engine's colour.
- Override a base, on the page or on a `data-ig-scope` region, and its states follow.
- A text token that aliases a brand, status or accent step is not derived. It reads one engine step per theme: the alias in `ALIAS`, and a lighter step of the same family in `DARK_STEP` in `src/spec.ts`, which `theme.css` declares under `[data-theme="dark"]`. Why: a step has a known contrast, and a formula in the browser is an approximation of it.
- A token in `DARK_STEP` is declared on the themes only, not on `[data-ig-scope]`, so a scope inherits the value of the theme it is in. Its state tokens are declared on the scope and follow it.

Why: nobody picks a state colour by hand, and a region can carry its own colours.

### 5. A label on a fill is black or white, by the engine's `adaptive-contrast()`

- `color-action-on`, `tile-on` and `table-header-sub-highlight-color` use it.
- Do not switch to native CSS `contrast-color()` yet. It is Baseline only since April 2026 (Chrome 147, Firefox 146, Safari 26.0); Safari on iOS 18 does not have it, and there the label would fall back to the inherited text colour. Revisit in late 2027.
- It does not apply to a brand colour used as text on a surface. That reads an engine step (decision 3), not black or white.

### 6. Names carry a role, never a hue, a shape or a brand family

- Semantic and component names have no colour word: `color-accent-brand`, `tile-1` … `tile-8`, `glow-inverse`. The exception is `window-dot-red`, `-amber` and `-green`, the three dots of a mock window.
- A name says what the value is for, not how it looks: no shape (`radius-action`, not `radius-pill`), no material (`shadow-chip`, not `shadow-glass`) and no vague `-alt` (`color-surface-tint-category`, not `color-surface-tint-alt`).
- No semantic name uses `primary` or `secondary`, which are engine family names: `color-text-strong` and `color-accent-brand`, not `color-text-primary` and `color-accent-primary`. `color-accent-brand` reads the info family; under the old name a reader expected the primary one.
- A name does not carry a product or a page: a product is renamed or replaced more often than a colour changes. `tile-1` … `tile-8` are not named for the products they fill today.
- Two kinds of name may be a position instead of a word, because the position is the role:
  - A scale: `space-inset-lg`, `size-icon-sm`, `font-weight-bold`, `breakpoint-md`. The step says how much, and a component picks a step by need.
  - An ordered set: `tile-1` … `tile-8`. A grid of icon tiles takes them in order, so the fifth tile is `tile-5` whatever product it shows. Each token's note says where it is used now.
- A state colour stays in the family of its base (`stateFamilyErrors` in `src/derived.ts`); the build stops otherwise.
- The `color-` category word stays on the semantic tier, so `color-border-default` cannot be mistaken for `border-width-default`.
- Semantic and component names in `tokens.json` and in the DTCG file carry no prefix. The prefix belongs to CSS. An engine name keeps its `ig-`.

Why: a name is written into every site that uses it, and a value is written once, here. A token called "blue" is wrong the day the seed changes; `radius-pill` is wrong the day actions stop being pills; `tile-agent-skills` is wrong the day that product is renamed. Each of those forces a rename in every site. A role name stays right, and only the value changes. The owner decided the role names on 2026-11-24.

### 7. A type style is named for its role, and the large ones are fluid

- `src/spec.ts` lists 15 type styles. Each has a role name (`display-lg`, `title-sm`, `eyebrow`) and the engine slot that holds it.
- The class is `.igd-type-{role}` and its variables are `--igd-type-{role}-{property}`. A role reads its engine slot: `--igd-type-title-sm-font-size: var(--ig-h6-font-size)`.
- The engine has 13 type slots by default, and Ignite UI components read those 13. `body-xs` and `body-2xs` have none, so their variables hold the compiled values and no `--ig-` variable exists for them.
- The heading slots are 52, 43, 23, 26, 18 and 16px from `h1` to `h6` in the default set, and 36, 24, 20, 18, 16, 14px in the `docs` set. In the default set `h4`, the stat number, is larger than `h3`, so an Ignite UI component that reads the slots as a heading scale gets those two out of order. The docs set, which is where Ignite UI components render today, descends.
- Line height is unitless.
- Four roles are fluid: `display-lg`, `display-md`, `display-sm` and `lead`. Each grows in a straight line from its minimum in a 360px container to its full size in a 1280px one. `TYPE_MIN` and `TYPE_FLUID_RANGE` in `src/spec.ts` hold the numbers; `src/fluid.ts` builds the `clamp()`.
- The width is read in `cqi`: the width of the nearest query container, or of the viewport when the text is in none.
- The type classes are in `theme.css` only.
- The sizes in `TYPE` are the marketing site's. `TYPE_SETS` holds a second set, `docs`, with a value for every role. `data-igd-type="docs"` on the page or on a region selects it. A set changes size, line height, weight, letter spacing and case; the face of a role does not change.

Why role names: a slot name says nothing about use. `h4` is the stat number and `h6` the card title. A role name tells a developer what the style is for, as a colour token does.

Why unitless: a site may override a font size, and a fluid size changes with the container. A line height given as a length would follow neither.

Why fluid: a 52px heading does not fit a phone, and a component is meant to follow its container, not the page.

Why only four: text at 16px and below is already at a size that reads on a phone. Shrinking it further would hurt.

Why a set in the package: a docs page cannot take a 52px heading, and Blog, Docs and API docs would otherwise each repeat the same overrides and drift apart. The owner chose one shipped set per kind of site over per-site overrides. The `docs` values are the type scale `igniteui-astro-components` had. The set is not fluid: its largest size is 36px.

A new kind of site gets a new set in `TYPE_SETS`. The build stops when a set does not list each role once.

Why these sizes: the default set is the type www.infragistics.com ships (`src/styles/design-system/tokens.css` in the website repository). The full sizes are its desktop values and the minimums (36, 30, 20 and 17px) are the values it steps to below 900px.

Not reviewed yet: the width range (360px to 1280px). The site steps once at 900px, so between the two ends a fluid size differs from the site by a few pixels.

Considered and not done: the engine lets you register more type slots, through `$ITypeScale` and `$IElementCategories`. `body-xs` and `body-2xs` could be registered and published as `--ig-body-xs-*`. They are not, for three reasons. No Ignite UI component reads a slot beyond the 13. The list can only be configured on the inner module `igniteui-theming/sass/typography/types`, before anything else loads the engine; through the main entry Sass fails with "module already loaded". And a site overrides type through `--igd-type-{role}-*`, which is the same for all 15 styles.

### 8. Use the engine, not a copy of it

- Colours come from `palette()`, contrast ratios from `contrast()`, the contrast variables from `adaptive-contrast()`, spacing and sizes from `pad()` and `sizable()`, radii from `border-radius()`, shadows from `elevations()` and `box-shadow()`, type from `typography()`.
- `shadow-card-hover`, `shadow-screenshot` and `shadow-floating` are the shadows www.infragistics.com ships, listed in `SHADOW` in `src/spec.ts` and compiled with the engine's `box-shadow()`, so they follow `--ig-elevation-factor`. `shadow-popover` and `shadow-panel` are listed and compiled the same way. Why not an elevation level: the engine's indigo elevation levels are far heavier than the site's shadows, and loading them changed every card and screenshot. The tinted shadows, `shadow-popover-filter` and the raw `elevation-*` tokens are still engine levels. `shadow-popover-filter` is not the filter form of `shadow-panel`: `drop-shadow()` has no spread, and the panel's layers depend on a negative spread.
- The build starts no MCP server and no browser. Three gates use one: `gates-derived.ts`, `gates-themes.ts` and `resolve.ts`.
- The main palette is built with `palette()` in full, and `theme.css` declares every custom property it emits for the light palette. Ignite UI components depend on every shade of the built-in families: primary, secondary, gray, surface, info, success, warn and error. Do not trim it.

Known gap: the engine's elevation presets cannot take a CSS colour such as `hsl(from var(--x) h s l / 0.26)`, so `withShadowColorToken()` and `withActionColorToken()` in `src/shadows.ts` rewrite the shadow colours with a regular expression.

### 9. Tokens and element styles ship apart, and the dials are not set

- `tokens.css` and `theme.css` hold custom properties, the type classes, keyframes and one utility class. They contain no rule for `body`, headings, links or focus.
- `base.css` holds those element rules. It is optional and loads last.
- `fonts.css` holds the `@font-face` rules. It is optional. Why: the marketing site loads the same three families from Google Fonts, and with the rules inside `tokens.css` every page fetched each face twice and the header and footer it exports to other sites carried the font files.
- The package does not set `--ig-size`, `--ig-spacing`, `--ig-elevation-factor` or `--ig-radius-factor`. Each token falls back to its design value.
- Every token that reads a dial (spacing, sizes, radii, the neutral elevations) is declared on `:root, [data-ig-scope]`. A dial takes effect on the root and on a `data-ig-scope` element, nowhere else.
- The size flags the engine's `sizable()` emits, `--component-size` and `--is-small`, `-medium`, `-large`, are published as `--igd-component-size` and `--igd-is-*`. Why: an Ignite UI component sets those names on its own host, and a document rule on `[data-ig-scope]` beats a `:host` rule. With the engine's names, `data-ig-scope` on an `igc-input` made it 48px tall where it was 40px.
- Every component built on the design system puts `data-ig-scope` on its root element, in any framework and any repository, whether or not it is an Ignite UI component. A component with shadow DOM puts it on its host element. `docs/examples/card.html` shows a whole component written to the rules in plain HTML and CSS; `llms.txt` quotes it and `npm test` opens it in a browser. Change the example when a rule for components changes.
- A link in `base.css` is `color-action-text`, not `color-action-default`. The fill colour is not safe as text: it was about 3.4:1 on the dark page.

Why apart: a docs site has its own element styles. Loaded on top of it, the element rules reset heading margins, removed link underlines and changed the body size. That was seen in the `igniteui-astro-components` playground.

Why the scope: a custom property is calculated on the element that declares it, and elements below inherit the result, not the formula. An Ignite UI component calculates on its host, so it follows a dial set on any ancestor. A token has no host, so the component root is marked. Without the mark, a dial on a section shrank the Ignite UI buttons in it and left the cards next to them unchanged.

Why no dials: they are the engine's, so an Ignite UI component reads them. With `--ig-size: 3` set by the package, every Ignite UI control on a docs page grew. The owner decided each site sets the dials for itself.

### 10. The documentation is an Astro site, and nothing it shows is typed twice

- `site/` is an Astro project. It is not part of the npm package and has its own `package.json`, lockfile and tests. The package keeps no dependencies.
- The site reads its facts where they live: tokens from `dist/tokens.json`, the documents from `docs/ADOPTING.md`, `docs/MIGRATION.md` and `CHANGELOG.md`, the package name and repository from `package.json`, the stylesheet order, the dials and the commands from `src/usage.ts`, the rules from `src/rules.ts`, what the check reports from `checks/rules.ts`, and the example card from `docs/examples/`. `site/src/lib/design-system.ts` is the one module that imports from outside `site/`.
- Nothing the site builds is committed. `site/dist/` is ignored; the Pages workflow builds it.
- Tokens is an overview (`/tokens/`, with one search over every family) and one page per family (`/tokens/<family>/`, `TOKEN_FAMILY_PAGES` in `site/src/data/navigation.ts`), with the same menu and On this page as the Guide. Every token is a row: preview, name, use, value; a text colour previews as "Aa" in that colour. The family pages show no code samples; those are the Guide's. A name button copies exactly the name it shows. The owner chose this on 2026-11-26.
- A new kind of token gets a section on a Tokens family page. The page reads the rendered value in the browser, so it cannot disagree with the stylesheets. A test fails when a token of `tokens.json` is on neither a Tokens page nor the Engine page.
- The Tokens page lists what a site may write. The Engine page lists what the tokens are built from: the palette, the raw spacing steps and the engine's elevations (`isEngine()` in `site/src/lib/tokens.ts`). Under each step it lists the tokens that read it, and a colour card on the Tokens page links to the step it reads. Why: the owner decided on 2026-11-24 that values a site must not write do not sit beside the ones it may.
- Every token on both pages is an element with `data-token="<name>"`, a palette step included. The filter, and any later tool that edits a token, finds it by that attribute.
- A note shows its first sentence and folds the rest, so a row of cards stays even. Write the first sentence of a usage note in `src/spec.ts` to stand on its own.
- The site opens on a landing page (`/`) with no top bar: the logo, a welcome and one card per part of the site. The logo in the top bar of every other page leads back to it. The owner asked for it on 2026-11-26.
- The site has Concepts (`/concepts/`), the plain-words tour, and the Guide (`/guide/` and its pages, then the documents), the developer's how-to. `GUIDE_PAGES` in `site/src/data/navigation.ts` lists the Guide's pages; a Guide page passes `menu="guide"` to `SectionsLayout` (a Tokens page `menu="tokens"`), which puts that menu on the left and the page's sections under On this page. Concepts links into the Guide; Guide pages do not link back. The owner decided this structure on 2026-11-26.
- The site follows its own rules: every component of `site/src/components` marks its root with `data-ig-scope` (a test reads each file), and the site command runs on `site/src` in CI. A component whose root is another component inherits the mark.
- Concepts shows a chosen few tokens with a plain use each, listed in `site/src/data/guide.ts`. A name there that `tokens.json` does not have stops the build.
- A Markdown document becomes a page by a line in `DOCUMENTS` in `site/src/data/navigation.ts`. The document is then a page of the Guide. Do not link a reader of the site to a Markdown file on GitHub: a test fails on such a link.
- The Guide's Rules page prints the rules of `src/rules.ts`, bad examples included, so `site/src` holds none and the site command runs on all of it. `check-vars` runs on the built pages.
- Every concept on Concepts has a live example. Its options are `OptionList` cards, a short label and the plain use each, the picked one tinted with an action-colour border; the dials keep their rows of values. Colour, type, spacing, corners, shadows and the variants are pickers; the owner asked for this on 2026-11-26.
- Every interactive example of Concepts uses `ExampleLayout` (`site/src/components/guide/ExampleLayout.astro`): its controls on the left, the use and name of the pick and then the drawing on the right, stacked in that order below 48rem of content width. A test checks that the five examples share one edge. The owner asked for one layout on 2026-11-26.
- Concepts leads each pick with a plain use and shows the token's name under it, one name per pick: a colour, a space, a corner, a shadow, a type role with its element, a dial. Values and code samples are on the Tokens page and in the Guide. The messages show no names. The owner decided on 2026-11-26 that the names stay, after the page without them looked unanchored.
- The logo files are in `site/src/assets/logos/`, as copies of the files the marketing site ships in `public/assets/logos/`. Do not redraw or recolour them; copy them again when the logo changes. The colours and the proportion on the Logo page are read from the files.
- The clear space (half the logo's height), the smallest sizes (16px) and the do and don't list on the Logo page are the rules for the logo. The owner approved them on 2026-11-23. The sizes are in `site/src/data/logo.ts`.
- The brand book (the Logo page) also holds the name rules, the co-branding rules and the accessibility rules, in `site/src/data/brand.ts`; they wait for the owner's approval. A section with no content yet is listed in `SOON` there with what it will hold, and the page does not show it; write it into the page and remove it from `SOON` once its content is written. The owner decided on 2026-11-26 to hide the Coming soon sections.
- The site is light by default, whatever the system colour scheme. The theme switch in the top bar is an icon button; it stores the dark variant once chosen and removes it when switched back.
- In the dark variant a sticky notice above the top bar says the variant is not final. Remove it once the dark variant is reviewed (see Open).
- The top bar, the Guide's menu and the section list mark the open page or the section being read the same way: `color-surface-tint` behind it and `color-action-text` on it. The owner chose one active state on 2026-11-26. The filter of a Tokens page sits above its section list.
- A type set button switches one element, the type list beside it, never the page.
- Astro removes the whitespace between two inline elements. Write `{" "}` where a space must stay.

Why Astro: the pages were strings built by TypeScript generators, and their HTML was committed. Every change rewrote the generated files, and a Markdown document needed patching to become a page. The owner decided on 2026-11-23 to move the site to Astro, the tool the other documentation sites use.

Why here: `igniteui-astro-components` had its own Colors and Typography pages for its own palette and type scale. The owner decided the foundations are documented with the tokens, and that the pages about Markdown content (lists, tables, code, images, badges) stay in that repository.

### 11. What stays outside the design system

- Widths, heights and offsets. The owner decided they are layout, not design tokens. The site command does not check them.
- A site's own layout breakpoints. The four `breakpoint-*` values (640, 768, 1024, 1280px) are the system's; the docs layout also switches at 1100px and 1999px for its three columns, and that belongs to the docs. A custom property cannot be used in a media query, so a breakpoint token is a documented number, not a live value.
- The marketing site's `--ig-cta-tint`. It is three bare RGB channels a page sets to repaint a button's halo, a mechanism of that site's button, not a colour.
- `shadow-popover-filter` stays on engine elevation 20 and is not derived from `shadow-panel`. Measured in a browser against the panel's box shadow, the engine filter is the closest of four candidates (summed error 83; 109, 117 and 209 for filters built from the panel's own layers), because `drop-shadow()` has no spread.

## Open

Nothing below is decided. Ask the owner before acting on one.

- No site installs the package yet. The marketing site and `igniteui-astro-components` carry a copy of `dist/` until the first release.
- Not reviewed by design: the width range type and section spacing grow across (360px to 1280px), the status badge colours, and `color-feedback-error-default` at `error-500`.
- The dark variant has not been reviewed. Nobody is working on it and no site has a switch for it yet.
- Two design options are recorded under decision 2: the dark palette's surface roles for the inverse surfaces, and the engine's dark brand ramps for the dark variant.
- The owner wants the Tokens page to become editable later, so that someone who is not a developer can change a value and get a pull request. Nothing of that exists. The page is static and generated.
- A fixed dark area, such as the footer, could be a `data-theme="dark"` region that uses the normal tokens. That would remove most `*-inverse` and footer colour tokens. It was raised and not pursued.

## Proving a change

- `checks/resolve.ts` loads `tokens.css` and `theme.css` in a browser and fails when a custom property resolves to nothing, or a colour, spacing, radius or size token is not a valid value, in either theme. A property declared only on a component selector is left out.
- CI builds the system a second time with `IGD_SEED_PRIMARY=#0f9d58` and `IGD_SEED_SECONDARY=#e6447a` and runs every gate. Why: a rebrand is a promise of decision 3, and with one seed in CI nothing proved it.
- `npm run compare -- <before url> <after url> [path@width ...]` compares two renderings element by element. Use it before claiming a change moves nothing.
- `.github/workflows/pages.yml` builds `site/` from the commit CI passed on, on `main`, and publishes it to GitHub Pages, with the files `llms.txt` links to. It needs Pages set to the source "GitHub Actions" in the repository settings.
- CI has a job for the site: it type-checks and builds it, runs `check-vars` and the site command on it, opens every built page in a browser, and builds it once more under a base path.

## Files for agents

- `llms.txt` and `llms-full.txt` are generated by `src/llms.ts` from `dist/tokens.json`, the two stylesheets and `package.json`, as the last build step, and are published with the package, importable as `ig-design-system/llms.txt`. Do not edit them; change the generator. CI fails when they differ from what the build writes.
- This file is not published. It guides work in this repository, and an agent in a site that installs the package must not follow its commands; that agent reads `llms.txt`, which does not link here.
- `llms.txt` holds the rules for code that uses the tokens, from `src/rules.ts`, and what the check reports, from `checks/rules.ts`. When a rule in this file changes what a site may write, change `src/rules.ts` in the same pull request.

## The site command

- `checks/cli.ts` is the `ig-design-system` command a site runs on its own source; its rules are in `checks/site.ts`, and the list of what it reports and does not report is in `checks/rules.ts`. `tsc -p tsconfig.cli.json` compiles them and the modules they import to `dist/cli/`, because Node does not run a `.ts` file from `node_modules`. The compiled files are committed with the rest of `dist/`.
- The rules a site is held to: no unknown `--igd-*` token, no raw palette step read or declared, spacing roles for padding, margins and gaps. A `var()` with a fallback is not reported: a component uses it as a hook a page may set.
- Widths, heights and offsets are not checked. The owner decided they are not part of the design system.
- `.github/workflows/check-site.yml` is the reusable workflow a site calls. A site pins it to a release tag.
- `checks/lint.ts`, `check-vars.ts` and `spacing-roles.ts` stay as the stricter checks on this repository's reference components.

## Releasing

- The package is MIT and public on npm as `ig-design-system`: it is for Infragistics' own sites, and nothing in it needs to be private. The repository stays at `IgniteUI/ig-design-system`.
- A release needs two things outside the code: the repository is public, because `npm publish --provenance` rejects a private or internal source repository, and the `NPM_TOKEN` secret holds an npm token that may publish `ig-design-system`.
- A GitHub Release with the tag `X.Y.Z` runs `.github/workflows/release.yml`, which runs every CI job on the tag, the build with other brand colours included, and publishes. A tag with a pre-release part, such as `1.1.0-rc.1`, is published under the `next` dist-tag, so `latest` stays on the last full release. Do not run `npm publish` and do not edit `version` in `package.json` for a release: the workflow sets it from the tag.
- Add the release's entry to `CHANGELOG.md` in the pull request that makes the change.
- `docs/MIGRATION.md` has one section per major version, the newest first; the first is "From the prototype to 1.0". A major version that renames or removes a token adds its section in `src/migration.ts` from `src/rename-map.ts`.
- The package has no dependencies. `igniteui-theming` and the font packages are build inputs, so they are `devDependencies`. A test fails when a dependency is added.
- The fonts in `dist/fonts/` are copied from the `@fontsource-variable` packages at build time, each with its SIL Open Font License. Do not add a font file by hand.

## Keeping the documentation true

- A fact lives in one module and every page, file and help text reads it from there: tokens in `dist/tokens.json`, the stylesheets, dials and commands in `src/usage.ts`, the rules in `src/rules.ts`, the check rules in `checks/rules.ts`, the example card in `docs/examples/`.
- A Markdown file cannot import a module, so `src/docs.test.ts` compares `README.md` and `docs/ADOPTING.md` with those modules: the check rules, the files the package ships, the type tables and the inputs of the reusable workflow. When it fails, change the document, or the module if the document was right.
- Do not write a number or a state that nothing checks: "8 steps", "not on npm yet", "until the first release". Say it without the number, or add it to `src/docs.test.ts`.

## Working here

- One PR at a time against `main`. PRs are squash-merged, and a stacked PR breaks when its base is squashed.
- The PR description must follow `.github/PULL_REQUEST_TEMPLATE.md`; a CI check enforces it.
- A change that moves no token should prove it: compare `dist/` and `reports/` with `main`, or measure the rendered result in a browser before and after.
- Verify a statement about the engine by running it against the installed version before writing it here.
