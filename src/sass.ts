// Compiles Sass against the installed igniteui-theming package.
import * as sass from "sass";
import { fromRoot } from "./paths.ts";

/** Returns the CSS that the Sass `source` compiles to. Throws when the engine warns; a Sass deprecation notice is ignored. */
export const compile = (source: string) => {
  const warnings: string[] = [];
  const { css } = sass.compileString(source, {
    loadPaths: [fromRoot("node_modules")],
    // Reports each deprecation on its own, without a summary warning.
    verbose: true,
    logger: {
      warn: (message, { deprecation }) => {
        if (!deprecation) warnings.push(message);
      },
    },
  });
  if (warnings.length)
    throw new Error(
      `The engine warned while compiling: "${warnings.join('" "')}". A warning means a colour could not be built as asked. Pick another seed in src/palette-sets.ts or another scale in src/scales.json, then run npm run palettes.`,
    );
  return css;
};
