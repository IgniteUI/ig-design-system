<!--
Title: Conventional Commits with a scope, naming the behaviour, e.g.
"feat(tokens): add space-inset-2xl" or "fix(checks): accept var() fallbacks in the literal lint".
Scopes: tokens, theme, seed, dtcg, checks, reference, docs, ci, build.
Delete the sections that do not apply.
-->

<!-- "Closes #123.", "Part of #123." or one sentence saying what changes and why. -->

## Problem

<!-- The symptom, then the exact cause. For a regression: why the checks did not catch it. -->

## Changes

<!--
One bullet per change, stated as the resulting rule:
"`space-inset-2xl` resolves to 32px at the large size and follows `--igd-spacing`."
Say what stays the same and how that was checked.
-->

## Type of change

<!-- Tick every box that applies. -->

- [ ] Token added
- [ ] Token value changed
- [ ] Token renamed or removed (breaking)
- [ ] Theme, dark theme or seed behaviour
- [ ] Check added or changed
- [ ] Reference component
- [ ] Docs only
- [ ] Build, tooling, CI or dependency update

## Token changes

<!--
Required when a token is added, changed, renamed or removed. Delete otherwise.
List light and dark when they differ.
-->

| Token | Before | After |
|---|---|---|
| `--color-…` | | |

## Consumer impact

<!--
The marketing site, Astro components, Blog, Docs and API docs load this package.
Say what each must change after upgrading, or "None".
A rename or removal needs its row in docs/MIGRATION.md.
-->

## Tests

<!--
The exact commands and their result, e.g.
`npm test`: literal lint clean, 58 pairings x 2 themes pass AA.
For a fix: the check or test that fails without it.
-->

## Screenshots

<!-- For a visible change: before and after, in the light and the dark theme. -->

## Checklist

- [ ] The change is in `src/` (or `checks/`, `reference/`), not hand-edited in `dist/`.
- [ ] `npm test` passes locally.
- [ ] `dist/` and `docs/` are rebuilt and committed; `git diff --exit-code -- dist docs` is clean after the build.
- [ ] New and changed tokens are semantic: the name says what the value is for, not what it is.
- [ ] Reference components use system tokens only, with no hand-typed colour, size, spacing, shadow or radius.
- [ ] Every new text or outline colour pairing is measured by `checks/gates-themes.ts` in both themes.
- [ ] A renamed or removed token has its row in `src/rename-map.ts` and `docs/MIGRATION.md`.
- [ ] The README is updated when a token tier, dial, check or package file changes.

## Notes for the reviewer

<!-- Trade-offs, known limits, follow-up issues. -->
