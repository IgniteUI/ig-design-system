# Moving a site onto the design system

What was learned moving the marketing site and `igniteui-astro-components` onto the package. Follow the steps in order; each one can be checked before the next.

## 1. Install and load

```sh
npm install ig-design-system
```

Import the stylesheets before every stylesheet of the site, in this order:

```css
@import 'ig-design-system/fonts.css'; /* optional */
@import 'ig-design-system/tokens.css';
@import 'ig-design-system/theme.css';
```

- **Order matters.** A site stylesheet loaded before `theme.css` loses to it. One loaded after wins when its selector is at least as specific: `theme.css` declares on `:root`, so override on `:root`, not on `html`.
- **`fonts.css`** loads Plus Jakarta Sans, DM Sans and JetBrains Mono from the package. Leave it out when the site already loads those families, for example from Google Fonts. Loading both fetches each face twice.
- **`base.css`** sets `body`, headings, links and focus. Load it only on a site with no element styles of its own.
- **A documentation site** puts `data-igd-type="docs"` on `<html>`. The default type set is the marketing site's.

## 2. Stop defining what the design system defines

Remove from the site, or it overrides the design system for every token built on top:

- its own palette: any `--ig-primary-*`, `--ig-secondary-*`, `--ig-gray-*`, `--ig-surface-*`, `--ig-info-*`, `--ig-success-*`, `--ig-warn-*` or `--ig-error-*` declaration, and any Sass `palette()` include;
- its own type scale: `typography()` with a type scale, or `--ig-h1-font-size` and the like;
- its own elevations: `elevations()`.

A site that renders Ignite UI components keeps `sizing()` and `spacing()`, or sets `--ig-size` itself. The package leaves the dials unset on purpose.

## 3. Point the site's token names at the design system

Do this in two passes. The first is small and proves the look; the second is mechanical.

1. **Alias.** Keep the site's names and give each the design system token as its value: `--site-ink: var(--igd-color-text-heading);`. Nothing else in the site changes.
2. **Rename.** Replace every read of an old name with the design system name, then delete the aliases.

Choosing the token:

- Choose by **role**, not by the nearest colour. Text is `color-text-*`, a fill is `color-surface-*`, a line is `color-border-*`. A gray used as a border and the same gray used as text are two different tokens.
- A **step number does not carry over**. The palette's steps are solved for contrast, so `success-900` is near-black here where another ramp had a green. Compare the rendered colour, never the number.
- A site name with **no token** keeps its value. List those; each is a question for the design system, not a reason to pick the closest token.
- A name the site **sets on a scope** (a wider gutter on one page) sets the design system name on that scope after the rename.

## 4. Spacing, radius and what is not a token

- Padding is `space-inset-*`, a vertical margin `space-stack-*`, a gap or inline margin `space-gap-*`.
- A value that is not on the scale stays typed until design decides: do not round it silently.
- **Widths, heights and offsets are not tokens.** Leave them typed.

## 5. Check it

```sh
npx ig-design-system check src
```

Run it on the site's source. It reports:

- `unknown-token`: a var(--igd-*) that neither the design system nor the site declares
- `raw-palette`: a palette step that site code reads, such as var(--ig-gray-700)
- `palette-override`: a palette step that site code declares, such as --ig-primary-500
- `spacing-role`: a raw spacing step on padding, a margin or a gap, where a spacing role belongs
- `colour-literal`: a hex colour typed in by hand (only with `--strict`)

`--ignore <text>` skips every path that contains the text.

In CI, a site calls the reusable workflow of this package:

```yaml
jobs:
  design-system:
    uses: IgniteUI/ig-design-system/.github/workflows/check-site.yml@1.0.0
    with:
      paths: src
```

Then compare the pages. A token name that resolves to nothing fails silently, so measure. From a checkout of this repository, with the site running before and after the change on two ports:

```sh
npm run compare -- http://localhost:4321 http://localhost:4322 /@1440 /@390 /pricing@1440
```

It reports, per page, the element count, the page height, horizontal overflow, and every difference grouped by property and value. Run it against a production build when you can: a dev server adds its own elements and can report a difference that is not there. Compare:

- before and after each pass, the computed font, size, colours, radius and box size of every element on a set of pages, at a desktop and a phone width;
- a rename must show no difference at all;
- the alias pass shows only the differences between the two systems: write them down, they are the visible change of the migration.

## What to expect

- **Fonts** change only if the site used other faces.
- **Grays** shift by a few units: the palette is neutral, and a blue-tinted gray becomes a neutral one.
- **One size per role.** Near-duplicate sizes (41px, 43px and 47px headings) collapse into the role's size.
- **A larger exported stylesheet** if the site exports part of itself to other sites: it now carries tokens. Drop the custom properties the exported part does not read.
- **The dark variant** is the design system's. Review it separately; it is not the old site's dark mode with new names.
