// The pages of the site and the documents it publishes.

/** The pages the top bar lists, in order. `path` is from the site root. */
export const PAGES = [
  { id: "guide", path: "", title: "Guide" },
  { id: "tokens", path: "tokens/", title: "Tokens" },
  { id: "logo", path: "logo/", title: "Logo" },
] as const;
export type PageId = (typeof PAGES)[number]["id"];

/** The Markdown documents of the package the site publishes as pages. `file` is from the repository root. */
export const DOCUMENTS = [
  {
    file: "docs/ADOPTING.md",
    slug: "adopting",
    title: "Moving an existing site",
    summary: "The steps, in order, and what to expect.",
  },
  {
    file: "docs/MIGRATION.md",
    slug: "migration",
    title: "Old token names",
    summary: "Each old name and its replacement.",
  },
  {
    file: "CHANGELOG.md",
    slug: "changelog",
    title: "What changed",
    summary: "Every release and what it changes.",
  },
] as const;
