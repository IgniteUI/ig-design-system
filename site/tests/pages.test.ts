import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TOKEN_FAMILIES } from "../../src/types.ts";
import { COBRAND_RULES, NAME_RULES, SOON } from "../src/data/brand.ts";
import { isEngine, readersOf } from "../src/lib/tokens.ts";
import {
  DIST,
  GUIDE_ROUTES,
  page,
  ROUTES,
  source,
  tokenPages,
} from "./built.ts";

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

  it.each(ROUTES.filter((r) => r !== ""))(
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
    expect(page("concepts/")).toMatch(/aria-current="page"[^>]*>\s*Concepts/);
    expect(page("tokens/")).toMatch(/aria-current="page"[^>]*>\s*Tokens/);
    expect(page("engine/")).toMatch(/aria-current="page"[^>]*>\s*Engine/);
    expect(page("logo/")).toMatch(
      /aria-current="page"[^>]*>\s*Brand book\s*<span[^>]*>Beta<\/span>/,
    );
  });

  it.each(GUIDE_ROUTES)(
    "marks Guide in the top bar on /%s, and Guide opens Set up a site",
    (route) => {
      const header = page(route).match(/<header.*?<\/header>/s)?.[0] ?? "";
      expect(header).toMatch(
        /<a href="\/guide\/" aria-current="page"[^>]*>\s*Guide\s*</,
      );
    },
  );

  it.each(GUIDE_ROUTES)(
    "/%s lists every page of the Guide in one menu, marks itself, and has no link back to Concepts",
    (route) => {
      const html = page(route);
      const menu =
        html.match(/<nav[^>]*class="side-nav"[^>]*>.*?<\/nav>/s)?.[0] ?? "";
      expect(menu.match(/<a /g)).toHaveLength(GUIDE_ROUTES.length);
      expect(menu).toContain(`href="/${route}" aria-current="page"`);
      expect(html).not.toContain("Back to the guide");
    },
  );

  it.each(GUIDE_ROUTES)(
    "/%s lists its sections under On this page",
    (route) => {
      expect(page(route)).toMatch(
        /<nav[^>]*aria-label="On this page"[^>]*>\s*<p class="heading"[^>]*>On this page<\/p>/,
      );
    },
  );
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
  const html = tokenPages();
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
      expect(html).toContain(`data-copy="--ig-surface-${role}"`);
  });

  it("lists a shaded family by its ten numbered shades", () => {
    expect(html.match(/data-copy="--ig-gray-\d+"/g)).toHaveLength(10);
  });

  it("lists under a palette step the tokens that read it, each linked to its filter on the Tokens page", () => {
    const row =
      html.match(
        /<li[^>]*data-filter-group[^>]*>\s*<span class="family"[^>]*><span[^>]*>--ig-<\/span>gray.*?<\/dl>/s,
      )?.[0] ?? "";
    expect(row).toMatch(
      /<dt[^>]*>500<\/dt>\s*<dd[^>]*>.*?<a href="\/tokens\/\?q=color-text-muted"[^>]*>.*?<code[^>]*>--igd-color-text-muted<\/code>\s*<\/a>/s,
    );
  });

  it("shows each token that reads a step with a swatch in its own colour", () => {
    expect(html).toMatch(
      /<a href="\/tokens\/\?q=color-text-muted"[^>]*>\s*<span class="swatch" style="background: var\(--igd-color-text-muted\)"/,
    );
  });

  it("says how many steps are read with a space between the numbers and the words", () => {
    expect(html).toMatch(/\d+ of the \d+ steps are read\./);
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

  it("makes each palette step findable, and copies the name it shows", () => {
    expect(html).toMatch(
      /<li[^>]*data-token="ig-primary-500"[^>]*>\s*<button[^>]*data-copy="--ig-primary-500"/,
    );
  });
});

