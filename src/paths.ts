// Resolves paths from the repository root, whatever directory Node is started in.
import path from "node:path";

export const ROOT = path.join(import.meta.dirname, "..");

/** The absolute path of a file named from the repository root. */
export const fromRoot = (...parts: string[]) => path.join(ROOT, ...parts);
