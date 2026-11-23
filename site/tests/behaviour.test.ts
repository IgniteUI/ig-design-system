import { type Browser, chromium, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ROUTES, source } from "./built.ts";
import { serve } from "./server.ts";

let browser: Browser;
let site: Awaited<ReturnType<typeof serve>>;

beforeAll(async () => {
  site = await serve();
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser?.close();
  await site?.stop();
});

const open = async (
  route: string,
  width = 1280,
  colorScheme: "light" | "dark" = "light",
) => {
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    colorScheme,
  });
  const problems: string[] = [];
  page.on("pageerror", (e) => problems.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(m.text());
  });
  page.on("response", (r) => {
    if (r.status() >= 400) problems.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(`${site.origin}/${route}`);
  await page.evaluate(() => document.fonts.ready);
  return { page, problems };
};

const cardStyle = (page: Page) =>
  page.evaluate(() => {
    const card = document.querySelector("#dial-stage .card");
    if (!card) throw new Error("no card in #dial-stage");
    const style = getComputedStyle(card);
    return {
      padding: style.paddingTop,
      radius: style.borderTopLeftRadius,
      shadow: style.boxShadow,
    };
  });

describe("every page in a browser", () => {
  it.each(
    ROUTES.flatMap(
      (route) =>
        [
          [route, 1280],
          [route, 390],
        ] as const,
    ),
  )(
    "/%s at %ipx loads without an error, a failed request or sideways scroll",
    async (route, width) => {
      const { page, problems } = await open(route, width);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      );
      await page.close();
      expect(problems).toEqual([]);
      expect(overflow).toBe(0);
    },
  );
});

describe("the theme button", () => {
  it("switches the page to the dark theme and shows the logo for dark surfaces", async () => {
    const { page } = await open("");
    const shown = () =>
      page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("header .logo")]
          .filter((logo) => logo.offsetParent !== null)
          .map((logo) => logo.className.match(/light|dark/)?.[0]),
      );
    expect(await shown()).toEqual(["light"]);
    await page.click("[data-theme-toggle]");
    expect(await page.getAttribute("html", "data-theme")).toBe("dark");
    expect(await page.getAttribute("[data-theme-toggle]", "aria-pressed")).toBe(
      "true",
    );
    expect(await shown()).toEqual(["dark"]);
    await page.close();
  });

  it("is an icon button named for the theme it turns on", async () => {
    const { page } = await open("");
    const toggle = page.locator("[data-theme-toggle]");
    expect(await toggle.getAttribute("aria-label")).toBe("Dark theme");
    expect((await toggle.textContent())?.trim()).toBe("");
    expect(await toggle.locator("svg:visible").getAttribute("class")).toContain(
      "moon",
    );
    await toggle.click();
    expect(await toggle.locator("svg:visible").getAttribute("class")).toContain(
      "sun",
    );
    await page.close();
  });

  it("starts in the light theme even when the system is dark", async () => {
    const { page } = await open("", 1280, "dark");
    expect(await page.getAttribute("html", "data-theme")).toBe("light");
    await page.close();
  });

  it("keeps the dark theme on the next page once it is chosen, and returns to light when switched back", async () => {
    const { page } = await open("");
    await page.click("[data-theme-toggle]");
    await page.goto(`${site.origin}/tokens/`);
    expect(await page.getAttribute("html", "data-theme")).toBe("dark");
    await page.click("[data-theme-toggle]");
    await page.reload();
    expect(await page.getAttribute("html", "data-theme")).toBe("light");
    await page.close();
  });
});

