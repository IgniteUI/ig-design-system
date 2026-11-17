// Rules of the dials and the themes on a nested element, measured in a browser on dist/.
import fs from "node:fs";
import { type Browser, chromium, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const css =
  fs.readFileSync("dist/tokens.css", "utf8") +
  fs.readFileSync("dist/theme.css", "utf8");
const DIALS =
  "--ig-size: 1; --ig-spacing: 2; --ig-radius-factor: 0; --ig-elevation-factor: 0";
let browser: Browser;
let page: Page;

/** The computed padding, size, radius and shadow of the box with the given id. */
const box = (id: string) =>
  page.evaluate((id) => {
    const s = getComputedStyle(document.getElementById(id)!);
    return {
      padding: s.paddingTop,
      size: s.marginLeft,
      radius: s.borderTopLeftRadius,
      shadow: s.boxShadow,
    };
  }, id);

beforeAll(async () => {
  browser = await chromium.launch();
  page = await browser.newPage();
  await page.setContent(`<style>${css}
    .box { padding: var(--igd-space-inset-md); margin-left: var(--igd-size-control-md);
      border-radius: var(--igd-radius-lg); box-shadow: var(--igd-elevation-8); }</style>
    <div id="default" class="box"></div>
    <div style="${DIALS}"><div id="plain" class="box"></div></div>
    <div style="${DIALS}"><div id="host" class="box" data-ig-scope></div></div>
    <div data-ig-scope style="${DIALS}"><div id="region" class="box"></div>
      <div data-ig-scope style="--ig-spacing: 1"><div id="nested" class="box"></div></div></div>
    <div data-theme="dark"><div id="dark"></div><div data-theme="light" id="light"></div></div>`);
}, 60000);

afterAll(() => browser.close());

describe("a dial", () => {
  it("leaves the tokens at their design values when unset", async () => {
    const d = await box("default");
    expect(d.padding).toBe("16px");
    expect(d.radius).toBe("16px");
    expect(d.shadow).not.toMatch(/0px 0px 0px 0px.*0px 0px 0px 0px/);
  });

  it("changes no token below an element without data-ig-scope", async () => {
    expect(await box("plain")).toEqual(await box("default"));
  });

  it("reaches a component that marks its root with data-ig-scope, from any ancestor", async () => {
    const d = await box("default");
    const h = await box("host");
    expect(h.padding).toBe("24px");
    expect(Number.parseFloat(h.size)).toBeLessThan(Number.parseFloat(d.size));
    expect(Number.parseFloat(h.radius)).toBeLessThan(
      Number.parseFloat(d.radius),
    );
    expect(h.shadow).not.toBe(d.shadow);
  });

  it("changes spacing, size, radius and shadow below a data-ig-scope region", async () => {
    const r = await box("region");
    expect(r.padding).toBe("24px");
    expect(r).toEqual(await box("host"));
  });

  it("is read again by a nested scope, which keeps the dials it does not set", async () => {
    const n = await box("nested");
    const r = await box("region");
    expect(n.padding).toBe("12px");
    expect(n.radius).toBe(r.radius);
    expect(n.size).toBe(r.size);
  });
});

describe("a light region inside a dark one", () => {
  const scheme = (id: string) =>
    page.evaluate(
      (id) => getComputedStyle(document.getElementById(id)!).colorScheme,
      id,
    );

  it("has the light colour scheme, so native controls are light", async () => {
    expect(await scheme("dark")).toBe("dark");
    expect(await scheme("light")).toBe("light");
  });
});
