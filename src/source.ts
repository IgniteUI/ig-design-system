// Says in words where a colour comes from. llms-full.txt and the Tokens pages print it.
import type { Source } from "./types.ts";

/** The short label of a source, for the label a Tokens row shows. */
export const SOURCE_LABEL: Record<Source["kind"], string> = {
  step: "Engine step",
  palette: "Engine palette",
  token: "Same as",
  opacity: "Derived",
  contrast: "Adaptive contrast",
};

/** A source in plain words, with token and step names in backticks. */
export const sourceText = (source: Source): string => {
  switch (source.kind) {
    case "step":
      return `the engine step \`${source.step}\``;
    case "palette":
      return `step ${source.step} of the engine's ${source.palette} palette, which the package does not publish`;
    case "token":
      return `the value of \`${source.token}\``;
    case "opacity":
      return `\`${source.token}\` at ${source.percent}%`;
    case "contrast":
      return `the engine's adaptive contrast: white or black, whichever reads on \`${source.on}\``;
  }
};
