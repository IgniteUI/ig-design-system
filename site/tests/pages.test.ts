import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TOKEN_FAMILIES } from "../../src/types.ts";
import { isEngine, readersOf } from "../src/lib/tokens.ts";
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
        const [address, hash] = url.split("#");
        const file = address.split("?")[0];
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
    "/%s carries the logo of each variant of the theme in the top bar, under one accessible name",
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
    expect(page("engine/")).toMatch(/aria-current="page"[^>]*>\s*Engine/);
    expect(page("logo/")).toMatch(
      /aria-current="page"[^>]*>\s*Brand book\s*<span[^>]*>Beta<\/span>/,
    );
  });
  it.each(ROUTES)(
    "/%s ends with the footer, which names the package and its version",
    (route) => {
      const footer = page(route).match(/<footer.*?<\/footer>/s)?.[0] ?? "";
      expect(footer).toContain(pkg.name);
      expect(footer).toContain(pkg.version);
    },
  );

  it.each(ROUTES)(
    "/%s starts with a link that skips to the content",
    (route) => {
      const html = page(route);
      expect(html).toMatch(/<body[^>]*>\s*<a[^>]*href="#content"/);
      expect(html).toContain(' id="content"');
    },
  );
});

describe("the Tokens page", () => {
  const html = page("tokens/");
  const shown = new Set(
    [...html.matchAll(/data-token="([^"]+)"/g)].map((m) => m[1]),
  );
  const listed: string[] = TOKEN_FAMILIES.flatMap((f) =>
    tokens[f].tokens.map((t: { name: string }) => t.name),
  );

  it("shows every token of tokens.json that is not on the Engine page", () => {
    expect(listed.filter((n) => !isEngine(n) && !shown.has(n))).toEqual([]);
  });

  it("shows no token of the Engine page", () => {
    expect([...shown].filter((n) => isEngine(n))).toEqual([]);
  });

  it("names the engine step a colour is built from and links to it", () => {
    const card =
      html.match(/<li[^>]*data-token="color-text-muted".*?<\/li>/s)?.[0] ?? "";
    expect(card).toMatch(
      /From <a href="\/engine\/#ig-gray-500"[^>]*><code[^>]*>--ig-gray-500<\/code><\/a>/,
    );
  });

  it("shows every type role", () => {
    const roles: string[] = tokens.type.groups.flatMap(
      (g: { styles: { name: string }[] }) => g.styles.map((s) => s.name),
    );
    expect(roles.filter((n) => !shown.has(n))).toEqual([]);
  });
});

