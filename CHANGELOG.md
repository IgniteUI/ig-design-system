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
- Feedback colours for error, success, warning and info, each with an `-inverse` for dark surfaces and a tinted `-surface`.
- The `ig-design-system check` command and the reusable workflow `.github/workflows/check-site.yml`, which check a site's source: no unknown token, no raw palette step read or declared, spacing roles for padding, margins and gaps.
- `llms.txt` and `llms-full.txt`, generated on every build, for AI agents working with the tokens.
- The dials `--ig-size`, `--ig-spacing`, `--ig-radius-factor` and `--ig-elevation-factor` take effect on the root and on a `data-ig-scope` element. A component marks its root with `data-ig-scope`.
- The package has no dependencies. It is built with `igniteui-theming` 30.2.
