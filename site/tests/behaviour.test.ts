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
  it("switches the page to the dark variant and shows the logo for dark surfaces", async () => {
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

  it("is an icon button named for the variant of the theme it turns on", async () => {
    const { page } = await open("");
    const toggle = page.locator("[data-theme-toggle]");
    expect(await toggle.getAttribute("aria-label")).toBe(
      "Dark variant of the theme",
    );
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

  it("starts in the light variant even when the system is dark", async () => {
    const { page } = await open("", 1280, "dark");
    expect(await page.getAttribute("html", "data-theme")).toBe("light");
    await page.close();
  });

  it("keeps the dark variant on the next page once it is chosen, and returns to light when switched back", async () => {
    const { page } = await open("");
    await page.click("[data-theme-toggle]");
    await page.goto(`${site.origin}/tokens/colour/`);
    expect(await page.getAttribute("html", "data-theme")).toBe("dark");
    await page.click("[data-theme-toggle]");
    await page.reload();
    expect(await page.getAttribute("html", "data-theme")).toBe("light");
    await page.close();
  });
});

describe("the dark variant notice", () => {
  it("shows only in the dark variant, stays above the top bar while the page scrolls, and says the variant is not final", async () => {
    const { page } = await open("");
    const notice = page.locator("[data-dark-notice]");
    expect(await notice.isVisible()).toBe(false);
    await page.click("[data-theme-toggle]");
    expect(await notice.isVisible()).toBe(true);
    expect(await notice.textContent()).toContain(
      "The dark variant is not final.",
    );
    const [noticeBottom, headerTop] = await page.evaluate(() => [
      document.querySelector("[data-dark-notice]")?.getBoundingClientRect()
        .bottom,
      document.querySelector("header")?.getBoundingClientRect().top,
    ]);
    expect(noticeBottom).toBeLessThanOrEqual(headerTop ?? 0);
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      scrollTo(0, 2000);
    });
    // The notice publishes its height from a ResizeObserver, a frame after it shows.
    await page.waitForFunction(
      () =>
        Math.round(
          document.querySelector("header")?.getBoundingClientRect().top ?? -1,
        ) ===
        Math.round(
          document.querySelector("[data-dark-notice]")?.getBoundingClientRect()
            .bottom ?? 0,
        ),
    );
    const stuck = await page.evaluate(() => {
      const n = document
        .querySelector("[data-dark-notice]")
        ?.getBoundingClientRect();
      const h = document.querySelector("header")?.getBoundingClientRect();
      return {
        notice: n?.top,
        header: Math.round(h?.top ?? -1) === Math.round(n?.bottom ?? 0),
      };
    });
    expect(stuck).toEqual({ notice: 0, header: true });
    await page.click("[data-theme-toggle]");
    expect(await notice.isVisible()).toBe(false);
    await page.close();
  });

  it("does not scroll sideways at 320px", async () => {
    const { page } = await open("", 320);
    await page.click("[data-theme-toggle]");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBe(0);
    await page.click("[data-theme-toggle]");
    await page.close();
  });
});

describe("Tab through the sticky bars", () => {
  it.each([
    [1280, "light"],
    [800, "light"],
    [800, "dark"],
  ])(
    "at %ipx in the %s variant moves focus through the top bar and the section list without scrolling the page",
    async (width, variant) => {
      const { page } = await open("tokens/colour/", width);
      if (variant === "dark") await page.click("[data-theme-toggle]");
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = "auto";
        scrollTo(0, 3000);
      });
      await page.focus("header a.brand");
      const visited: string[] = [];
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press("Tab");
        visited.push(
          await page.evaluate(() => document.activeElement?.tagName ?? ""),
        );
      }
      expect(visited).toContain("INPUT");
      expect(await page.evaluate(() => scrollY)).toBe(3000);
      await page.close();
    },
  );
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
  it("tints the row of the section in view, as the top bar marks the open page", async () => {
    const { page } = await open("tokens/colour/");
    await page.click('[data-section-nav] a[href="#colour-text"]');
    // The jump scrolls smoothly, and the row is marked once the scroll ends.
    await page.waitForSelector(
      '[data-section-nav] a[href="#colour-text"][aria-current="true"]',
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
    const tint = await page.evaluate(() => {
      const probe = document.createElement("i");
      probe.style.backgroundColor = "var(--igd-color-surface-tint)";
      document.body.appendChild(probe);
      const colour = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return colour;
    });
    expect(rows.filter((r) => r.fill === tint).map((r) => r.hash)).toEqual([
      "#colour-text",
    ]);
    expect(rows.find((r) => r.hash === "#colour-text")?.current).toBe("true");
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
        document.getElementById("themes")?.scrollIntoView();
      });
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-section-nav] a[aria-current="true"]')
            ?.getAttribute("href") === "#themes",
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
  it.each(["", "tokens/type/"])(
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
      if (route === "tokens/type/")
        expect(
          await page.textContent('output[data-type="igd-type-display-lg"]'),
        ).toMatch(/^36px/);
      await page.close();
    },
  );
});

