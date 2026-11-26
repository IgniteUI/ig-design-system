// The rules of the check command. Its help, llms.txt, the site and the README table read this list.
/** A rule the check command reports: its id, what it reports and whether it needs --strict. */
export const CHECKS = [
    {
        id: "unknown-token",
        reports: "a var(--igd-*) that neither the design system nor the site declares",
        strict: false,
    },
    {
        id: "raw-palette",
        reports: "a palette step that site code reads, such as var(--ig-gray-700)",
        strict: false,
    },
    {
        id: "palette-override",
        reports: "a palette step that site code declares, such as --ig-primary-500",
        strict: false,
    },
    {
        id: "spacing-role",
        reports: "a raw spacing step on padding, a margin or a gap, where a spacing role belongs",
        strict: false,
    },
    {
        id: "colour-literal",
        reports: "a hex colour typed in by hand",
        strict: true,
    },
];
/** The files the check command reads, by extension. */
export const SOURCES = /\.(css|scss|sass|astro|jsx|tsx|ts|js|mjs|html|vue|svelte|mdx)$/;
/**
 * What the check command does not report, in plain words, each with a line it passes. llms.txt, the README and the site print `text`.
 * `file` is the kind of file the example sits in.
 */
export const NOT_CHECKED = [
    {
        text: "a `var()` with a fallback, which it reads as a hook a page may set; a typo in its name goes unreported",
        example: ".a { color: var(--igd-color-txt-body, inherit); }",
        file: "css",
    },
    {
        text: "a spacing role in the wrong property, such as a gap role on padding",
        example: ".a { padding: var(--igd-space-gap-md); }",
        file: "css",
    },
    {
        text: "a design-system token set on an element",
        example: ".a { --igd-space-md: 8px; }",
        file: "css",
    },
    {
        text: "a raw spacing step inside an HTML `style` attribute",
        example: '<div style="padding: var(--igd-space-sm)"></div>',
        file: "html",
    },
    {
        text: "widths, heights and offsets, which are typed by hand",
        example: ".a { max-width: var(--igd-space-6xl); }",
        file: "css",
    },
    {
        text: "Markdown files",
        example: "`padding: var(--ig-gray-700)`",
        file: "md",
    },
];
