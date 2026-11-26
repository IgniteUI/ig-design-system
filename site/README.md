# Documentation site

The site of `ig-design-system`: Concepts, the Guide with its documents, the tokens, the engine and the brand book. An [Astro](https://astro.build) project. It is not part of the npm package.

## Commands

Run them here, or from the repository root as `npm run site:install`, `site:dev` and `site:verify`.

```sh
npm ci            # install
npm run dev       # http://localhost:4321, rebuilt as files change
npm run build     # type-check, then build into dist/
npm run verify    # build, check the tokens the site uses, test the built pages
```

The package must be built first: the site reads `../dist/`. `dist/` is committed, so a fresh checkout works.

## Where things are

| Folder | What it holds |
|---|---|
| `src/pages/` | One file per page. `[document].astro` makes a page for each Markdown document. |
| `src/layouts/` | `BaseLayout` is the document of every page. `SectionsLayout` adds the section list. |
| `src/components/` | `layout/` the top bar and sections, `ui/` pieces any page uses, `tokens/`, `guide/` and `logo/` pieces of one page. |
| `src/data/` | What the pages show: the page list, the documents, the featured tokens, the rules, the logo files. |
| `src/lib/` | Functions with tests. `design-system.ts` is the only module that imports from outside this folder. |
| `src/scripts/` | The browser scripts, one per behaviour. A component imports the script it needs. |
| `src/styles/global.css` | Element defaults and the few text styles more than one component uses. Everything else is scoped to its component. |
| `src/assets/logos/` | The logo files. |
| `integrations/` | The build step that copies the files `llms.txt` links to into the built site. |
| `tests/` | Tests of the built site: its HTML, and its behaviour in a browser. |

## Rules

- A page states nothing the package already states. Read tokens from `src/lib/design-system.ts`, never type a value or a count.
- Style with the design system's tokens only. `npm run verify` runs the design system's own check on `src/`.
- A link inside the site goes through `href()` in `src/lib/paths.ts`, so it works under the base path Pages serves the site at.
- Astro removes the whitespace between two inline elements. Write `{" "}` where a space must stay.

## Adding things

- **A page:** add `src/pages/<name>.astro` with `SectionsLayout`, and a line in `PAGES` in `src/data/navigation.ts` to list it in the top bar. Add its route to `ROUTES` in `tests/built.ts`.
- **A Markdown document as a page:** add a line to `DOCUMENTS` in `src/data/navigation.ts`. The file is rendered as it is.
- **A page of the Guide:** add `src/pages/guide/<name>.astro` with `SectionsLayout` and `guide`, a line in `GUIDE_PAGES` in `src/data/navigation.ts`, and its route to `ROUTES` and `GUIDE_ROUTES` in `tests/built.ts`.
- **A featured token in Concepts:** add its name to a list in `src/data/guide.ts`. A name that is not in `tokens.json` stops the build.
- **A behaviour:** add a script in `src/scripts/` and import it from the component that needs it. Dispatch `changed()` from `events.ts` when rendered values may have moved.

## Publishing

`.github/workflows/pages.yml` builds the site and publishes it to GitHub Pages. It passes the address Pages serves the site at as `SITE_URL` and `BASE_PATH`; without them the site builds for the root of `localhost`.