describe("Concepts", () => {
  it("takes its cards' rules from the stylesheet Build a component prints", async () => {
    const { page } = await open("");
    const rule = await page.evaluate(() =>
      [...document.querySelectorAll("style")]
        .map((style) => style.textContent ?? "")
        .find((css) => css.includes(".card:hover {")),
    );
    await page.goto(`${site.origin}/guide/component/`);
    const printed = await page.evaluate(() =>
      [...document.querySelectorAll("pre code")]
        .map((code) => code.textContent ?? "")
        .find((code) => code.includes(".card:hover {")),
    );
    expect(rule).toBeDefined();
    expect(printed?.trim()).toBe(rule?.trim());
    await page.close();
  });
});

describe("the type roles of the guide", () => {
  it.each([1280, 390, 320])(
    "at %ipx keep every class name on one line",
    async (width) => {
      const { page } = await open("", width);
      const wrapped = await page.$$eval(
        "#type-specimens .names button .text",
        (all) =>
          all.filter((el) => {
            const range = document.createRange();
            range.selectNodeContents(el);
            const lines = new Set(
              [...range.getClientRects()].map((r) => Math.round(r.top)),
            );
            return lines.size > 1;
          }).length,
      );
      expect(wrapped).toBe(0);
      await page.close();
    },
  );
});

describe("the interactive examples of the guide", () => {
  it("at 1280px put their controls on the left and what they change on the right, all at the same edge", async () => {
    const { page } = await open("", 1280);
    const edges = await page.$$eval("[data-example-layout]", (all) =>
      all.map((example) => {
        const box = (part: string) =>
          example.querySelector(`:scope > ${part}`)?.getBoundingClientRect();
        return {
          controls: box(".controls")?.right,
          result: box(".result")?.left,
        };
      }),
    );
    expect(edges).toHaveLength(7);
    for (const e of edges) expect(e.controls).toBeLessThan(e.result ?? 0);
    expect(new Set(edges.map((e) => Math.round(e.result ?? 0))).size).toBe(1);
    await page.close();
  });
});

describe("the variant explorer of Concepts", () => {
  it("puts the card in the variant picked", async () => {
    const { page } = await open("");
    const stage = "[data-variant-explorer] [data-variant]";
    expect(await page.getAttribute(stage, "data-theme")).toBe("light");
    await page.click('[data-variant-explorer] button[data-pick="dark"]');
    expect(await page.getAttribute(stage, "data-theme")).toBe("dark");
    await page.close();
  });
});

describe("the spacing explorer of the guide", () => {
  it.each([
    ["padding", ".card"],
    ["margin", ".stack"],
    ["gap", ".lower"],
  ])("marks the %s with stripes and names its token", async (kind, part) => {
    const { page } = await open("");
    await page.click(`[data-spacing-explorer] button[data-pick="${kind}"]`);
    const marked = await page.$eval(
      `[data-spacing-explorer] ${part}`,
      (el) => getComputedStyle(el).backgroundImage,
    );
    expect(marked).toContain("repeating-linear-gradient");
    expect(
      await page.textContent(
        '[data-spacing-explorer] .option:has([aria-pressed="true"]) [data-copy]',
      ),
    ).toContain("--igd-space-");
    await page.close();
  });
});