describe("the Engine page", () => {
  const html = page("engine/");
  const shown = new Set(
    [...html.matchAll(/data-token="([^"]+)"/g)].map((m) => m[1]),
  );

  it("shows every palette step, raw spacing step and engine elevation of tokens.json", () => {
    const listed: string[] = TOKEN_FAMILIES.flatMap((f) =>
      tokens[f].tokens.map((t: { name: string }) => t.name),
    );
    expect(
      listed.filter(
        (n) => isEngine(n) && !n.endsWith("-contrast") && !shown.has(n),
      ),
    ).toEqual([]);
  });

  it("says first that a site does not write these values", () => {
    const main = html.match(/<main.*?<\/main>/s)?.[0] ?? "";
    expect(main.search(/Do not write them in a site/)).toBeLessThan(
      main.indexOf("data-token="),
    );
  });

  it("lists the surface in the palette by its four roles", () => {
    for (const role of ["base", "sunken", "raised", "overlay"])
      expect(html).toContain(`data-copy="var(--ig-surface-${role})"`);
  });

  it("lists a shaded family by its ten numbered shades", () => {
    expect(html.match(/data-copy="var\(--ig-gray-\d+\)"/g)).toHaveLength(10);
  });

  it("lists under a palette step the tokens that read it, each linked to its filter on the Tokens page", () => {
    const row =
      html.match(
        /<li[^>]*data-filter-group[^>]*>\s*<span class="family"[^>]*><span[^>]*>--ig-<\/span>gray.*?<\/dl>/s,
      )?.[0] ?? "";
    expect(row).toMatch(
      /<dt[^>]*>500<\/dt>\s*<dd[^>]*>.*?<a href="\/tokens\/\?q=color-text-muted"[^>]*><code[^>]*>--igd-color-text-muted<\/code><\/a>/s,
    );
  });

  it("counts the readers of a step in its label, and says when no token reads it", () => {
    const readers = readersOf(TOKEN_FAMILIES.flatMap((f) => tokens[f].tokens));
    const n = readers["ig-gray-500"].length;
    expect(html).toContain(
      `aria-label="Copy var(--ig-gray-500). Read by ${n} ${n === 1 ? "token" : "tokens"}."`,
    );
    const unread = tokens.color.tokens.find(
      (t: { name: string }) =>
        /^ig-[a-z]+-\d+$/.test(t.name) && !readers[t.name],
    );
    expect(html).toContain(
      `aria-label="Copy var(--${unread.name}). No token reads it."`,
    );
  });

  it("lists under a spacing step the roles that read it", () => {
    const row =
      html.match(/<tr[^>]*data-token="space-md".*?<\/tr>/s)?.[0] ?? "";
    expect(row).toContain('href="/tokens/?q=space-inset-md"');
  });

  it("makes each palette step findable and copyable by its bare name", () => {
    expect(html).toMatch(
      /<li[^>]*data-token="ig-primary-500"[^>]*>\s*<button[^>]*data-copy-alt="--ig-primary-500"/,
    );
  });
});

