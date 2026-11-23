// The documentation site. SITE_URL and BASE_PATH come from the Pages workflow; without them the site builds for the root of localhost.
import { defineConfig } from "astro/config";
import { copyFiles } from "./integrations/copy-files.mjs";
import { satteri } from "@astrojs/markdown-satteri";
import { documentMarkdown } from "./integrations/document-markdown.mjs";
import { DOCUMENTS } from "./src/data/navigation.ts";

const base = process.env.BASE_PATH || "/";

export default defineConfig({
  site: process.env.SITE_URL,
  base,
  trailingSlash: "always",
  markdown: {
    // Code is coloured through custom properties, which the document page sets from the tokens.
    shikiConfig: { theme: "css-variables" },
    processor: satteri({
      hastPlugins: [documentMarkdown({ documents: DOCUMENTS, base: base.endsWith("/") ? base : `${base}/` })],
    }),
  },
  // Reads dist/, docs/ and src/ of the package, one folder up.
  vite: { server: { fs: { allow: [".."] } } },
  integrations: [
    // The files llms.txt links to, at the paths it links them.
    copyFiles({
      from: "..",
      files: [
        "llms.txt",
        "llms-full.txt",
        "README.md",
        "AGENTS.md",
        "CHANGELOG.md",
        "dist",
        "docs/ADOPTING.md",
        "docs/MIGRATION.md",
        "docs/examples",
      ],
    }),
  ],
});
