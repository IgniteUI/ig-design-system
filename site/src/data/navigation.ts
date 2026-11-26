// The pages of the site and the documents it publishes.

/**
 * The Markdown documents of the package the site publishes as pages. `file` is from the repository root.
 * `title` is the first-level heading of the file; the build stops when they differ. `filter` adds a filter over the document's tables.
 */
export const DOCUMENTS: readonly {
  file: string;
  slug: string;
  title: string;
  summary: string;
  filter?: boolean;
}[] = [
  {
    file: "docs/ADOPTING.md",
    slug: "adopting",
    title: "Moving a site onto the design system",
    summary: "For a developer. The steps, in order, and what to expect.",
  },
  {
    file: "docs/MIGRATION.md",
    slug: "migration",
    title: "Migration guide",
    summary: "What to change in a site when you move to a new major version.",
    filter: true,
  },
  {
    file: "CHANGELOG.md",
    slug: "changelog",
    title: "Changelog",
    summary: "Every release and what it changes.",
  },
];

/**
 * The pages of the Guide, in order: its own pages, then the documents. `path` is from the site root.
 * The Guide's menu lists them, and the top bar marks Guide on each.
 */
export const GUIDE_PAGES: readonly {
  path: string;
  title: string;
  summary: string;
}[] = [
  {
    path: "guide/",
    title: "Set up a site",
    summary: "Install the package, load the stylesheets, run the check.",
  },
  {
    path: "guide/component/",
    title: "Build a component",
    summary: "The four steps, and a card written to the rules.",
  },
  {
    path: "guide/rules/",
    title: "Rules",
    summary: "What to write and what not to, and what the check reports.",
  },
  ...DOCUMENTS.map((d) => ({
    path: `${d.slug}/`,
    title: d.title,
    summary: d.summary,
  })),
];

/**
 * The pages of Tokens, in order: the overview, then one page per family. `id` is the family's route, `/tokens/<id>/`.
 * The families are the sections of the old single page; tokens/[family].astro renders each.
 */
export const TOKEN_FAMILY_PAGES = [
  { id: "colour", title: "Colour" },
  { id: "type", title: "Type" },
  { id: "spacing", title: "Spacing" },
  { id: "radius", title: "Radius" },
  { id: "shadow", title: "Shadow" },
  { id: "gradient", title: "Gradient" },
  { id: "size", title: "Size" },
  { id: "other", title: "Opacity, weight, layers, breakpoints" },
] as const;
export type TokenFamilyId = (typeof TOKEN_FAMILY_PAGES)[number]["id"];

/** The menus of the sections that have one, each with its title and its pages. `path` is from the site root. */
export const MENUS = {
  guide: { title: "Guide", pages: GUIDE_PAGES },
  tokens: {
    title: "Tokens",
    pages: [
      { path: "tokens/", title: "Overview" },
      ...TOKEN_FAMILY_PAGES.map((f) => ({
        path: `tokens/${f.id}/`,
        title: f.title,
      })),
    ],
  },
} as const;
export type MenuId = keyof typeof MENUS;

/** The pages the top bar lists, in order. `path` is from the site root. A page with `beta` carries a Beta label. */
export const PAGES: readonly {
  id: "concepts" | "guide" | "tokens" | "engine" | "logo";
  path: string;
  title: string;
  beta?: boolean;
}[] = [
  { id: "concepts", path: "concepts/", title: "Concepts" },
  { id: "guide", path: GUIDE_PAGES[0].path, title: "Guide" },
  { id: "tokens", path: "tokens/", title: "Tokens" },
  { id: "engine", path: "engine/", title: "Engine" },
  { id: "logo", path: "logo/", title: "Brand book", beta: true },
];
export type PageId = (typeof PAGES)[number]["id"];