describe("the guide", () => {
  const html = page("");

  it("names each dial, its custom property and its default in plain words", () => {
    const panel =
      html.match(/<div class="panel".*?data-dial-reset/s)?.[0] ?? "";
    expect(
      [
        ...panel.matchAll(
          /<p class="name"[^>]*>\s*([^<]+?)\s*<code[^>]*>([^<]+)</g,
        ),
      ].map((m) => `${m[1]} ${m[2]}`),
    ).toEqual([
      "Size --ig-size",
      "Spacing --ig-spacing",
      "Roundness --ig-radius-factor",
      "Shadow --ig-elevation-factor",
    ]);
    expect(
      [...panel.matchAll(/<p class="default"[^>]*>\s*([^<]+?)\s*<\/p>/g)].map(
        (m) => m[1],
      ),
    ).toEqual([
      "Default: Large. A smaller size also tightens the spacing: Medium to 87.5%, Small to 75%.",
      "Default: Normal.",
      "Default: Standard. Buttons stay fully round and cards are gently rounded.",
      "Default: Normal.",
    ]);
  });

  it("says beside the dark example, in either variant, that the dark variant is not final", () => {
    const group =
      html.match(/id="themes-light-dark".*?<div class="themes"/s)?.[0] ?? "";
    expect(group).toMatch(/<p class="notice inline"[^>]*role="note"/);
    expect(group).toContain("The dark variant is not final.");
    expect(group).not.toContain("data-dark-notice");
  });

  it("presses at first the option that clears each dial", () => {
    const panel =
      html.match(/<div class="panel".*?data-dial-reset/s)?.[0] ?? "";
    expect(
      [
        ...panel.matchAll(
          /data-value(?:="")? [^>]*aria-pressed="true"[^>]*>\s*([^<]+?)\s*</g,
        ),
      ].map((m) => m[1]),
    ).toEqual(["Large", "Normal", "Standard", "Normal"]);
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
  it("titles each rule in plain words, with the code under it", () => {
    const rule = html.match(/id="rule-1".*?<\/li>/s)?.[0] ?? "";
    expect(rule.indexOf("Choose a colour by its job.")).toBeGreaterThan(-1);
    expect(rule.indexOf("Choose a colour by its job.")).toBeLessThan(
      rule.indexOf("color: var(--igd-color-text-muted);"),
    );
  });

  it("says what inverse means and shows each inverse text colour on the inverse surface", () => {
    const group = html.match(/id="colour-inverse".*?<\/ul>/s)?.[0] ?? "";
    expect(group).toContain("It is not the dark variant.");
    const card =
      group.match(/<li[^>]*data-token="color-text-inverse".*?<\/li>/s)?.[0] ??
      "";
    expect(card).toContain("background: var(--igd-color-surface-inverse)");
  });

  it("shows each corner and shadow pick with a CSS sample that uses its token", () => {
    for (const [token, line] of [
      ["radius-lg", "border-radius: var(--igd-radius-lg);"],
      ["shadow-raised", "box-shadow: var(--igd-shadow-raised);"],
    ]) {
      const info =
        html.match(new RegExp(`data-info="${token}".*?</pre>`, "s"))?.[0] ?? "";
      expect(info.replace(/<[^>]+>/g, "")).toContain(line);
    }
  });

  it("shows a featured token as its use, then its name", () => {
    const card = html.match(/data-token="radius-lg".*?<\/button>/s)?.[0] ?? "";
    expect(card.indexOf("A card or a picture frame.")).toBeGreaterThan(-1);
    expect(card.indexOf("A card or a picture frame.")).toBeLessThan(
      card.indexOf("data-copy="),
    );
  });

  it("marks a card that leaves the site", () => {
    const cards =
      html.match(/<a href="https:[^"]*"[^>]*>\s*<strong.*?<\/strong>/gs) ?? [];
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) expect(card).toContain("(leaves this site)");
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

describe("the documents", () => {
  const documents = [
    ["adopting/", "docs/ADOPTING.md"],
    ["migration/", "docs/MIGRATION.md"],
    ["changelog/", "CHANGELOG.md"],
  ] as const;
  const titleOf = (file: string) => source(file).match(/^# (.+)$/m)?.[1] ?? "";

  it.each(ROUTES)(
    "/%s links each document from the footer under the title of its file",
    (route) => {
      const footer = page(route).match(/<footer.*?<\/footer>/s)?.[0] ?? "";
      for (const [slug, file] of documents)
        expect(footer).toMatch(
          new RegExp(`href="/${slug}"[^>]*>\\s*${titleOf(file)}\\s*<`),
        );
    },
  );

  it.each(documents)(
    "/%s lists the three documents beside its sections and marks itself",
    (slug, file) => {
      const list =
        page(slug).match(/<ul[^>]*aria-label="Documents".*?<\/ul>/s)?.[0] ?? "";
      expect(list.match(/<a /g)).toHaveLength(3);
      expect(list).toMatch(
        new RegExp(`aria-current="page"[^>]*>\\s*${titleOf(file)}\\s*<`),
      );
    },
  );

  it.each(documents)("/%s marks no page of the top bar as open", (slug) => {
    const header = page(slug).match(/<header.*?<\/header>/s)?.[0] ?? "";
    expect(header).not.toContain("aria-current");
  });

  it.each(documents)(
    "/%s ends with links to the other documents and to the Tokens page",
    (slug) => {
      const next = page(slug).match(/<aside.*?<\/aside>/s)?.[0] ?? "";
      for (const [other] of documents)
        if (other !== slug) expect(next).toContain(`href="/${other}"`);
      expect(next).not.toContain(`href="/${slug}"`);
      expect(next).toContain('href="/tokens/"');
    },
  );

  it("links one document to another as a page, not as a file", () => {
    const article =
      page("migration/").match(/<article.*?<\/article>/s)?.[0] ?? "";
    expect(article).toMatch(
      /<a href="\/adopting\/"[^>]*>Moving a site onto the design system<\/a>/,
    );
    expect(article).not.toMatch(/href="[^"]*\.md"/);
  });

  it("makes every new name of the migration guide a button that copies it", () => {
    const article =
      page("migration/").match(/<article.*?<\/article>/s)?.[0] ?? "";
    const rows =
      source("docs/MIGRATION.md").match(/^\| `[^|]+\| `(--igd?-|\.igd-)/gm) ??
      [];
    expect(rows.length).toBeGreaterThan(200);
    expect(article.match(/class="copy-name"/g)).toHaveLength(rows.length);
  });

  it("splits the renames that are not colours into tables by kind", () => {
    const headings = [
      ...source("docs/MIGRATION.md").matchAll(/^### (.+)$/gm),
    ].map((m) => m[1]);
    expect(headings).toEqual([
      "Colour",
      "Size and layout",
      "Radius",
      "Weight and letter spacing",
      "Motion",
      "Layers",
      "Shadow and effects",
      "Type styles",
    ]);
  });
});

describe("the Tokens page, by tier", () => {
  const html = page("tokens/");

  it("says which tokens to use, which belong to one component and which not to use", () => {
    const legend = html.match(/<dl.*?<\/dl>/s)?.[0] ?? "";
    expect(
      [...legend.matchAll(/<dt[^>]*>([^<]*)<\/dt>/g)].map((m) => m[1].trim()),
    ).toEqual(["Use these", "One component only", "Do not use"]);
  });

  it("shows what a token is for before its name", () => {
    const card =
      html.match(/<li[^>]*data-token="color-text-muted".*?<\/li>/s)?.[0] ?? "";
    expect(card.indexOf("<p")).toBeGreaterThan(-1);
    expect(card.indexOf("<p")).toBeLessThan(card.indexOf("data-copy="));
  });

  it("prints the value of a shadow and of a gradient as it is written", () => {
    for (const family of [tokens.shadow.tokens, tokens.gradient.tokens]) {
      const token = family.find((t: { value: string }) =>
        t.value.includes("("),
      );
      const card =
        html.match(
          new RegExp(`<li[^>]*data-token="${token.name}".*?</li>`, "s"),
        )?.[0] ?? "";
      expect(card.replaceAll("&#39;", "'")).toContain(token.value);
    }
  });

  it("shows a size written in rem in pixels too", () => {
    const row =
      html.match(/<tr[^>]*data-token="border-width-default".*?<\/tr>/s)?.[0] ??
      "";
    expect(row).toContain("1px (0.0625rem)");
  });
});

describe("the backgrounds of the logo page", () => {
  const html = page("logo/");

  it("names each surface in plain words and says which logo it takes, before its token", () => {
    const samples = html.match(/<li[^>]*data-sample.*?<\/li>/gs) ?? [];
    expect(samples).toHaveLength(8);
    for (const sample of samples) {
      const use = sample.search(/Use the logo( for dark surfaces)?\./);
      expect(use).toBeGreaterThan(-1);
      expect(use).toBeLessThan(sample.indexOf("<code"));
    }
  });

  it("groups the usage pictures into what to do and what not to do", () => {
    const rules =
      html.match(/<section[^>]*id="rules".*?<\/section>/s)?.[0] ?? "";
    expect(
      [...rules.matchAll(/<h3[^>]*>(.*?)<\/h3>/g)].map((m) =>
        m[1].replace("&#39;", "'"),
      ),
    ).toEqual(["Do", "Don't"]);
  });
});

describe("the anatomy of the logo page", () => {
  it("states the width of the symbol and the gap after it as the file has them", () => {
    const svg = source("site/src/assets/logos/ig-logo.svg");
    const height = Number(
      svg.match(/viewBox="[\d.-]+ [\d.-]+ [\d.]+ ([\d.]+)"/)?.[1],
    );
    const symbol = Number(
      svg.match(/<rect[^>]*fill="#0099FF"[^>]*width="([\d.]+)"/)?.[1],
    );
    const start = Number(svg.match(/d="M([\d.]+),/)?.[1]);
    const round = (n: number) => Math.round(n * 100) / 100;
    const html = page("logo/");
    expect(html).toContain(`${round(symbol / height)} of the height`);
    expect(html).toContain(`${round((start - symbol) / height)} of the height`);
    expect(html).not.toContain("As wide as the logo is tall");
  });
});
