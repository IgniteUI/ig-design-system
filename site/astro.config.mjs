// The documentation site. SITE_URL and BASE_PATH come from the Pages workflow; without them the site builds for the root of localhost.
import { defineConfig } from "astro/config";
import { copyFiles } from "./integrations/copy-files.mjs";

export default defineConfig({
  site: process.env.SITE_URL,
  base: process.env.BASE_PATH || "/",
  trailingSlash: "always",
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