describe("the hero of the guide", () => {
  it("draws its picture in the tokens of the theme, so it follows the page into the dark theme", async () => {
    const { page } = await open("");
    const colours = () =>
      page.evaluate(() => {
        const token = (name: string) => {
          const probe = document.createElement("i");
          probe.style.color = `var(${name})`;
          document.body.appendChild(probe);
          const colour = getComputedStyle(probe).color;
          probe.remove();
          return colour;
        };
        const panel = document.querySelector(".hero svg .panel");
        const action = document.querySelector(".hero svg .action");
        if (!panel || !action) throw new Error("no drawing in the hero");
        return {
          panel: getComputedStyle(panel).fill,
          action: getComputedStyle(action).fill,
          panelToken: token("--igd-color-surface-card"),
          actionToken: token("--igd-color-action-default"),
        };
      });
    const light = await colours();
    expect(light.panel).toBe(light.panelToken);
    expect(light.action).toBe(light.actionToken);
    await page.click("[data-theme-toggle]");
    const dark = await colours();
    expect(dark.panel).toBe(dark.panelToken);
    expect(dark.panel).not.toBe(light.panel);
    await page.close();
  });

  it("types no colour in its picture", async () => {
    const { page } = await open("");
    const typed = await page.evaluate(
      () =>
        [...document.querySelectorAll(".hero svg *")].filter(
          (el) =>
            el.hasAttribute("fill") ||
            el.hasAttribute("stroke") ||
            el.hasAttribute("style"),
        ).length,
    );
    expect(typed).toBe(0);
    await page.close();
  });

  it("shows its picture beside the rules on a wide screen and leaves it out on a phone", async () => {
    const picture = async (width: number) => {
      const { page } = await open("", width);
      const result = await page.evaluate(() => {
        const rules = document
          .querySelector(".hero ol")
          ?.getBoundingClientRect();
        const svg = document.querySelector(".hero svg");
        if (!rules || !svg) throw new Error("no hero rules or picture");
        const box = svg.getBoundingClientRect();
        return {
          shown: box.width > 0,
          beside: box.left > rules.right && box.top < rules.bottom,
        };
      });
      await page.close();
      return result;
    };
    expect(await picture(1280)).toEqual({ shown: true, beside: true });
    expect((await picture(390)).shown).toBe(false);
  });

  it("links each rule to its examples and moves focus there", async () => {
    const { page } = await open("");
    const links = await page.$$eval(".hero ol a", (all) =>
      all.map((a) => a.getAttribute("href")),
    );
    expect(links).toEqual([
      "#rule-1",
      "#rule-2",
      "#rule-3",
      "#rule-4",
      "#rule-5",
      "#rule-6",
    ]);
    const title = await page.textContent(".hero ol li:nth-child(3) a");
    await page.click(".hero ol li:nth-child(3) a");
    const rule = await page.textContent("#rule-3");
    expect(rule).toContain(title?.replace(/^\s*3\s*/, "").trim());
    expect(rule).toContain("color: #1a5fff;");
    await page.close();
  });
});

describe("the skip link", () => {
  it("is the first Tab stop and moves focus to the content", async () => {
    const { page } = await open("");
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.textContent)).toBe(
      "Skip to the content",
    );
    await page.keyboard.press("Enter");
    expect(await page.evaluate(() => document.activeElement?.id)).toBe(
      "content",
    );
    await page.close();
  });
});

describe("the section list", () => {
  it("fills the row of the section in view with the action colour", async () => {
    const { page } = await open("tokens/");
    await page.click('[data-section-nav] a[href="#spacing"]');
    // The jump scrolls smoothly, and the row is marked once the scroll ends.
    await page.waitForSelector(
      '[data-section-nav] a[href="#spacing"][aria-current="true"]',
    );
    const rows = await page.evaluate(() =>
      [
        ...document.querySelectorAll<HTMLAnchorElement>(
          "[data-section-nav] li a",
        ),
      ].map((a) => ({
        hash: a.hash,
        fill: getComputedStyle(a).backgroundColor,
        border: getComputedStyle(a).borderInlineStartWidth,
        current: a.getAttribute("aria-current"),
      })),
    );
    const action = await page.evaluate(() => {
      const probe = document.createElement("i");
      probe.style.backgroundColor = "var(--igd-color-action-default)";
      document.body.appendChild(probe);
      const colour = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return colour;
    });
    expect(rows.filter((r) => r.fill === action).map((r) => r.hash)).toEqual([
      "#spacing",
    ]);
    expect(rows.find((r) => r.hash === "#spacing")?.current).toBe("true");
    expect(rows.every((r) => r.border === "0px")).toBe(true);
    await page.close();
  });
});

