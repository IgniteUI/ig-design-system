# Infragistics design system

One source for the look of infragistics.com: colours, type, spacing, roundness and elevation as design tokens, plus the automatic checks that keep every site consistent. The tokens are generated with [igniteui-theming](https://github.com/IgniteUI/igniteui-theming), the same engine Ignite UI customers use.

## What is in the package

```sh
npm install ig-design-system
```

The stylesheets and the token data a site loads are in `dist/`. The package has no dependencies. There is no framework code in it, so any site can use it, whatever it is built with.

| File | What it is |
|---|---|
| `dist/tokens.css` | Every token as a CSS custom property, with its default value. Load it first. |
| `dist/theme.css` | The live layer: tokens that follow the theming dials, state colours derived from their base token, the dark variant and the type classes. Load it second. |
| `dist/base.css` | Optional. Element styles built on the tokens: page, headings, links, code, keyboard focus. Load it third on a site that has no element styles of its own; a docs site leaves it out. |
| `dist/fonts.css` | Optional. The `@font-face` rules for the three faces in `dist/fonts/`. Load it on a site that does not already load Plus Jakarta Sans, DM Sans and JetBrains Mono; a site that gets them from Google Fonts leaves it out. |
| `llms.txt`, `llms-full.txt` | For AI agents: the rules for code that uses the tokens, and every token with its value and use, plus the custom properties only the stylesheets declare. Generated on every build. |
| `AGENTS.md`, `CHANGELOG.md`, `docs/ADOPTING.md`, `docs/MIGRATION.md` | Shipped beside `dist/`, because `llms.txt` links to them. |
| `dist/cli/` | The compiled `ig-design-system` command. |
| `dist/tokens.json` | The token source: names, values and what each token is for. |
| `dist/infragistics.tokens.json` | The same tokens in the Design Tokens Community Group format (2025.10), for design tools and native platforms. |
| `dist/fonts/` | Plus Jakarta Sans, DM Sans and JetBrains Mono (variable, Latin), each with its SIL Open Font License. |

```html
<link rel="stylesheet" href="dist/fonts.css">   <!-- optional -->
<link rel="stylesheet" href="dist/tokens.css">
<link rel="stylesheet" href="dist/theme.css">
<link rel="stylesheet" href="dist/base.css">   <!-- optional -->
```

```css
.promo-button {
  background: var(--igd-color-action-default);
  color: var(--igd-color-action-on);
  padding: var(--igd-space-inset-sm) var(--igd-space-inset-xl);
  border-radius: var(--igd-radius-action);
}
.promo-button:hover { background: var(--igd-color-action-fill-hover); }
```

## Documentation site

`site/` is the documentation site, built with [Astro](https://astro.build). It uses the package as a site would: `tokens.css`, `theme.css`, `base.css`, and no colour or spacing of its own. It is light by default; the icon button in the top bar switches to the dark variant. `.github/workflows/pages.yml` builds it and publishes it to GitHub Pages.

| Page | What it is |
|---|---|
| Guide (`/`) | For someone who does not read the code: what a token is, the colours, type roles, spacing roles, corners and shadows to choose from, the light and dark variants and the four dials on a live card, the steps to build a component, six do and don't pairs, and how to set up a site. |
| Tokens (`/tokens/`) | Every token in `tokens.json` with the value it has on the page. A filter matches a token's name and its note; a click on a name copies `var(--igd-…)`. A button turns on the `docs` type set. |
| Logo (`/logo/`) | The three logo files, their colours and proportion read from the files, the surfaces a logo sits on with the measured contrast, clear space, smallest sizes and a do and don't list. |
| `/adopting/`, `/migration/`, `/changelog/` | `docs/ADOPTING.md`, `docs/MIGRATION.md` and `CHANGELOG.md`, rendered from the files. `site/integrations/document-markdown.mjs`, a plugin of Astro's Markdown processor, links the documents to each other as pages, adds a copy button to a code sample, and makes a new name in a table a copy button. |

Nothing the site shows is typed twice. The pages read `dist/tokens.json`, the Markdown files and `package.json` at build time, and nothing the build writes is committed. Change a token, a document or a rule in one place and the next build shows it.

```sh
npm run site:install   # once: install the site's own dependencies
npm run site:dev       # the site at http://localhost:4321, rebuilt as files change
npm run site:verify    # type-check, build, check the tokens the site uses, test the built pages
```

`site/README.md` describes the folders and how to add a page.

## Token tiers

| Tier | Prefix | Who uses it |
|---|---|---|
| Raw | `--ig-*` | Engine output, under the engine's own names: palette steps, seeds, elevations, type slots and the theming dials. Only the design system reaches in here. |
| Semantic | `--igd-color-*`, `--igd-space-*`, `--igd-radius-*`, `--igd-size-*`, `--igd-shadow-*`, … | Site code uses these. The name says what the value is for. |
| Component | `--igd-footer-*`, `--igd-nav-*`, `--igd-table-*`, … | One component's own choice, built from the semantic tier. |

Every token the design system defines is published as `--igd-*`, so it cannot collide with a site's own custom properties. Engine output keeps `--ig-*`. An Ignite UI component on the same page reads the same names, so the page has one palette and one set of dials (`--ig-size`, `--ig-spacing`, `--ig-radius-factor`, `--ig-elevation-factor`). The package declares every custom property the engine's `palette()` emits for the light palette, under the engine's names: the shades, the accent shades (`--ig-primary-A100`), the surface shades and roles, the seeds, and a `*-contrast` variable for each. So an Ignite UI component finds its palette colours here. A component still needs its own component theme and typography from Ignite UI. The generator works in bare names and `src/namespace.ts` applies the published prefix once the stylesheets are written.

Semantic and component names in `tokens.json` and in the DTCG file carry no prefix: the prefix belongs to CSS. An engine name keeps its `ig-`, as in `ig-primary-500`.

**Accent and dark palettes.** Five more palettes are built with the engine: pink, cyan, sky and teal for accent colours, and a dark palette for the dark variant and for the areas that stay dark in both variants. Their ramps are not published. A token that uses a step carries the colour itself (`--igd-tile-3: #e23b8f`), and its description names the step. The theme reads 11 steps of the four accent palettes and 8 steps of the dark ramps outside the dark variant, so publishing 64 variables was not worth their size. They are still built, not typed in, because each colour in use is a step the engine solved for contrast, not a seed.

The classes and keyframes the package defines follow the same rule: `.igd-type-display-lg` … `.igd-type-body-2xs` for the 15 type styles, `.igd-hide-below-md`, and the `igd-float` and `igd-app-shimmer` keyframes.

**Colour** names follow `color-{role}-{variant}-{state}`, for example `color-action-default` (`--igd-color-action-default` in CSS), `color-text-muted`, `color-surface-tint`. No semantic or component name carries a hue, with one exception, `window-dot-red`, `-amber` and `-green`, which name the three dots of a mock window: the accents are `color-accent-brand`, `-ai`, `-inverse` and `-inverse-performance`, the icon tile fills are `tile-1` … `tile-8`, and the glows take the name of the accent they derive from.

**Why names say the job.** A name is written into every site that uses it; a value is written once, in this package. So a name says what the value is for, never how it looks: no hue, no shape (`radius-action`, not `radius-pill`), no material (`shadow-chip`, not `shadow-glass`), no `-alt`, no product name and no `primary` or `secondary`, which are the engine's family names (`color-text-strong`, not `color-text-primary`). When the look changes, the value changes and every site keeps working. Two kinds of name use a position, because there the position is the role: a scale (`space-inset-lg`, `font-weight-bold`), where a component picks a step by need, and an ordered set (`tile-1` … `tile-8`), where a grid takes the colours in order. A hue appears only in the raw tier, where the name says what the value is. Use `color-action-default` for fills and `color-action-text` for anything drawn on a surface (links, outline labels, focus rings).

**Type** has 15 styles, each named for its role. The class is `.igd-type-{role}` and its variables are `--igd-type-{role}-{property}`.

| Role | Use |
|---|---|
| `display-lg`, `display-md`, `display-sm` | Hero, section and sub-section headings |
| `stat` | Stat numbers |
| `title-md`, `title-sm` | Product names; card titles |
| `lead` | The paragraph under a heading |
| `body-lg`, `body-md`, `body-sm`, `body-xs`, `body-2xs` | Prose, UI text, captions, micro and nano text |
| `label-lg`, `label-md` | Large and standard button and callout labels |
| `eyebrow` | The uppercase line above a heading |

Thirteen roles read one of the engine's type slots (`--ig-h1-font-size`). `body-xs` and `body-2xs` have no engine slot and hold their own values. Line height is a unitless multiple of the font size, so it follows a font size that a site overrides.

Four roles are fluid: `display-lg`, `display-md`, `display-sm` and `lead`. Each grows from a minimum in a 360px container to its full size in a 1280px one, and follows the nearest query container, or the viewport when it is in none.

| Role | 360px and narrower | 1280px and wider |
|---|---|---|
| `display-lg` | 36px | 52px |
| `display-md` | 30px | 43px |
| `display-sm` | 20px | 23px |
| `lead` | 17px | 19px |

**Type sets.** The sizes above are the ones www.infragistics.com ships. A documentation page needs the same roles smaller, so the package ships a second set, `docs`. Put `data-igd-type="docs"` on the page, or on a region, and every role takes its docs value. The faces stay the same.

| Role | Default | `docs` |
|---|---|---|
| `display-lg` | 52px (36px on a phone) | 36px |
| `display-md` | 43px (30px) | 24px |
| `display-sm` | 23px (20px) | 20px |
| `title-md`, `title-sm` | 18px, 16px | 16px, 14px |
| `body-lg`, `body-md`, `body-sm` | 16px, 15px, 14px | 16px, 14px, 12px |

The `docs` set is not fluid. `src/spec.ts` holds every value, in `TYPE_SETS`.

**Spacing** has two tiers. The steps are `space-3xs` … `space-6xl`; the name is a size, not a pixel value, because the live value follows the spacing and size dials. On top of them sit three roles, and these are what components use:

- `space-inset-{size}` for padding
- `space-stack-{size}` for vertical margins
- `space-gap-{size}` for gaps and inline margins

`space-section` is the vertical padding of a page section. It is fluid: `space-5xl` (64px) in a 360px container, `space-6xl` (96px) in a 1280px one.

## Theming

Set a dial on the root, or on an element with `data-ig-scope`, and every token below it follows. The package sets none of them: a site chooses. Unset, every token is at its design value.

The dials are the engine's, so an Ignite UI component reads them too. `--ig-size: 2` on the root makes the Ignite UI controls medium and also shrinks the design system's spacing and sizes (`--igd-space-md` goes from 16px to 14px).

A token is calculated where it is declared: on the root and on each `data-ig-scope`. So:

- Every component built on the design system puts `data-ig-scope` on its root element, in any framework. A component with shadow DOM puts it on its host element. A dial set on any ancestor then reaches it, as it reaches an Ignite UI component, which calculates on its own host. `docs/examples/card.html` is a component written this way.
- A dial on an element without `data-ig-scope` changes the Ignite UI components inside it and no design system token. Add the attribute to that element to change both.
- Change a dial, not a step. A step set on an element, such as `--igd-space-md: 20px`, is calculated again from the dials on the next `data-ig-scope` below it.

| Dial | Values |
|---|---|
| `--ig-size` | 1 small, 2 medium, 3 large. Unset, the tokens resolve at large |
| `--ig-spacing` | multiplier, default 1 |
| `--ig-radius-factor` | unset by default (each role takes its design value); 0 is each role's minimum, 1 its maximum |
| `--ig-elevation-factor` | multiplier, default 1 |
| `data-theme="dark"` | the dark variant, on the page or on one region |
| `data-ig-scope` | a component root, or a region that carries its own dials or base colours |
| `data-igd-type="docs"` | the type roles at documentation sizes, on the page or on one region |

**Brand colours.** `IGD_SEED_PRIMARY` and `IGD_SEED_SECONDARY` replace a seed for one build; CI builds the system with two other brand colours on every pull request and runs every gate on the result. The brand colours are a build input. The seeds live in `src/palette-sets.ts` (primary `#155dfc`, secondary `#9810fa`, info `#0099ff`); change one, run `npm run palettes` and `npm run build`, and the engine solves the whole ramp again for contrast. Nothing re-derives a ramp in the browser. The action fill, `color-action-default`, is the seed, and its label is the engine's contrast colour: black or white, whichever reads on the seed. The hover fill, `color-action-fill-hover`, is a step that label still reads on: primary step 700 under a white label, step 400 under a black one. Text in the action colour, `color-action-text`, reads primary step 600, because the engine solves each step to a fixed contrast for any seed (about 5.2:1 on white for step 600). The build stops when the engine warns that a seed or a scale cannot give a step its contrast.

**Derived colours.** Hover, active, focus, tint and shadow colours are computed from their base token, so nobody picks them by hand. Override a base token, on the page or on a `data-ig-scope` region, and its states follow. Text in the action colour or a status colour is not derived: it reads one engine step in the light variant and a lighter step of the same family in the dark variant. Fills keep the exact colour with a black or white label.

**Dark theme.** Built from the engine's dark palette. `[data-theme="dark"]` gives the engine's gray shades and surface roles their dark-palette values; every semantic name keeps its meaning.

**Dark areas.** An area that is dark in both variants uses the inverse surfaces: `color-surface-inverse-raised` (lightest), `color-surface-inverse` and `color-surface-inverse-sunken` (darkest), with `color-text-inverse` on top.

## Checks

`npm run check` runs all of them. A failure exits non-zero, so CI stops.

| Check | What it stops |
|---|---|
| `checks/lint.ts` | A hand-typed colour, size, duration or easing in a component source |
| `checks/check-vars.ts` | A `var()` that points at a token that does not exist. A custom property that a checked stylesheet declares itself counts as defined. |
| `checks/spacing-roles.ts` | A raw spacing step used for padding, a margin or a gap |
| `checks/gates-derived.ts` | A hover, focus or active colour that is not derived from its base, or a derived token that drifts from the engine's value |
| `checks/gates-themes.ts` | A colour pairing below WCAG AA, measured in a browser in the light and the dark variant. A translucent colour is measured over what is below it: the background over the page colour, the text over the background. `reports/contrast-pairs.json` lists the pairings |
| `checks/resolve.ts` | A token that resolves to nothing, or to an invalid colour or length, when a page loads the package, in the light and the dark variant |

The rules of the three source checks and the functions of the generator have unit tests in `src/*.test.ts` and `checks/*.test.ts`. `lint.ts`, `check-vars.ts`, `spacing-roles.ts` and `compare.ts` export their functions and do their file work only when they are the script Node was started with. The three browser gates are scripts.

### Checking a site

The package ships the `ig-design-system` command, which checks a site's own source:

```sh
npx ig-design-system check src
npx ig-design-system check src --ignore src/vendor --strict
```

| Rule | What it stops |
|---|---|
| `unknown-token` | A `var(--igd-*)` that neither the design system nor the site declares. A `var()` with a fallback is a hook a page may set, and is skipped. |
| `raw-palette` | Site code that reads a palette step, such as `var(--ig-gray-700)`. A site reads semantic tokens. |
| `palette-override` | Site code that declares a palette step, such as `--ig-primary-500`, which replaces the colour under every token built on it. |
| `spacing-role` | Padding, a margin or a gap that uses a raw step, not `space-inset-*`, `space-stack-*` or `space-gap-*`. |
| `colour-literal` | A hex colour typed in as a value. Only with `--strict`. |

Widths, heights and offsets are not checked: they are not part of the design system. The command exits non-zero when it finds something.

In CI, a site calls the reusable workflow:

```yaml
jobs:
  design-system:
    uses: IgniteUI/ig-design-system/.github/workflows/check-site.yml@1.0.0
    with:
      paths: src
```


## Repository layout

```
src/         the generator: spec.ts (the vocabulary), palette-sets.ts (the seeds), make.ts (the entry point), then one module per part of the output:
             typography.ts, layout.ts, shadows.ts, contrast.ts, derived.ts, engine-colors.ts, tokens-json.ts, stylesheets.ts, theme.ts.
             namespace.ts applies the --igd- prefix; dtcg.ts, llms.ts and migration.ts write the other files
checks/      the checks listed above
dist/        the generated package (committed, so a site can use it without building)
reports/     the contrast pairings and derived-colour data the gates read, and the contrast report of the last check run
reference/   React reference components and their stylesheet. They prove the tokens and feed the checks; they are not part of the package
docs/        ADOPTING.md: moving a site onto the package; MIGRATION.md: old token names to new ones;
             examples/card.html: one component written to the rules in plain HTML and CSS, quoted in llms.txt and checked by npm test
AGENTS.md    the decisions behind the code and the reason for each
```

To change a token, edit `src/spec.ts` (or the generator) and rebuild. The tables in `spec.ts` are typed, so a value in the wrong slot or an unknown opacity name fails `npm run typecheck`. Never edit a generated file by hand; CI fails when `dist/`, `docs/`, `reports/`, the two llms files or `src/palettes.json` differ from what the build writes.

## Build

Building the package requires Node 22.18 or newer. A site that only runs the compiled `ig-design-system` command needs Node 20 or newer. The generator and the checks are TypeScript and Node runs them directly, with no build step. The sources use erasable syntax only (no `enum`, no `namespace`, no parameter properties) and import each other with the `.ts` extension.

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

`AGENTS.md` lists what is not decided, under "Open".

## Adopting it in a site

`docs/ADOPTING.md` is the step-by-step guide, written from moving the marketing site and `igniteui-astro-components` onto the package.

## Releases

No release exists yet. A version will be a GitHub Release with the tag `X.Y.Z`: `.github/workflows/release.yml` then runs every CI job on the tag and publishes to npm; nobody publishes by hand. `CHANGELOG.md` lists what each version changes. A token value that changes, a token that is renamed or removed, and a file that leaves `dist/` take a major version.

## Licence

MIT, see `LICENSE`. The fonts in `dist/fonts/` are under the SIL Open Font License 1.1; each has its licence beside it.
