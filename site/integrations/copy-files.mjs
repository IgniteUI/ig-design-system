// An Astro integration that publishes files from outside the project: copied into the build, served by the dev server.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TYPES = {
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
};

/**
 * Publishes each path of `files`, a file or a directory under `from`, at the same path of the site.
 * A path that does not exist stops the build.
 */
export const copyFiles = ({ from, files }) => {
  const root = path.resolve(from);
  // The file under `root` a request path names, when it is one of `files` or inside one of them.
  const published = (urlPath) => {
    const rel = decodeURIComponent(urlPath).replace(/^\/+/, "");
    if (!files.some((f) => rel === f || rel.startsWith(`${f}/`))) return undefined;
    const file = path.join(root, rel);
    return file.startsWith(root) && fs.existsSync(file) && fs.statSync(file).isFile() ? file : undefined;
  };

  return {
    name: "copy-files",
    hooks: {
      "astro:server:setup": ({ server, config }) => {
        const base = config.base.replace(/\/$/, "");
        server.middlewares.use((req, res, next) => {
          const url = (req.url ?? "").split("?")[0];
          const file = url.startsWith(`${base}/`) ? published(url.slice(base.length)) : undefined;
          if (!file) return next();
          res.setHeader("Content-Type", TYPES[path.extname(file)] ?? "application/octet-stream");
          fs.createReadStream(file).pipe(res);
        });
      },
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
        logger.info(`copied ${files.length} paths from ${root}`);
      },
    },
  };
};