describe("the colour explorer of the guide", () => {
  it("outlines every part that uses the picked colour and names its token", async () => {
    const { page } = await open("");
    await page.click(
      '[data-colour-explorer] button[data-pick="color-action-on"]',
    );
    expect(
      await page
        .locator(
          '[data-colour-explorer] [data-part="color-action-on"][data-current]',
        )
        .count(),
    ).toBe(2);
    expect(
      await page.textContent(
        '[data-colour-explorer] .option:has([aria-pressed="true"]) [data-copy]',
      ),
    ).toContain("color-action-on");
    await page.close();
  });

  it("keeps the pick when the pointer moves over the page, so nothing above it moves", async () => {
    const { page } = await open("");
    await page.hover('[data-colour-explorer] [data-part="color-link-inverse"]');
    expect(
      await page.getAttribute(
        '[data-colour-explorer] button[data-pick="color-text-muted"]',
        "aria-pressed",
      ),
    ).toBe("true");
    await page.close();
  });
});

describe("the shape explorers of the guide", () => {
  it("show the corner of the element picked by its button, and keep it when the pointer moves over the drawing", async () => {
    const { page } = await open("");
    const shown = () =>
      page.$eval(
        ".explorer.radius",
        (el) =>
          el.querySelector<HTMLElement>('button[aria-pressed="true"]')?.dataset
            .pick,
      );
    expect(await shown()).toBe("radius-card");
    await page.click('.explorer.radius button[data-pick="radius-action"]');
    expect(await shown()).toBe("radius-action");
    expect(
      await page.getAttribute(
        '.explorer.radius [data-part="radius-action"]',
        "data-current",
      ),
    ).toBe("");
    await page.hover('.explorer.radius [data-part="radius-control"]');
    expect(await shown()).toBe("radius-action");
    await page.close();
  });

  it("names the token under the title of each option, above its use", async () => {
    const { page } = await open("");
    const order = await page.$eval(
      '.explorer.radius .option:has([data-pick="radius-card"])',
      (el) =>
        ["strong", "[data-copy]", ".use"].map(
          (part) => el.querySelector(part)?.getBoundingClientRect().top ?? 0,
        ),
    );
    expect(order).toEqual([...order].sort((a, b) => a - b));
    await page.close();
  });

  it("says what each shadow is for on its option", async () => {
    const { page } = await open("");
    expect(
      await page.textContent(
        '.explorer.shadow .option:has([data-pick="shadow-card-hover"])',
      ),
    ).toContain("A card under the mouse pointer.");
    await page.close();
  });

  it("name the token of the pick, and show no value or code sample", async () => {
    const { page } = await open("");
    await page.click('.explorer.shadow button[data-pick="shadow-popover"]');
    expect(
      await page.textContent(
        '.explorer.shadow .option:has([aria-pressed="true"]) [data-copy]',
      ),
    ).toContain("shadow-popover");
    expect(
      await page.locator("[data-shape-explorer] :is(output, pre)").count(),
    ).toBe(0);
    await page.close();
  });

  it("lift the card to the shadow picked", async () => {
    const { page } = await open("");
    const shadow = () =>
      page.$eval("[data-lift]", (el) => getComputedStyle(el).boxShadow);
    await page.click('.explorer.shadow button[data-pick="shadow-none"]');
    await page.waitForTimeout(400);
    expect(await shadow()).toBe("none");
    await page.click('.explorer.shadow button[data-pick="shadow-panel"]');
    await page.waitForTimeout(400);
    expect(await shadow()).not.toBe("none");
    await page.close();
  });
});

