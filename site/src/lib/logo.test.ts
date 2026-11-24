import { describe, expect, it } from "vitest";
import { readLogo, rgb } from "./logo.ts";

describe("readLogo", () => {
  it("reads the size from the viewBox and each fill once, upper case and six digits", () => {
    expect(
      readLogo(
        '<svg viewBox="0 0 150 20.9"><path fill="#a8a8aa"/><path fill="#A8A8AA"/><rect fill="#fff"/></svg>',
        "x.svg",
      ),
    ).toEqual({
      width: 150,
      height: 20.9,
      fills: ["#A8A8AA", "#FFFFFF"],
      symbol: 0,
      wordmark: 0,
    });
  });

  it("reads the width of the symbol from the widest rectangle, and the start of the wordmark from the first shape right of it", () => {
    const logo = readLogo(
      '<svg viewBox="0 0 376.609 52.533"><path fill="#6D6E71" d="M80.039,43.2V7.6z"/><path fill="#6D6E71" d="M66.482,43.214V8.992z"/><rect x="0.024" y="-0.029" fill="#0099FF" width="57.398" height="52.56"/><rect x="8.93" y="8.918" fill="#FFFFFF" width="9.181" height="9.054"/><path fill="#FFF" d="M42.674,8.947z"/></svg>',
      "x.svg",
    );
    expect(logo.symbol).toBe(57.398);
    expect(logo.wordmark).toBe(66.482);
  });

  it("stops the build on a file with no viewBox, and names the file", () => {
    expect(() => readLogo('<svg><path fill="#000"/></svg>', "x.svg")).toThrow(
      "x.svg needs a viewBox of four numbers and at least one hex fill. The logo page reads its proportions and colours from them.",
    );
  });

  it("stops the build on a file with no hex fill", () => {
    expect(() => readLogo('<svg viewBox="0 0 1 1"/>', "x.svg")).toThrow(
      "x.svg needs a viewBox",
    );
  });
});

describe("rgb", () => {
  it("writes a hex colour as three decimal numbers", () => {
    expect(rgb("#0099FF")).toBe("0, 153, 255");
  });
});