describe("the section list on a phone", () => {
  it.each([
    [390, "at the top of the screen, where the top bar scrolls away"],
    [800, "under the top bar"],
  ])(
    "at %ipx stays %s, as one row, and keeps the section in view visible in it",
    async (width) => {
      const { page } = await open("", width);
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = "auto";
        document.getElementById("rules")?.scrollIntoView();
      });
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-section-nav] a[aria-current="true"]')
            ?.getAttribute("href") === "#rules",
      );
      const result = await page.evaluate(() => {
        const nav = document.querySelector("[data-section-nav]");
        const header = document.querySelector("header");
        const current = nav?.querySelector('a[aria-current="true"]');
        const list = current?.closest("ul");
        if (!nav || !header || !current || !list)
          throw new Error("no section list");
        const row = list.getBoundingClientRect();
        const link = current.getBoundingClientRect();
        const tops = [...list.querySelectorAll("a")].map(
          (a) => a.getBoundingClientRect().top,
        );
        return {
          underBar:
            Math.abs(
              nav.getBoundingClientRect().top -
                Math.max(0, header.getBoundingClientRect().bottom),
            ) <= 1,
          oneRow: new Set(tops).size === 1,
          scrolls: list.scrollWidth > list.clientWidth,
          inView: link.left >= row.left && link.right <= row.right,
          sideways: document.documentElement.scrollWidth - window.innerWidth,
        };
      });
      expect(result).toEqual({
        underBar: true,
        oneRow: true,
        scrolls: true,
        inView: true,
        sideways: 0,
      });
      await page.close();
    },
  );
});

describe("the type set button", () => {
  it.each(["", "tokens/"])(
    "on /%s changes the type list only, not the rest of the page",
    async (route) => {
      const { page } = await open(route);
      const sizes = () =>
        page.evaluate(() => {
          const sample = document.querySelector(
            '[data-type-sample="igd-type-display-lg"]',
          );
          const heading = document.querySelector("main h2");
          if (!sample || !heading) throw new Error("no sample or heading");
          return {
            sample: getComputedStyle(sample).fontSize,
            heading: getComputedStyle(heading).fontSize,
          };
        });
      const before = await sizes();
      await page.click("button[data-type-set]");
      const after = await sizes();
      expect(after.sample).toBe("36px");
      expect(after.sample).not.toBe(before.sample);
      expect(after.heading).toBe(before.heading);
      expect(await page.getAttribute("html", "data-igd-type")).toBeNull();
      expect(
        await page.textContent('output[data-type="igd-type-display-lg"]'),
      ).toMatch(/^36px/);
      await page.close();
    },
  );
});

describe("the guide", () => {
  it("prints the card rule the page itself uses", async () => {
    const { page } = await open("");
    const { rule, printed } = await page.evaluate(() => ({
      rule: [...document.querySelectorAll("style")]
        .map((style) => style.textContent ?? "")
        .find((css) => css.startsWith(".card {")),
      printed: [...document.querySelectorAll("pre code")]
        .map((code) => code.textContent ?? "")
        .find((code) => code.startsWith(".card {")),
    }));
    expect(rule).toBeDefined();
    expect(printed).toBe(rule);
    await page.close();
  });
});

describe("the dials of the guide", () => {
  it("move the card and its readout, and no dial is set on the card", async () => {
    const { page } = await open("");
    expect(await cardStyle(page)).toMatchObject({
      padding: "20px",
      radius: "16px",
    });

    await page.click('button[data-dial="--ig-spacing"][data-value="0.5"]');
    expect((await cardStyle(page)).padding).toBe("10px");
    expect(await page.textContent("#dial-stage output")).toBe("10px");

    await page.click('button[data-dial="--ig-radius-factor"][data-value="0"]');
    expect((await cardStyle(page)).radius).toBe("0px");

    await page.click(
      'button[data-dial="--ig-elevation-factor"][data-value="0"]',
    );
    expect((await cardStyle(page)).shadow).toMatch(/0px 0px 0px 0px/);

    await page.click('button[data-dial="--ig-spacing"][data-value=""]');
    expect((await cardStyle(page)).padding).toBe("20px");
    expect(await page.getAttribute("#dial-stage .card", "style")).toBeNull();
    await page.close();
  });

  it("returns every dial to the design value with the reset button", async () => {
    const { page } = await open("");
    await page.click('button[data-dial="--ig-spacing"][data-value="0.5"]');
    await page.click('button[data-dial="--ig-radius-factor"][data-value="0"]');
    await page.click("button[data-dial-reset]");
    expect(await cardStyle(page)).toMatchObject({
      padding: "20px",
      radius: "16px",
    });
    expect(await page.getAttribute("#dial-stage", "style")).toBeFalsy();
    expect(
      await page.$$eval('button[data-dial][aria-pressed="true"]', (all) =>
        all.map((b) => b.getAttribute("data-value")),
      ),
    ).toEqual(["", "", "", ""]);
    await page.close();
  });

  it("keeps the card of a light region light when the page is dark", async () => {
    const { page } = await open("");
    await page.click("[data-theme-toggle]");
    const fills = await page.evaluate(() =>
      [
        ...document.querySelectorAll(
          '[data-theme="light"] article.card, [data-theme="dark"] article.card',
        ),
      ].map((card) => getComputedStyle(card).backgroundColor),
    );
    expect(fills[0]).toBe("rgb(255, 255, 255)");
    expect(fills[1]).not.toBe("rgb(255, 255, 255)");
    await page.close();
  });
});

