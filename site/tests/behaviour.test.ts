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

  it("starts in the dark theme when the system is dark", async () => {
    const { page } = await open("", 1280, "dark");
    expect(await page.getAttribute("html", "data-theme")).toBe("dark");
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

  it("keeps the card of a light region light when the page is dark", async () => {
    const { page } = await open("", 1280, "dark");
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
