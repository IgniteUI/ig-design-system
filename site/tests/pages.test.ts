import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TOKEN_FAMILIES } from "../../src/types.ts";
import { DIST, page, ROUTES, source } from "./built.ts";

const tokens = JSON.parse(source("dist/tokens.json"));
const pkg = JSON.parse(source("package.json"));

describe("every page", () => {
  it.each(ROUTES)(
    "/%s links only to pages, sections and files that exist",
    (route) => {
      const html = page(route);
      const broken: string[] = [];
      for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        if (/^(https?:|data:|mailto:)/.test(url)) continue;
        const [file, hash] = url.split("#");
        const target = file ? path.join(DIST, file) : path.join(DIST, route);
        const index =
          fs.existsSync(target) && fs.statSync(target).isDirectory()
            ? path.join(target, "index.html")
            : target;
        if (!fs.existsSync(index)) broken.push(url);
        else if (
          hash &&
          index.endsWith(".html") &&
          !fs.readFileSync(index, "utf8").includes(` id="${hash}"`)
        )
          broken.push(url);
      }
      expect(broken).toEqual([]);
    },
  );

  it.each(ROUTES)("/%s sends nobody to a Markdown file on GitHub", (route) => {
    expect(page(route)).not.toMatch(/href="https:\/\/github\.com[^"]*\.md"/);
  });

  it.each(ROUTES)(
    "/%s carries the logo of each theme in the top bar, under one accessible name",
    (route) => {
      const header = page(route).match(/<header.*?<\/header>/s)?.[0] ?? "";
      expect(header).toContain('aria-label="Infragistics design system"');
      expect(
        header.match(/<img[^>]*class="logo (?:light|dark)"/g),
      ).toHaveLength(2);
    },
  );

  it("marks the open page in the top bar", () => {
    expect(page("")).toMatch(/aria-current="page"[^>]*>\s*Guide/);
    expect(page("tokens/")).toMatch(/aria-current="page"[^>]*>\s*Tokens/);
    expect(page("logo/")).toMatch(/aria-current="page"[^>]*>\s*Logo/);
  });
});

describe("the Tokens page", () => {
  const html = page("tokens/");
  const shown = new Set(
    [...html.matchAll(/data-token="([^"]+)"/g)].map((m) => m[1]),
  );

  it("shows every semantic and component token of tokens.json", () => {
    const listed: string[] = TOKEN_FAMILIES.flatMap((f) =>
      tokens[f].tokens.map((t: { name: string }) => t.name),
    );
    expect(listed.filter((n) => !n.startsWith("ig-") && !shown.has(n))).toEqual(
      [],
    );
  });

  it("shows every type role", () => {
    const roles: string[] = tokens.type.groups.flatMap(
      (g: { styles: { name: string }[] }) => g.styles.map((s) => s.name),
    );
    expect(roles.filter((n) => !shown.has(n))).toEqual([]);
  });

  it("lists the surface in the engine palette by its four roles", () => {
    for (const role of ["base", "sunken", "raised", "overlay"])
      expect(html).toContain(`data-copy="var(--ig-surface-${role})"`);
  });

  it("lists a shaded family by its ten numbered shades", () => {
    expect(html.match(/data-copy="var\(--ig-gray-\d+\)"/g)).toHaveLength(10);
  });
});

describe("the guide", () => {
  const html = page("");

  it("prints the card rule the page itself uses", () => {
    const rule = html.match(/<style>(\.card \{[^}]+\})<\/style>/)?.[1];
    expect(rule).toBeDefined();
    const printed = html.match(
      /<pre[^>]*><code[^>]*>(\.card \{[^<]+)<\/code>/,
    )?.[1];
    expect(printed).toBe(rule);
  });

  it("prints the install and check commands with the package's name", () => {
    expect(html).toContain(`npm install ${pkg.name}`);
    expect(html).toContain(`npx ${pkg.name} check src`);
  });

  it("names the optional stylesheets in a sentence, each as code", () => {
    expect(html).toMatch(
      /<\/strong> <code[^>]*>fonts\.css<\/code> and <code[^>]*>base\.css<\/code> are optional\./,
    );
  });

  it("shows a featured colour with its plain use, not its technical note", () => {
    expect(html).toMatch(
      /data-token="color-action-default".*?The fill of the main button\./s,
    );
  });
});

describe("the logo page", () => {
  const html = page("logo/");

  it("lists the four colours of the logo files with a button that copies each", () => {
    for (const hex of ["#0099FF", "#FFFFFF", "#6D6E71", "#A8A8AA"])
      expect(html).toContain(`data-copy="${hex}"`);
  });

  it("states the proportion of the logo file", () => {
    expect(html).toMatch(/<td class="value"[^>]*>7\.17 : 1<\/td>/);
  });

  it("offers each logo file as a download under its own name", () => {
    for (const file of ["ig-logo.svg", "ig-logo-dark.svg", "ig-logomark.svg"])
      expect(html).toContain(`download="${file}"`);
  });

  it("measures the lighter wordmark on a dark surface, with the minimum it must reach", () => {
    expect(html).toMatch(/data-contrast="#A8A8AA" data-min="3"/);
  });

  it("states the clear space and the smallest sizes as rules", () => {
    expect(html).toMatch(
      /Clear space<\/th><td class="value"[^>]*>half the height<\/td>/,
    );
    expect(html).toMatch(
      /Smallest logo<\/th><td class="value"[^>]*>16px tall<\/td>/,
    );
    expect(html).not.toMatch(/draft|proposal/i);
  });
});

describe("the files llms.txt links to", () => {
  it("are in the built site at the paths it links", () => {
    const links = [...source("llms.txt").matchAll(/\]\(([^)]+)\)/g)]
      .map((m) => m[1])
      .filter((l) => !/^https?:/.test(l));
    expect(links.length).toBeGreaterThan(0);
    expect(links.filter((l) => !fs.existsSync(path.join(DIST, l)))).toEqual([]);
  });
});