describe("the filter of the Tokens page", () => {
  it("sits above the section list, not in the top bar", async () => {
    const { page } = await open("tokens/");
    expect(await page.locator("[data-section-nav] [data-filter]").count()).toBe(
      1,
    );
    expect(await page.locator("header [data-filter]").count()).toBe(0);
    await page.close();
  });

  it("keeps the tokens whose name or note has the word, and counts them", async () => {
    const { page } = await open("tokens/");
    const all = await page.locator("[data-token]:visible").count();
    await page.fill("[data-filter]", "hover");
    const kept = await page.locator("[data-token]:not([hidden])").count();
    expect(kept).toBeGreaterThan(0);
    expect(kept).toBeLessThan(all);
    expect(await page.textContent("[data-filter-matches]")).toBe(
      `${kept} matches`,
    );
    expect(await page.locator("#radius").isHidden()).toBe(true);

    await page.fill("[data-filter]", "no-such-token-xyz");
    expect(await page.locator("[data-filter-empty]").isVisible()).toBe(true);
    await page.close();
  });

  it("writes the rendered value beside a token", async () => {
    const { page } = await open("tokens/");
    expect(
      await page.textContent('[data-token="color-action-default"] output'),
    ).toMatch(/^#[0-9a-f]{6}$/);
    expect(await page.textContent('[data-token="space-md"] output')).toBe(
      "16px",
    );
    await page.close();
  });
});

describe("a document page", () => {
  it.each([
    ["adopting/", "docs/ADOPTING.md"],
    ["migration/", "docs/MIGRATION.md"],
    ["changelog/", "CHANGELOG.md"],
  ])(
    "/%s has every heading of %s, in order, and lists its sections",
    async (route, file) => {
      const headings = [...source(file).matchAll(/^(#{1,3}) (.+)$/gm)].map(
        ([, level, text]) => ({
          level: level.length,
          text: text.replaceAll("`", ""),
        }),
      );
      expect(headings.length).toBeGreaterThan(1);
      const { page } = await open(route);
      const plain = (texts: string[]) =>
        texts.map((t) => t.trim().replaceAll("’", "'"));
      expect(
        plain(await page.locator("article :is(h1, h2, h3)").allTextContents()),
      ).toEqual(plain(headings.map((h) => h.text)));
      expect(
        plain(await page.locator("[data-section-list] li").allTextContents()),
      ).toEqual(
        plain(
          headings
            .filter((h) => h.level === 2 || h.level === 3)
            .map((h) => h.text),
        ),
      );
      await page.close();
    },
  );
});

describe("the logo page", () => {
  it("measures the contrast of the logo on every surface, and no wordmark is too low", async () => {
    const { page } = await open("logo/");
    const readouts = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("output[data-contrast]")].map(
        (o) => ({
          text: o.textContent,
          low: o.hasAttribute("data-low"),
        }),
      ),
    );
    expect(readouts).toHaveLength(16);
    for (const r of readouts) expect(r.text).toMatch(/^\d+(\.\d)?:1$/);
    expect(readouts.filter((r) => r.low)).toEqual([]);
    await page.close();
  });
});

describe("a copy button", () => {
  it("copies the custom property and reports it", async () => {
    const context = await browser.newContext({
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    await page.goto(`${site.origin}/tokens/`);
    await page.click('[data-token="color-text-muted"] button[data-copy]');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "var(--igd-color-text-muted)",
    );
    expect(await page.textContent("[data-toast]")).toBe(
      "Copied var(--igd-color-text-muted)",
    );
    await context.close();
  });
  it("copies the bare name when Alt is held, and says what a click copies", async () => {
    const context = await browser.newContext({
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    await page.goto(`${site.origin}/`);
    const button = '[data-token="color-text-muted"] button[data-copy]';
    expect(await page.getAttribute(button, "aria-label")).toBe(
      "Copy var(--igd-color-text-muted)",
    );
    await page.click(button, { modifiers: ["Alt"] });
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "--igd-color-text-muted",
    );
    await context.close();
  });

  it("says what to do when the copy fails", async () => {
    const { page } = await open("");
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: () => Promise.reject(new Error("denied")) },
      });
    });
    await page.click('[data-token="color-text-muted"] button[data-copy]');
    expect(await page.textContent("[data-toast]")).toBe(
      "Could not copy var(--igd-color-text-muted). Select the text and copy it by hand.",
    );
    await page.close();
  });
});

