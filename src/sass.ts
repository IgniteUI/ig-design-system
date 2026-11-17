// Compiles Sass against the installed igniteui-theming package.
import * as sass from "sass";
import { fromRoot } from "./paths.ts";

/** Returns the CSS that the Sass `source` compiles to. */
export const compile = (source: string) =>
  sass.compileString(source, {
    loadPaths: [fromRoot("node_modules")],
    logger: sass.Logger.silent,
  }).css;
