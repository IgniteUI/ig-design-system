// Compares README.md and docs/ADOPTING.md with the modules that hold their facts.
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { CHECKS, NOT_CHECKED } from "../checks/rules.ts";
import type { Tokens } from "./types.ts";
import { DIALS } from "./usage.ts";

const readme = fs.readFileSync("README.md", "utf8");
const adopting = fs.readFileSync("docs/ADOPTING.md", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const tokens: Tokens = JSON.parse(fs.readFileSync("dist/tokens.json", "utf8"));
const theme = fs.readFileSync("dist/theme.css", "utf8");
const workflow = fs.readFileSync(".github/workflows/check-site.yml", "utf8");

const reports = (c: (typeof CHECKS)[number]) =>
  `${c.reports}${c.strict ? " (only with `--strict`)" : ""}`;
const px = (rem: string) => `${Number.parseFloat(rem) * 16}px`;
const styles = tokens.type.groups.flatMap((g) => g.styles);
const role = (name: string) => name.replace(/^type-/, "");

describe("the check rules in the documents", () => {
  it("README.md has a row for each rule of checks/rules.ts, in its order", () => {
    const rows = CHECKS.map((c) => `| \`${c.id}\` | ${reports(c)} |`);
    const found = rows.map((row) => readme.indexOf(row));
    expect(
      found.every((i) => i >= 0),
      rows.join("\n"),
    ).toBe(true);
    expect(found).toEqual([...found].sort((a, b) => a - b));
  });

  it("README.md lists what the command does not report", () => {
    for (const n of NOT_CHECKED) expect(readme).toContain(`- ${n.text}\n`);
  });

  it("docs/ADOPTING.md lists each rule of checks/rules.ts", () => {
    for (const c of CHECKS)
      expect(adopting).toContain(`- \`${c.id}\`: ${reports(c)}\n`);
  });
});

describe("the files of the package in README.md", () => {
  const table = readme.slice(0, readme.indexOf("## Documentation site"));

  it("names every entry of files in package.json", () => {
    for (const file of pkg.files as string[])
      if (file !== "dist") expect(table, file).toContain(file);
  });

  it("names every file under dist/ that package.json exports", () => {
    for (const target of Object.values(pkg.exports as Record<string, string>))
      if (target.startsWith("./dist/"))
        expect(table, target).toContain(target.slice(2));
  });
});

describe("the reusable workflow in the documents", () => {
  const inputs = [
    ...(workflow
      .slice(workflow.indexOf("inputs:"), workflow.indexOf("\njobs:"))
      .matchAll(/^ {6}([\w-]+):$/gm) ?? []),
  ].map((m) => m[1]);

  it("has inputs to compare with", () => {
    expect(inputs).toContain("paths");
  });

  it("README.md names each input", () => {
    for (const input of inputs) expect(readme).toContain(`\`${input}\``);
  });

  it.each([
    ["README.md", readme],
    ["docs/ADOPTING.md", adopting],
  ])(
    "%s calls the workflow by its path and only with its inputs",
    (_, text) => {
      const snippet = text.match(/```yaml\n([\s\S]*?)```/)?.[1] ?? "";
      expect(snippet).toContain(
        "uses: IgniteUI/ig-design-system/.github/workflows/check-site.yml@",
      );
      const given = [
        ...snippet.slice(snippet.indexOf("with:")).matchAll(/^ {6}([\w-]+):/gm),
      ].map((m) => m[1]);
      expect(given.length).toBeGreaterThan(0);
      for (const key of given) expect(inputs).toContain(key);
    },
  );
});

describe("the type tables in README.md", () => {
  it("count the type styles of tokens.json", () => {
    expect(readme).toContain(`**Type** has ${styles.length} styles`);
  });

  it("give each fluid role its minimum and its full size", () => {
    const fluid = styles.filter((s) => s.fontSizeMin);
    expect(fluid.length).toBeGreaterThan(0);
    for (const s of fluid)
      expect(readme).toContain(
        `| \`${role(s.name)}\` | ${px(s.fontSizeMin ?? "")} | ${px(s.fontSize)} |`,
      );
  });

  it("give each role of the type set table its default and its docs size", () => {
    const docs = new Map(
      (tokens.type.sets.docs ?? []).map((s) => [s.name, s.fontSize]),
    );
    const table = readme.slice(readme.indexOf("| Role | Default | `docs` |"));
    const rows = table.slice(0, table.indexOf("\n\n")).split("\n").slice(2);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const [, names, defaults, small] = row.split("|").map((c) => c.trim());
      const roles = [...names.matchAll(/`([\w-]+)`/g)].map((m) => m[1]);
      const sizes = (cell: string) =>
        [...cell.replace(/\([^)]*\)/g, "").matchAll(/(\d+)px/g)].map(
          (m) => `${m[1]}px`,
        );
      const byRole = (name: string) =>
        styles.find((s) => role(s.name) === name);
      expect(sizes(defaults), row).toEqual(
        roles.map((r) => px(byRole(r)?.fontSize ?? "")),
      );
      expect(sizes(small), row).toEqual(
        roles.map((r) => px(docs.get(`type-${r}`) ?? "")),
      );
    }
  });
});

describe("the dials", () => {
  it.each(DIALS.map((d) => [d]))(
    "%s is read by theme.css, left unset, and listed in README.md",
    (dial) => {
      expect(theme).toContain(`var(${dial}`);
      expect(theme).not.toMatch(new RegExp(`(?<![\\w-])${dial}\\s*:`));
      expect(readme).toContain(`| \`${dial}\` |`);
    },
  );
});