// The WCAG contrast ratio of two CSS colours, read in the page.
const contrast = (page: Page, a: string, b: string) =>
  page.evaluate(
    ([a, b]) => {
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) throw new Error("no canvas");
      const luminance = (colour: string) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = colour;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = [...ctx.getImageData(0, 0, 1, 1).data]
          .slice(0, 3)
          .map((v) => {
            const c = v / 255;
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const [x, y] = [luminance(a), luminance(b)];
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    },
    [a, b],
  );

describe("a jump to a section on a narrow screen", () => {
  it.each([
    ["tokens/", "#spacing", 390],
    ["logo/", "#rules", 390],
    ["adopting/", "#5-check-it", 390],
    ["", "#type", 800],
  ])(
    "/%s%s at %ipx shows the heading below the sticky rows",
    async (route, hash, width) => {
      const { page } = await open(route, width);
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = "auto";
      });
      await page.click(`[data-section-list] a[href="${hash}"]`);
      await page.waitForTimeout(100);
      const result = await page.evaluate((hash) => {
        const target = document.getElementById(hash.slice(1));
        const heading = target?.matches("h2, h3")
          ? target
          : target?.querySelector("h2");
        const nav = document.querySelector("[data-section-nav]");
        if (!heading || !nav) throw new Error("no heading or section list");
        return {
          heading: heading.getBoundingClientRect().top,
          rows: nav.getBoundingClientRect().bottom,
        };
      }, hash);
      expect(result.heading).toBeGreaterThanOrEqual(result.rows);
      expect(result.heading).toBeLessThan(result.rows + 40);
      await page.close();
    },
  );
});

describe("keyboard focus on the Tokens page", () => {
  it("draws the focus ring on a control that opens a note and on the fold of the component colours", async () => {
    const { page } = await open("tokens/");
    const ring = (selector: string) =>
      page.evaluate((selector) => {
        const el = document.querySelector<HTMLElement>(selector);
        if (!el) throw new Error(`no ${selector}`);
        el.focus({ focusVisible: true } as FocusOptions);
        const style = getComputedStyle(el);
        return `${style.outlineStyle} ${style.outlineWidth}`;
      }, selector);
    expect(await ring("[data-token] details summary")).toBe("solid 3px");
    expect(await ring("details.fold summary")).toBe("solid 3px");
    await page.close();
  });

  it("names the fold of the component colours with what it shows", async () => {
    const { page } = await open("tokens/");
    expect(
      (
        await page.locator("details.fold summary .closed").textContent()
      )?.trim(),
    ).toMatch(/^Show the \d+ component colours$/);
    await page.close();
  });
});

