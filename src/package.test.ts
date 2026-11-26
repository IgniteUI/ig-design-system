import fs from "node:fs";
import { describe, expect, it } from "vitest";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

describe("the published package", () => {
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

  it("exports its manifest and the two files for AI agents", () => {
    expect(pkg.exports["./package.json"]).toBe("./package.json");
    expect(pkg.exports["./llms.txt"]).toBe("./llms.txt");
    expect(pkg.exports["./llms-full.txt"]).toBe("./llms-full.txt");
  });

  it("does not ship AGENTS.md, the guide to working in this repository, and llms.txt does not link to it", () => {
    expect(pkg.files).not.toContain("AGENTS.md");
    expect(fs.readFileSync("llms.txt", "utf8")).not.toContain("AGENTS.md");
  });

  it("asks for a Node.js version that is still supported", () => {
    expect(pkg.engines.node).toBe(">=22");
  });

  it("is not private and names its licence", () => {
    expect(pkg.private).toBeUndefined();
    expect(pkg.license).toBe("MIT");
    expect(fs.existsSync("LICENSE")).toBe(true);
  });
});
