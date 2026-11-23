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
  it("stays light when the page is dark, because its picture is light", async () => {
    const { page } = await open("");
    await page.click("[data-theme-toggle]");
    const colours = await page.evaluate(() => {
      const hero = document.querySelector(".hero");
      if (!hero) throw new Error("no hero");
      return [
        getComputedStyle(hero).backgroundColor,
        getComputedStyle(document.body).backgroundColor,
      ];
    });
    expect(colours[0]).toBe("rgb(255, 255, 255)");
    expect(colours[1]).not.toBe("rgb(255, 255, 255)");
    await page.close();
  });

  it("puts its picture beside the text on a wide screen and under it on a phone", async () => {
    const boxes = async (width: number) => {
      const { page } = await open("", width);
      const result = await page.evaluate(() => {
        const text = document
          .querySelector(".hero h1")
          ?.getBoundingClientRect();
        const picture = document
          .querySelector(".hero .picture")
          ?.getBoundingClientRect();
        if (!text || !picture) throw new Error("no hero text or picture");
        return {
          textBottom: text.bottom,
          pictureTop: picture.top,
          pictureLeft: picture.left,
        };
      });
      await page.close();
      return result;
    };
    const wide = await boxes(1280);
    expect(wide.pictureTop).toBeLessThan(wide.textBottom);
    expect(wide.pictureLeft).toBeGreaterThan(0);
    const phone = await boxes(390);
    expect(phone.pictureTop).toBeGreaterThan(phone.textBottom);
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

  it("keeps the card of a light region light when the page is dark", async () => {
    const { page } = await open("");
    await page.click("[data-theme-toggle]");
    const fills = await page.evaluate(() =>
      [
        ...document.querySelectorAll(
          '[data-theme="light"] .card, [data-theme="dark"] .card',
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
      const headings = [...source(file).matchAll(/^(#{1,2}) (.+)$/gm)].map(
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
        plain(await page.locator("article :is(h1, h2)").allTextContents()),
      ).toEqual(plain(headings.map((h) => h.text)));
      expect(
        plain(await page.locator("[data-section-nav] li").allTextContents()),
      ).toEqual(
        plain(headings.filter((h) => h.level === 2).map((h) => h.text)),
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
});