describe("the tables of the Tokens page on a phone", () => {
  it("keep every token name whole: a name breaks only after a hyphen", async () => {
    const { page } = await open("tokens/", 390);
    const broken = await page.evaluate(() =>
      [
        ...document.querySelectorAll<HTMLElement>(
          "table [data-token] th button .text",
        ),
      ]
        .filter((name) => {
          const range = document.createRange();
          range.selectNodeContents(name);
          const lines = new Set(
            [...range.getClientRects()].map((r) => Math.round(r.top)),
          );
          return lines.size > 2;
        })
        .map((name) => name.textContent),
    );
    expect(broken).toEqual([]);
    await page.close();
  });
});

describe("the filter of the Tokens page, beyond names", () => {
  it("finds a token by its rendered value", async () => {
    const { page } = await open("tokens/");
    await page.fill("[data-filter]", "#155dfc");
    expect(
      await page.locator('[data-token="color-action-default"]').isVisible(),
    ).toBe(true);
    expect(await page.textContent("[data-filter-matches]")).toMatch(
      /^\d+ match/,
    );
    await page.close();
  });

  it("counts the matches of each section in the section list, and puts the totals back", async () => {
    const { page } = await open("tokens/");
    const count = () =>
      page
        .locator('[data-section-list] a[href="#radius"] .count')
        .evaluate((el) => el.firstChild?.textContent?.trim());
    const total = await count();
    await page.fill("[data-filter]", "radius-full");
    expect(await count()).toBe("1");
    await page.fill("[data-filter]", "");
    expect(await count()).toBe(total);
    await page.close();
  });

  it("opens the component colours for a match there, and closes them again when cleared", async () => {
    const { page } = await open("tokens/");
    const open_ = () =>
      page
        .locator("details.fold")
        .evaluate((d) => (d as HTMLDetailsElement).open);
    expect(await open_()).toBe(false);
    await page.fill("[data-filter]", "footer");
    expect(await open_()).toBe(true);
    await page.fill("[data-filter]", "");
    expect(await open_()).toBe(false);
    await page.close();
  });

  it("applies the filter of the address, and writes the filter to it", async () => {
    const { page } = await open("tokens/?q=radius-full");
    await page.waitForFunction(
      () =>
        document.querySelector("[data-filter-matches]")?.textContent ===
        "1 match",
    );
    await page.fill("[data-filter]", "inset");
    expect(new URL(page.url()).searchParams.get("q")).toBe("inset");
    await page.close();
  });

  it("shows the first match when the reader filters from further down the page", async () => {
    const { page } = await open("tokens/");
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      document.getElementById("size")?.scrollIntoView();
    });
    await page.fill("[data-filter]", "action");
    expect(
      await page
        .locator('[data-token="color-action-default"]')
        .evaluate((el) => {
          const box = el.getBoundingClientRect();
          return box.top >= 0 && box.top < innerHeight;
        }),
    ).toBe(true);
    await page.close();
  });
});

describe("a preview on the Tokens page", () => {
  it("shows a text colour for dark surfaces on the dark surface, readable", async () => {
    const { page } = await open("tokens/");
    const colours = await page
      .locator('[data-token="color-text-inverse"] .preview')
      .evaluate((el) => {
        const style = getComputedStyle(el);
        return [style.color, style.backgroundColor];
      });
    expect(await contrast(page, colours[0], colours[1])).toBeGreaterThan(4.5);
    await page.close();
  });
});

describe("the usage pictures of the logo page", () => {
  it.each([320, 390, 768, 1024, 1280, 1920])(
    "at %ipx cut nothing but the picture that shows a crop",
    async (width) => {
      const { page } = await open("logo/", width);
      const cut = await page.evaluate(
        () =>
          [...document.querySelectorAll<HTMLElement>("#rules .picture")]
            .filter(
              (picture) => !picture.querySelector(".crop, .stretch, .rotate"),
            )
            .filter((picture) => {
              const box = picture.getBoundingClientRect();
              return [...picture.querySelectorAll("img, span")].some((el) => {
                const inner = el.getBoundingClientRect();
                return (
                  inner.left < box.left - 0.5 || inner.right > box.right + 0.5
                );
              });
            }).length,
      );
      expect(cut).toBe(0);
      await page.close();
    },
  );
});

