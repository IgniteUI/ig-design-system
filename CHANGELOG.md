# Changelog

Every release of `ig-design-system`. A version is a GitHub Release with the tag `X.Y.Z`; the release workflow publishes it to npm.

A token value that changes, a token that is renamed or removed, and a file that leaves `dist/` are breaking and take a major version.

## 1.0.0

The first version.

- `dist/tokens.css` and `dist/theme.css`: the engine palette under `--ig-*` and every design system token under `--igd-*`: colour, feedback, badges, spacing, radius, size, shadow, type roles, motion, breakpoints and layers, in one theme with a light and a dark variant.
- `dist/base.css`: optional element styles.
- `dist/fonts.css` and `dist/fonts/`: optional. Plus Jakarta Sans, DM Sans and JetBrains Mono, each with its SIL Open Font License.
- `dist/tokens.json` and `dist/infragistics.tokens.json`: the tokens as data, the second in the Design Tokens Community Group format.
- Two type sets: the default, with the sizes [www.infragistics.com](https://www.infragistics.com) ships, and `docs`, selected with `data-igd-type="docs"`.
- Colour names that read as a sentence: `color-{property}-{job}-{emphasis}-{state}`, the property being `foreground`, `background`, `border`, `focus` or `accent`, from the words in `src/naming.ts`.
- Feedback colours for error, success, warning and info: `color-foreground-{kind}`, `color-foreground-{kind}-inverse` for dark areas and `color-background-{kind}`.
- The `ig-design-system check` command and the reusable workflow `.github/workflows/check-site.yml`, which check a site's source: no unknown token, no raw palette step read or declared, spacing roles for padding, margins and gaps. `--help`, `llms.txt`, the README and the documentation site list what it reports and what it does not.
- `docs/examples/card.html` and `docs/examples/card.css`: a component written to the rules, which `llms.txt` and the documentation site print.
- `llms.txt` and `llms-full.txt`, generated on every build, for AI agents working with the tokens, importable as `ig-design-system/llms.txt` and `ig-design-system/llms-full.txt`. `ig-design-system/package.json` is exported too.
- Node.js 22 or newer for the `ig-design-system` command.
- The dials `--ig-size`, `--ig-spacing`, `--ig-radius-factor` and `--ig-elevation-factor` take effect on the root and on a `data-ig-scope` element. A component marks its root with `data-ig-scope`.
- The package has no dependencies. It is built with `igniteui-theming` 30.3.
