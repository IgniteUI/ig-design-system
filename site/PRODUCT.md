# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three audiences, with equal weight. No one of them wins when their needs differ; a page serves all three.

- Marketing and content people who build or brief pages for the Infragistics sites. They do not read code.
- Designers who choose colours, type and spacing and check them against the system.
- Developers who write the CSS and components of the Infragistics sites and look up exact token names.

AI agents are a fourth reader. They are served by `llms.txt` and `llms-full.txt`, not by the pages.

## Product Purpose

The site documents `ig-design-system`, the design tokens of the Infragistics sites: colour, type, spacing, radius, size, shadow and the logo.

The job it makes fastest is learning the rules: how the system works and what is allowed, before someone starts work on a page or a component. Looking up one token, getting the logo, and setting up or migrating a site come after that.

Success is that nobody has to open the repository or a Markdown file on GitHub to use the design system correctly.

## Positioning

The site is built from the design system it documents. Every value on it is read from the package at build time or measured in the browser, so the documentation cannot disagree with what ships.

## Operating Context

- The reader arrives with a concrete piece of work: a page to build, a component to style, a logo to place.
- A token name is copied from the site into CSS, a design file or a brief.
- The site is published on GitHub Pages as a private site: only people with access to the repository can open it.
- The package it documents is installed by the marketing site and by `igniteui-astro-components`, which carries it to the docs, the API docs and the blog.

## Capabilities and Constraints

- Pages: the guide, Tokens, Engine, the Brand book (the Logo page: the name, the logo, co-branding and accessibility, with the sections still to be written marked Coming soon), and one page per Markdown document (`ADOPTING.md`, `MIGRATION.md`, `CHANGELOG.md`).
- Built with Astro as a static site. Nothing the build writes is committed.
- Nothing the site shows is typed twice. Tokens come from `dist/tokens.json`, documents from their Markdown files, the package name and repository from `package.json`.
- The site is light by default, whatever the system colour scheme. A switch in the top bar turns on the dark variant of the theme.
- The site has no components of its own to publish. The design system ships tokens, not components.
- Terms: a token is a name for a design decision; a role is what a spacing or type token is for; a dial is one of the four engine properties that move every token below it; a scope is an element marked `data-ig-scope`.
- Undecided: whether the Tokens page becomes editable, so that a non-developer changes a value and gets a pull request.
- Undecided: whether the site becomes public.

## Brand Commitments

- It reads as Infragistics: part of www.infragistics.com, not a separate product with its own identity.
- It is built only from its own tokens: no colour, spacing or type value of its own. The logo keeps its own colours.
- The Infragistics logo is used from its files, by the rules on the Logo page.
- Plain language first. Every page explains itself to a reader who does not know CSS; technical detail comes second.

## Evidence on Hand

- `../dist/tokens.json`: every token with its value and usage note.
- `../docs/ADOPTING.md`, `../docs/MIGRATION.md`, `../CHANGELOG.md`: the documents.
- `src/assets/logos/`: the three logo files, copied from the marketing site.
- `../reports/`: the measured contrast of every text and outline colour, in both variants of the theme.
- There are no testimonials, usage numbers or case studies. Do not write any.

## Product Principles

1. Explain by job, not by value. A reader chooses "the muted text colour", not a hex code.
2. Show the real thing. An example on the site is the token or the file itself, rendered, never a drawing of it.
3. One source. A fact is stated once, in the package, and the site reads it.
4. Every reader, one page. Plain words first, exact names one click away.
5. Checked, not promised. A rule the site states is one the build or a test enforces.

## Accessibility & Inclusion

WCAG 2.1 AA on every page: contrast, keyboard use and screen-reader support. Motion is turned off for a reader who asks for reduced motion.
