// An Astro integration that copies files from outside the project into the built site.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Copies each path of `files`, a file or a directory under `from`, to the same path in the build output.
 * A path that does not exist stops the build.
 */
export const copyFiles = ({ from, files }) => ({
  name: "copy-files",
  hooks: {
    "astro:build:done": ({ dir, logger }) => {
      const out = fileURLToPath(dir);
      for (const file of files) {
        const source = path.resolve(from, file);
        if (!fs.existsSync(source))
          throw new Error(
            `copy-files: ${source} does not exist. Build the package first, or remove "${file}" from the list in astro.config.mjs.`,
          );
        fs.cpSync(source, path.join(out, file), { recursive: true });
      }
      logger.info(`copied ${files.length} paths from ${path.resolve(from)}`);
    },
  },
});