describe("the guide", () => {
  const html = page("concepts/");

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
      html.match(/id="themes-light-dark".*?id="themes-dials"/s)?.[0] ?? "";
    expect(group).toMatch(/<p[^>]*class="notice inline"[^>]*role="note"/);
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

  it("shows a featured colour with its plain use on its option, not its technical note", () => {
    expect(html).toMatch(
      /data-pick="color-action-default".*?The fill of the main button\./s,
    );
  });

  it("names the class of each type role and the element it is meant for", () => {
    const role =
      html.match(/data-pick="type-display-lg".*?class="use"/s)?.[0] ?? "";
    expect(role).toContain('data-copy=".igd-type-display-lg"');
    expect(role).toContain("on &lt;h1&gt;");
    expect(role).not.toContain("--igd-type-display-lg-");
  });

  it("gives corners and shadows a section each, as the Tokens page does", () => {
    const list = html.match(/data-section-list.*?<\/ul>/s)?.[0] ?? "";
    expect(list).toContain('href="#corners"');
    expect(list).toContain('href="#shadows"');
    expect(list).not.toContain('href="#shape"');
  });

  it("says why a name says its job, in plain words, with the two kinds of name that use a position", () => {
    const part = html.match(/id="idea-names".*?id="colour"/s)?.[0] ?? "";
    expect(part).toContain("not the pill radius");
    expect(part).toContain("an ordered set");
    expect(part).toContain("8 colours of product tiles");
    expect(part).not.toContain("<code");
    expect(page("tokens/")).toContain('href="/concepts/#idea-names"');
  });

  it("draws a part of the page for every colour the colour explorer lists", () => {
    const explorer =
      html.match(/data-colour-explorer.*?id="colour-messages"/s)?.[0] ?? "";
    const picks = [...explorer.matchAll(/data-pick="([^"]+)"/g)].map(
      (m) => m[1],
    );
    const parts = new Set(
      [...explorer.matchAll(/data-part="([^"]+)"/g)].map((m) => m[1]),
    );
    expect(picks.length).toBe(19);
    expect(picks.filter((p) => !parts.has(p))).toEqual([]);
  });

  it("says what inverse means in the colour explorer", () => {
    expect(html).toContain("Inverse does not mean the dark variant.");
  });

  it("shows each message without the names of its tokens", () => {
    const messages = html.match(/<ul class="messages".*?<\/ul>/s)?.[0] ?? "";
    expect(messages).not.toContain("data-copy");
    expect(messages).not.toMatch(/--igd?-/);
  });

  it("labels every drawn example as an example, not a real component", () => {
    const labels = html.match(/<p[^>]*class="example"/g) ?? [];
    // The colour page, the type roles, the spacing cards, the corner and shadow drawings, the messages, the variant card and the dial preview.
    expect(labels).toHaveLength(8);
  });

  it("shows each message as an alert with an icon, a title and a text", () => {
    const messages = html.match(/<ul class="messages".*?<\/ul>/s)?.[0] ?? "";
    expect(messages.match(/<li /g)).toHaveLength(4);
    expect(messages.match(/<svg viewBox="0 0 24 24"/g)).toHaveLength(4);
    expect(messages).toContain("Payment failed");
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

  it("shows no section that is not written yet, in the page or in the section list", () => {
    const soon = Object.values(SOON).flat();
    expect(soon.length).toBeGreaterThan(0);
    for (const { id } of soon) {
      expect(html).not.toContain(`id="${id}"`);
      expect(html).not.toContain(`href="#${id}"`);
    }
    expect(html).not.toContain("Coming soon");
  });

  it("writes the name with the right and the wrong form of each rule", () => {
    for (const { right, wrong } of NAME_RULES)
      expect(html).toMatch(
        new RegExp(
          `<th scope="row"[^>]*>${right}</th>\\s*<td[^>]*>${wrong}</td>`,
        ),
      );
    expect(html).toContain("Infragistics, Inc.");
  });

  it("gives the rules for a logo beside a partner's, and no longer sends that case to an issue", () => {
    for (const { title } of COBRAND_RULES)
      expect(html).toContain(`>${title}</h3>`);
    expect(html).not.toContain("a partner logo beside it");
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
      "Naming convention",
      "Spacing scale",
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

describe("the components of the site", () => {
  const dir = path.join(path.dirname(DIST), "src/components");
  const files = fs
    .readdirSync(dir, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith(".astro"));

  it.each(files)(
    "%s marks its root with data-ig-scope, or its root is a component that does",
    (file) => {
      const body = fs
        .readFileSync(path.join(dir, file), "utf8")
        .split("---")
        .slice(2)
        .join("---")
        .replace(/<(script|style)[\s\S]*?<\/\1>/g, "");
      const root = body.match(/<[A-Za-z][^>]*>/)?.[0] ?? "";
      expect(/^<[A-Z]/.test(root) || root.includes("data-ig-scope"), root).toBe(
        true,
      );
    },
  );
});

describe("the landing page", () => {
  const html = page("");

  it("has no top bar, and opens with the logo and the welcome", () => {
    expect(html).not.toMatch(/<header[^>]*class="top"/);
    expect(html).toMatch(/<img[^>]*class="logo light"[^>]*alt="Infragistics"/);
    expect(html).toContain("<h1");
    expect(html).toContain("The Infragistics design system");
  });

  it("asks what you need, with one card per part of the site, in order", () => {
    const cards = [
      ...(html.match(/<ul[^>]*class="needs".*?<\/ul>/s)?.[0] ?? "").matchAll(
        /<a href="([^"]+)"[^>]*>\s*<strong[^>]*>([^<]+)<\/strong>/g,
      ),
    ].map((m) => `${m[2]} ${m[1]}`);
    expect(cards).toEqual([
      "I need guidance /guide/",
      "I want to explore /concepts/",
      "I need to learn /engine/",
      "I need an asset /logo/",
      "I am looking for a design token /tokens/",
    ]);
  });

  it.each(ROUTES.filter((r) => r !== ""))(
    "/%s leads back to it from the logo in the top bar",
    (route) => {
      expect(page(route)).toMatch(/<a[^>]*class="brand" href="\/"/);
    },
  );
});

describe("the pages of the Guide", () => {
  it("prints the install and check commands with the package's name on Set up a site", () => {
    expect(page("guide/")).toContain(`npm install ${pkg.name}`);
    expect(page("guide/")).toContain(`npx ${pkg.name} check src`);
  });

  it("names the optional stylesheets in a sentence, each as code", () => {
    expect(page("guide/")).toMatch(
      /<code[^>]*>fonts\.css<\/code> and <code[^>]*>base\.css<\/code> are optional\./,
    );
  });

  it("titles each rule in plain words, with the code under it", () => {
    const rule = page("guide/rules/").match(/id="rule-1".*?<\/li>/s)?.[0] ?? "";
    expect(rule.indexOf("Choose a colour by its job.")).toBeGreaterThan(-1);
    expect(rule.indexOf("Choose a colour by its job.")).toBeLessThan(
      rule.indexOf("color: var(--igd-color-text-muted);"),
    );
  });

  it("says which rules the check reports, with a space before the list", () => {
    expect(page("guide/rules/")).toMatch(
      /The check command reports rules 1 and 2, and rules 3 and 4 with <code[^>]*>--strict<\/code>\./,
    );
  });

  it("shows the example card of the package live on Build a component", () => {
    expect(page("guide/component/")).toMatch(
      /<iframe[^>]*src="\/docs\/examples\/card\.html"/,
    );
  });

  it("opens the migration guide with the move from the prototype as its first version", () => {
    expect(source("docs/MIGRATION.md")).toMatch(
      /^# Migration guide\n\n[^\n]+\n\n## From the prototype to 1\.0\n/,
    );
  });
});

describe("the Tokens page, by tier", () => {
  const html = tokenPages();

  it("says which tokens to use, which belong to one component and which not to use", () => {
    const legend = page("tokens/").match(/<dl.*?<\/dl>/s)?.[0] ?? "";
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
