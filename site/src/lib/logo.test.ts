import { describe, expect, it } from "vitest";
import { readLogo, rgb } from "./logo.ts";

describe("readLogo", () => {
  it("reads the size from the viewBox and each fill once, upper case and six digits", () => {
    expect(
      readLogo(
        '<svg viewBox="0 0 150 20.9"><path fill="#a8a8aa"/><path fill="#A8A8AA"/><rect fill="#fff"/></svg>',
        "x.svg",
      ),
    ).toEqual({ width: 150, height: 20.9, fills: ["#A8A8AA", "#FFFFFF"] });
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
