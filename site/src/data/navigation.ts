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
    summary: "For a developer. Each old token name and its replacement.",
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
 * The pages the top bar lists, in order. `path` is from the site root. A page with `beta` carries a Beta label.
 * Developers opens the first document; the top bar marks it on every document page.
 */
export const PAGES: readonly {
  id: "guide" | "tokens" | "engine" | "logo" | "developers";
  path: string;
  title: string;
  beta?: boolean;
}[] = [
  { id: "guide", path: "", title: "Guide" },
  { id: "tokens", path: "tokens/", title: "Tokens" },
  { id: "engine", path: "engine/", title: "Engine" },
  { id: "logo", path: "logo/", title: "Brand book", beta: true },
  { id: "developers", path: `${DOCUMENTS[0].slug}/`, title: "Developers" },
];
export type PageId = (typeof PAGES)[number]["id"];