describe("the dials of the guide", () => {
  it.each([1280, 800, 640])(
    "at %ipx keep the card's two buttons on one row at Double spacing",
    async (width) => {
      const { page } = await open("", width);
      await page.click('button[data-dial="--ig-spacing"][data-value="2"]');
      const [first, second] = await page.$$eval(
        "#dial-stage .card:not(form) .actions > *",
        (all) => all.map((el) => el.getBoundingClientRect().top),
      );
      expect(second).toBe(first);
      await page.close();
    },
  );

  it("change the form beside the card: Small makes its fields shorter and Square makes their corners sharper, down to the 2px floor", async () => {
    const { page } = await open("");
    const field = "#dial-form-name";
    const measure = () =>
      page.$eval(field, (el) => {
        const s = getComputedStyle(el);
        return {
          height: el.getBoundingClientRect().height,
          radius: s.borderTopLeftRadius,
        };
      });
    const before = await measure();
    await page.click('button[data-dial="--ig-size"][data-value="1"]');
    await page.click('button[data-dial="--ig-radius-factor"][data-value="0"]');
    const after = await measure();
    expect(after.height).toBeLessThan(before.height);
    expect(after.radius).toBe("2px");
    expect(Number.parseFloat(before.radius)).toBeGreaterThan(2);
    await page.close();
  });

  it.each([
    ["2", "14px"],
    ["1", "12px"],
  ])(
    "tighten the spacing with the size: --ig-size %s gives a 16px step %s, as the Size line says",
    async (size, px) => {
      const { page } = await open("");
      await page.click(`button[data-dial="--ig-size"][data-value="${size}"]`);
      expect(
        await page.evaluate(() => {
          const probe = document.createElement("div");
          probe.setAttribute("data-ig-scope", "");
          probe.style.paddingTop = "var(--igd-space-md)";
          document.getElementById("dial-stage")?.append(probe);
          const value = getComputedStyle(probe).paddingTop;
          probe.remove();
          return value;
        }),
      ).toBe(px);
      await page.close();
    },
  );

  it("keeps space between the card and the line under it", async () => {
    const { page } = await open("");
    const gap = await page.evaluate(() => {
      const lab = document.getElementById("dial-stage")?.parentElement;
      const after = lab?.closest(".group")?.querySelector(".lead.after");
      if (!lab || !after) throw new Error("no line after the dial card");
      return (
        after.getBoundingClientRect().top - lab.getBoundingClientRect().bottom
      );
    });
    expect(gap).toBeGreaterThanOrEqual(16);
    await page.close();
  });

  it.each([
    [1280, true],
    [800, false],
  ])("at %ipx puts the panel beside the card: %s", async (width, beside) => {
    const { page } = await open("", width);
    const [panel, card] = await page.evaluate(() =>
      ["[data-dials]", "#dial-stage"].map((s) => {
        const r = document.querySelector(s)?.getBoundingClientRect();
        return { top: r?.top ?? 0, bottom: r?.bottom ?? 0 };
      }),
    );
    if (beside) expect(card.top).toBe(panel.top);
    else expect(card.top).toBeGreaterThanOrEqual(panel.bottom);
    await page.close();
  });

  it("move the card, and no dial is set on the card", async () => {
    const { page } = await open("");
    expect(await cardStyle(page)).toMatchObject({
      padding: "20px",
      radius: "16px",
    });

    await page.click('button[data-dial="--ig-spacing"][data-value="0.5"]');
    expect((await cardStyle(page)).padding).toBe("10px");

    await page.click('button[data-dial="--ig-radius-factor"][data-value="0"]');
    expect((await cardStyle(page)).radius).toBe("0px");

    // The card takes its shadow on hover.
    await page.hover("#dial-stage .card");
    expect((await cardStyle(page)).shadow).not.toMatch(
      /^none$|0px 0px 0px 0px/,
    );
    await page.click(
      'button[data-dial="--ig-elevation-factor"][data-value="0"]',
    );
    await page.hover("#dial-stage .card");
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
    const { page } = await open("tokens/colour/");
    expect(await page.locator("[data-section-nav] [data-filter]").count()).toBe(
      1,
    );
    expect(await page.locator("header [data-filter]").count()).toBe(0);
    await page.close();
  });

  it("keeps the tokens whose name or note has the word, and counts them", async () => {
    const { page } = await open("tokens/colour/");
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
    const { page } = await open("tokens/colour/");
    expect(
      await page.textContent('[data-token="color-action-default"] output'),
    ).toMatch(/^#[0-9a-f]{6}$/);
    await page.goto(`${site.origin}/tokens/spacing/`);
    expect(await page.textContent('[data-token="space-inset-md"] output')).toBe(
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
  it("copies the name it shows and reports it", async () => {
    const context = await browser.newContext({
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    await page.goto(`${site.origin}/tokens/colour/`);
    await page.click('[data-token="color-text-muted"] button[data-copy]');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "--igd-color-text-muted",
    );
    expect(await page.textContent("[data-toast]")).toBe(
      "Copied --igd-color-text-muted",
    );
    await context.close();
  });

  it("says what to do when the copy fails", async () => {
    const { page } = await open("tokens/colour/");
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: () => Promise.reject(new Error("denied")) },
      });
    });
    await page.click('[data-token="color-text-muted"] button[data-copy]');
    expect(await page.textContent("[data-toast]")).toBe(
      "Could not copy --igd-color-text-muted. Select the text and copy it by hand.",
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
    ["tokens/colour/", "#colour-text", 390],
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
    const { page } = await open("tokens/colour/");
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
    const { page } = await open("tokens/colour/");
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
    const { page } = await open("tokens/colour/", 390);
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
    const { page } = await open("tokens/colour/");
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
    const { page } = await open("tokens/radius/");
    const count = () =>
      page
        .locator('[data-section-list] a[href="#tokens"] .count')
        .evaluate((el) => el.firstChild?.textContent?.trim());
    const total = await count();
    await page.fill("[data-filter]", "radius-action");
    expect(await count()).toBe("1");
    await page.fill("[data-filter]", "");
    expect(await count()).toBe(total);
    await page.close();
  });

  it("opens the component colours for a match there, and closes them again when cleared", async () => {
    const { page } = await open("tokens/colour/");
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
    const { page } = await open("tokens/radius/?q=radius-action");
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
    const { page } = await open("tokens/colour/");
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
    const { page } = await open("tokens/colour/");
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
    await page.fill("[data-filter]", "radius-action");
    expect(await page.locator("tbody tr:visible").count()).toBe(1);
    expect(await page.locator("article h3:visible").allTextContents()).toEqual([
      "Radius",
    ]);
    await page.close();
  });

  it("copies a new name exactly as it shows it", async () => {
    const context = await browser.newContext({
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    await page.goto(`${site.origin}/migration/`);
    await page.click('button[data-copy="--igd-radius-action"]');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "--igd-radius-action",
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
      await page.getByRole("cell", { name: "--igd-radius-action" }).count(),
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

describe("the focus ring", () => {
  it.each(
    ROUTES.flatMap((route) => [
      [route, 1280],
      [route, 390],
    ]) as [string, number][],
  )(
    "/%s at %ipx is not cut by a box that clips its content",
    async (route, width) => {
      const { page } = await open(route, width);
      const cut = await page.evaluate(() => {
        const probe = document.createElement("i");
        probe.style.cssText =
          "position:absolute;inline-size:calc(var(--igd-focus-ring-width) + var(--igd-focus-ring-offset))";
        document.body.appendChild(probe);
        const ring = probe.getBoundingClientRect().width;
        probe.remove();
        const found: string[] = [];
        const controls = document.querySelectorAll<HTMLElement>(
          "a[href], button, summary, input, [tabindex='0']",
        );
        for (const control of controls) {
          if (!control.getClientRects().length) continue;
          const box = control.getBoundingClientRect();
          for (
            let a = control.parentElement;
            a && a !== document.documentElement;
            a = a.parentElement
          ) {
            const style = getComputedStyle(a);
            if (style.overflowX === "visible" && style.overflowY === "visible")
              continue;
            // The padding box clips. A side that scrolls shows the ring once scrolled, so only its start counts.
            const outer = a.getBoundingClientRect();
            const left = outer.left + Number.parseFloat(style.borderLeftWidth);
            const right =
              outer.right - Number.parseFloat(style.borderRightWidth);
            const top = outer.top + Number.parseFloat(style.borderTopWidth);
            const bottom =
              outer.bottom - Number.parseFloat(style.borderBottomWidth);
            const scrollsX = a.scrollWidth > a.clientWidth;
            const scrollsY = a.scrollHeight > a.clientHeight;
            const clipped =
              box.left - ring < left - 0.5 ||
              box.top - ring < top - 0.5 ||
              (!scrollsX && box.right + ring > right + 0.5) ||
              (!scrollsY && box.bottom + ring > bottom + 0.5);
            if (clipped) {
              found.push(
                `${control.tagName.toLowerCase()} "${(control.getAttribute("aria-label") ?? control.textContent ?? "").trim().slice(0, 30)}" in ${a.tagName.toLowerCase()}.${a.className}`,
              );
              break;
            }
          }
        }
        return found;
      });
      expect(cut).toEqual([]);
      await page.close();
    },
  );
});

describe("the guide, without a hero", () => {
  it("opens with its title and one line of text, as the other pages do", async () => {
    const { page } = await open("");
    expect(await page.locator("main h1").count()).toBe(1);
    expect(await page.locator("h1").count()).toBe(1);
    expect(await page.locator("main > h1 + p.intro").count()).toBe(1);
    expect(await page.locator(".hero").count()).toBe(0);
    await page.close();
  });

  it("draws the buttons of its example cards as pictures, not as links", async () => {
    const { page } = await open("");
    expect(
      await page.locator("article.card a, article.card button").count(),
    ).toBe(0);
    await page.close();
  });

  it("does not scroll sideways at 320px", async () => {
    const { page } = await open("", 320);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBe(0);
    await page.close();
  });
});

describe("the active state", () => {
  it("is one style in the top bar, the Guide's menu and On this page", async () => {
    const { page } = await open("guide/", 1440);
    const styles = await page.evaluate(() =>
      [
        'header nav a[aria-current="page"]',
        'nav.side-nav a[aria-current="page"]',
        '[data-section-list] a[aria-current="true"]',
      ].map((selector) => {
        const el = document.querySelector(selector);
        if (!el) throw new Error(`no ${selector}`);
        const s = getComputedStyle(el);
        return `${s.backgroundColor} ${s.color}`;
      }),
    );
    expect(new Set(styles).size).toBe(1);
    await page.close();
  });
});

describe("the section being read", () => {
  it.each(["#load", "#check"])(
    "on a short Guide page is %s after a click on its link, though the page ends before it reaches the top",
    async (hash) => {
      const { page } = await open("guide/", 1440);
      await page.click(`[data-section-list] a[href="${hash}"]`);
      await page.waitForTimeout(600);
      expect(
        await page.getAttribute(
          '[data-section-list] a[aria-current="true"]',
          "href",
        ),
      ).toBe(hash);
      await page.close();
    },
  );

  it.each([
    ["", "colour", 1280],
    ["", "colour", 390],
    ["tokens/colour/", "colour-surface", 1280],
  ])(
    "on /%s is #%s while its content fills the screen, not the section after it",
    async (route, id, width) => {
      const { page } = await open(route, width);
      await page.evaluate((id) => {
        document.documentElement.style.scrollBehavior = "auto";
        const section = document.getElementById(id);
        if (!section) throw new Error(`no #${id}`);
        // The middle of the section: the next heading is well below the top of the screen.
        scrollTo(
          0,
          section.offsetTop +
            Math.min(
              section.offsetHeight / 2,
              section.offsetHeight - innerHeight,
            ),
        );
      }, id);
      await page.waitForFunction(
        () =>
          document.querySelector(
            '[data-section-list] a[aria-current="true"]',
          ) !== null,
      );
      expect(
        await page.getAttribute(
          '[data-section-list] a[aria-current="true"]',
          "href",
        ),
      ).toBe(`#${id}`);
      await page.close();
    },
  );

  it("is in view in the section row when a document opens on a phone", async () => {
    const { page } = await open("adopting/#5-check-it", 390);
    await page.waitForFunction(
      () =>
        document.querySelector('[data-section-list] a[aria-current="true"]') !==
        null,
    );
    expect(
      await page
        .locator('[data-section-list] a[aria-current="true"]')
        .evaluate((link) => {
          const list = link.closest("ul");
          if (!list) throw new Error("no list");
          const row = list.getBoundingClientRect();
          const box = link.getBoundingClientRect();
          return box.left >= row.left && box.left < row.right;
        }),
    ).toBe(true);
    await page.close();
  });
});

describe("a filter, where the result shows", () => {
  it("finds a value from the address, once the values are written", async () => {
    const { page } = await open("tokens/colour/?q=%23155dfc");
    await page.waitForFunction(() =>
      /^\d+ match/.test(
        document.querySelector("[data-filter-matches]")?.textContent ?? "",
      ),
    );
    expect(
      await page.locator('[data-token="color-action-default"]').isVisible(),
    ).toBe(true);
    expect(await page.locator("[data-filter-empty]").isVisible()).toBe(false);
    await page.close();
  });

  it("follows the theme: a value of the dark variant is found after the switch", async () => {
    const { page } = await open("tokens/colour/");
    await page.click("[data-theme-toggle]");
    const dark =
      (
        await page.textContent('[data-token="color-action-hover"] output')
      )?.trim() ?? "";
    await page.click("[data-theme-toggle]");
    await page.fill("[data-filter]", dark);
    const light = await page
      .locator('[data-token="color-action-hover"]')
      .isVisible();
    await page.click("[data-theme-toggle]");
    await page.waitForFunction(
      () =>
        !document.querySelector<HTMLElement>(
          '[data-token="color-action-hover"]',
        )?.hidden,
    );
    expect(light).toBe(false);
    await page.close();
  });

  it.each([
    ["tokens/spacing/", "gap", "[data-token]:not([hidden])"],
    ["migration/", "radius", "article tbody tr:not([hidden])"],
  ])(
    "on /%s at 390px puts the first match on the first screen",
    async (route, word, match) => {
      const { page } = await open(route, 390);
      await page.fill("[data-filter]", word);
      await page.waitForTimeout(100);
      const top = await page
        .locator(match)
        .first()
        .evaluate((el) => el.getBoundingClientRect().top);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(top).toBeLessThan(900);
      await page.close();
    },
  );

  it("finds a name pasted as var(--name) in the migration guide", async () => {
    const { page } = await open("migration/");
    await page.fill("[data-filter]", "var(--igd-radius-action)");
    expect(await page.locator("article tbody tr:visible").count()).toBe(1);
    await page.close();
  });

  it("clears with Escape wherever the focus is", async () => {
    const { page } = await open("tokens/radius/");
    await page.fill("[data-filter]", "radius-action");
    await page.focus('[data-token="radius-action"] button[data-copy]');
    await page.keyboard.press("Escape");
    expect(await page.inputValue("[data-filter]")).toBe("");
    expect(await page.textContent("[data-filter-matches]")).toBe("");
    await page.close();
  });
});

describe("the drawings of the logo page", () => {
  it.each([320, 390, 1280])(
    "at %ipx keep the clear space at half the height the logo is drawn at",
    async (width) => {
      const { page } = await open("logo/", width);
      const result = await page.evaluate(() => {
        const zone = document.querySelector(".clear .zone");
        const logo = zone?.querySelector("img");
        const measure = document.querySelector(".clear .measure");
        if (!zone || !logo || !measure)
          throw new Error("no clear-space drawing");
        const height = logo.getBoundingClientRect().height;
        return {
          padding:
            Number.parseFloat(getComputedStyle(zone).paddingTop) / height,
          line: measure.getBoundingClientRect().height / height,
        };
      });
      expect(result.padding).toBeCloseTo(0.5, 1);
      expect(result.line).toBeCloseTo(1, 1);
      await page.close();
    },
  );

  it.each([320, 390, 1280])(
    "at %ipx keep the partner logo half the logo's height from the rule, and inside the page",
    async (width) => {
      const { page } = await open("logo/", width);
      const result = await page.evaluate(() => {
        const logo = document.querySelector(".cobrand img");
        const divider = document.querySelector(".cobrand .divider");
        const partner = document.querySelector(".cobrand .partner");
        if (!logo || !divider || !partner)
          throw new Error("no co-branding drawing");
        const [l, d, p] = [logo, divider, partner].map((e) =>
          e.getBoundingClientRect(),
        );
        return {
          before: (d.left - l.right) / l.height,
          after: (p.left - d.right) / l.height,
          partner: p.height / l.height,
          inside: p.right <= document.documentElement.clientWidth,
        };
      });
      expect(result.before).toBeCloseTo(0.5, 1);
      expect(result.after).toBeCloseTo(0.5, 1);
      expect(result.partner).toBeCloseTo(1, 1);
      expect(result.inside).toBe(true);
      await page.close();
    },
  );

  it.each([320, 390, 768, 1280])(
    "at %ipx show no logo under the smallest size in a picture that is right",
    async (width) => {
      const { page } = await open("logo/", width);
      const heights = await page.evaluate(() =>
        [
          ...document.querySelectorAll<HTMLImageElement>(
            "#rules .picture:not(.wrong) img, #backgrounds img",
          ),
        ].map((img) => img.getBoundingClientRect().height),
      );
      expect(heights.length).toBeGreaterThan(8);
      expect(Math.min(...heights)).toBeGreaterThanOrEqual(15.95);
      await page.close();
    },
  );

  it("puts the bracket of the symbol under the symbol, and starts the wordmark's where the wordmark starts", async () => {
    const { page } = await open("logo/");
    const result = await page.evaluate(async () => {
      const img = document.querySelector<HTMLImageElement>(".anatomy img");
      const parts = [...document.querySelectorAll(".anatomy .part")];
      if (!img || parts.length !== 2) throw new Error("no anatomy drawing");
      const svg = await (await fetch(img.src)).text();
      const view =
        svg
          .match(/viewBox="([^"]+)"/)?.[1]
          .split(/\s+/)
          .map(Number) ?? [];
      const symbol = Math.max(
        ...[...svg.matchAll(/<rect[^>]*\bwidth="([\d.]+)"/g)].map((m) =>
          Number(m[1]),
        ),
      );
      const scale = img.getBoundingClientRect().width / view[2];
      const left = img.getBoundingClientRect().left;
      return {
        symbolEnd:
          parts[0].getBoundingClientRect().right - left - symbol * scale,
        wordStart:
          parts[1].getBoundingClientRect().left - left - 66.482 * scale,
      };
    });
    expect(Math.abs(result.symbolEnd)).toBeLessThan(1.5);
    expect(Math.abs(result.wordStart)).toBeLessThan(1.5);
    await page.close();
  });
});

describe("a page of the Guide on a narrow screen", () => {
  it("lists the pages of the Guide above its text and marks itself", async () => {
    const { page } = await open("adopting/", 390);
    const links = page.locator("nav.side-nav a");
    expect(await links.count()).toBe(6);
    expect(await links.first().isVisible()).toBe(true);
    expect(
      await page.locator('nav.side-nav a[aria-current="page"]').textContent(),
    ).toContain("Moving a site onto the design system");
    await page.close();
  });

  it("keeps the Copy button of a code sample off its code", async () => {
    const { page } = await open("adopting/", 390);
    const overlaps = await page.evaluate(
      () =>
        [...document.querySelectorAll("article .code")].filter((frame) => {
          const button = frame.querySelector("button")?.getBoundingClientRect();
          const line = frame.querySelector(".line")?.getBoundingClientRect();
          return button && line && line.top < button.bottom;
        }).length,
    );
    expect(overlaps).toBe(0);
    await page.close();
  });

  it("underlines a link in its text", async () => {
    const { page } = await open("migration/");
    expect(
      await page
        .locator("article p a")
        .first()
        .evaluate((a) => getComputedStyle(a).textDecorationLine),
    ).toBe("underline");
    await page.close();
  });
});
