import fs from "node:fs";
import path from "node:path";

/** Lists the files under `target` whose path matches `match`. A path `skip` returns true for is left out, with everything under it. */
export const walk = (
  target: string,
  match: RegExp,
  skip: (p: string) => boolean = () => false,
): string[] => {
  if (skip(target)) return [];
  if (!fs.statSync(target).isDirectory())
    return match.test(target) ? [target] : [];
  return fs
    .readdirSync(target)
    .flatMap((name) => walk(path.join(target, name), match, skip));
};
