// The content collections of the site.
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { DOCUMENTS } from "./data/navigation.ts";

// The Markdown documents of the package, read where they are. One file is the GitHub document and the page.
const documents = defineCollection({
  loader: glob({
    base: "..",
    pattern: DOCUMENTS.map((d) => d.file),
    generateId: ({ entry }) => {
      const document = DOCUMENTS.find((d) => d.file === entry);
      if (!document)
        throw new Error(
          `${entry} is loaded as a document but is not listed in DOCUMENTS in site/src/data/navigation.ts.`,
        );
      return document.slug;
    },
  }),
});

export const collections = { documents };
