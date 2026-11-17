import { describe, expect, it } from "vitest";
import { compile } from "./sass.ts";

describe("compile", () => {
  it("rejects a source that warns, quoting the warning and naming the fix", () => {
    expect(() =>
      compile(
        "@warn 'Shade \"primary-700\" wanted 7:1 but its hue only reaches 5:1.';\na { b: c; }\n",
      ),
    ).toThrow(
      'The engine warned while compiling: "Shade "primary-700" wanted 7:1 but its hue only reaches 5:1.". A warning means a colour could not be built as asked. Pick another seed in src/palette-sets.ts or another scale in src/scales.json, then run npm run palettes.',
    );
  });

  it("compiles a source whose only notice is a Sass deprecation", () => {
    expect(compile("a { b: if(true, c, d); }\n")).toContain("b: c");
  });

  it("compiles the engine, whose own code raises deprecation notices", () => {
    expect(
      compile(
        "@use 'igniteui-theming' as *;\na { b: #{contrast(#fff, #000)}; }\n",
      ),
    ).toContain("b: 21");
  });
});
