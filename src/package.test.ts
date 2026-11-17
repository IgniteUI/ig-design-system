import fs from "node:fs";
import { describe, expect, it } from "vitest";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

describe("the published package", () => {
  it("ships only dist/", () => {
    expect(pkg.files).toEqual(["dist"]);
  });

  it("has no dependencies, so installing it installs nothing else", () => {
    expect(pkg.dependencies).toBeUndefined();
    expect(pkg.peerDependencies).toBeUndefined();
  });

  it("exports files that exist in dist/", () => {
    for (const [name, file] of Object.entries<string>(pkg.exports))
      expect(fs.existsSync(file), name).toBe(true);
  });

  it("exports every stylesheet and token file in dist/", () => {
    const exported = Object.values<string>(pkg.exports);
    for (const f of fs
      .readdirSync("dist")
      .filter((n) => /\.(css|json)$/.test(n)))
      expect(exported, f).toContain(`./dist/${f}`);
  });

  it("ships the compiled command its bin entry names", () => {
    for (const [name, file] of Object.entries<string>(pkg.bin)) {
      expect(fs.existsSync(file), name).toBe(true);
      expect(
        fs.readFileSync(file, "utf8").startsWith("#!/usr/bin/env node"),
      ).toBe(true);
    }
  });

  it("ships a licence beside every font file", () => {
    const fonts = fs.readdirSync("dist/fonts");
    for (const f of fonts.filter((n) => n.endsWith(".woff2")))
      expect(fonts, f).toContain(
        `${f.replace(/-latin-wght-normal\.woff2$/, "")}-LICENSE.txt`,
      );
  });

  it("is not private and names its licence", () => {
    expect(pkg.private).toBeUndefined();
    expect(pkg.license).toBe("MIT");
    expect(fs.existsSync("LICENSE")).toBe(true);
  });
});