describe("a logo on the logo page", () => {
  it.each([390, 768, 1280])(
    "at %ipx keeps the proportion of its file in a narrow card",
    async (width) => {
      const { page } = await open("logo/", width);
      const ratios = await page.evaluate(() =>
        [
          ...document.querySelectorAll<HTMLImageElement>(
            "#files img, #backgrounds img, #rules .plain img",
          ),
        ].map((img) => {
          const box = img.getBoundingClientRect();
          return Math.abs(
            box.width / box.height - img.naturalWidth / img.naturalHeight,
          );
        }),
      );
      expect(ratios.length).toBeGreaterThan(8);
      expect(Math.max(...ratios)).toBeLessThan(0.05);
      await page.close();
    },
  );

  it("draws the clear space with a line that reaches 3:1 against its panel", async () => {
    const { page } = await open("logo/");
    const [line, panel] = await page.evaluate(() => {
      const zone = document.querySelector(".clear .zone");
      const clear = document.querySelector(".clear");
      if (!zone || !clear) throw new Error("no clear-space drawing");
      return [
        getComputedStyle(zone).borderTopColor,
        getComputedStyle(clear).backgroundColor,
      ];
    });
    expect(await contrast(page, line, panel)).toBeGreaterThanOrEqual(3);
    await page.close();
  });
});

describe("the migration guide", () => {
  it("keeps the rows that hold the word, and hides a table with none", async () => {
    const { page } = await open("migration/");
    await page.fill("[data-filter]", "radius-pill");
    expect(await page.locator("tbody tr:visible").count()).toBe(1);
    expect(await page.locator("article h3:visible").allTextContents()).toEqual([
      "Radius",
    ]);
    await page.close();
  });

  it("copies a new name for CSS, and the bare name with Alt and Enter", async () => {
    const context = await browser.newContext({
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    await page.goto(`${site.origin}/migration/`);
    const button = 'button[data-copy="var(--igd-radius-full)"]';
    await page.click(button);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "var(--igd-radius-full)",
    );
    await page.focus(button);
    await page.keyboard.press("Alt+Enter");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "--igd-radius-full",
    );
    await context.close();
  });

  it("stacks a row on a phone, so the old and the new name are both on screen", async () => {
    const { page } = await open("migration/", 390);
    const rows = await page.evaluate(
      () =>
        [...document.querySelectorAll("article tbody tr")].filter((row) =>
          [...row.querySelectorAll("td")].some((cell) => {
            const box = cell.getBoundingClientRect();
            return box.left < 0 || box.right > innerWidth;
          }),
        ).length,
    );
    expect(rows).toBe(0);
    expect(
      await page
        .locator("article tbody td")
        .first()
        .evaluate((cell) => getComputedStyle(cell, "::before").content),
    ).toBe('"Before"');
    await page.close();
  });

  it("keeps the table a table for assistive technology when its rows are stacked", async () => {
    const { page } = await open("migration/", 390);
    expect(await page.getByRole("table").count()).toBeGreaterThan(5);
    expect(
      await page.getByRole("cell", { name: "--igd-radius-full" }).count(),
    ).toBe(1);
    await page.close();
  });
});

describe("a code sample of a document", () => {
  it("has a button that copies it", async () => {
    const context = await browser.newContext({
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    await page.goto(`${site.origin}/adopting/`);
    await page.click("article .code button");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "npm install ig-design-system",
    );
    await context.close();
  });

  it("is coloured with tokens, and its comment reaches 4.5:1", async () => {
    const { page } = await open("adopting/");
    const result = await page.evaluate(() => {
      const comment = [
        ...document.querySelectorAll<HTMLElement>("article pre span"),
      ].find((s) => s.textContent?.includes("optional"));
      const frame = comment?.closest(".code");
      if (!comment || !frame) throw new Error("no comment in a code sample");
      const probe = document.createElement("i");
      probe.style.color = "var(--igd-color-surface-inverse)";
      document.body.appendChild(probe);
      const surface = getComputedStyle(probe).color;
      probe.remove();
      return {
        text: getComputedStyle(comment).color,
        background: getComputedStyle(frame).backgroundColor,
        surface,
      };
    });
    expect(result.background).toBe(result.surface);
    expect(
      await contrast(page, result.text, result.background),
    ).toBeGreaterThanOrEqual(4.5);
    await page.close();
  });
});
