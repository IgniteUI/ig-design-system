// Rules of the dials and the themes on a nested element, measured in a browser on dist/.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
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
      border-radius: var(--igd-radius-lg); box-shadow: var(--igd-elevation-8); }
    .fill { background: var(--igd-color-action-fill-hover); }</style>
    <div id="default" class="box"></div>
    <div style="${DIALS}"><div id="plain" class="box"></div></div>
    <div style="${DIALS}"><div id="host" class="box" data-ig-scope></div></div>
    <div data-ig-scope style="${DIALS}"><div id="region" class="box"></div>
      <div data-ig-scope style="--ig-spacing: 1"><div id="nested" class="box"></div></div></div>
    <div style="--igd-color-action-default: #b91c1c"><div id="plain-colour" class="fill"></div></div>
    <div data-ig-scope style="--igd-color-action-default: #b91c1c"><div id="scope-colour" class="fill"></div></div>
    <div id="default-colour" class="fill"></div>
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

describe("a base colour set on an element", () => {
  const hover = (id: string) =>
    page.evaluate(
      (id) => getComputedStyle(document.getElementById(id)!).backgroundColor,
      id,
    );

  it("moves its state colours below a data-ig-scope", async () => {
    expect(await hover("scope-colour")).not.toBe(await hover("default-colour"));
  });

  it("leaves the state colours unchanged below an element without data-ig-scope", async () => {
    expect(await hover("plain-colour")).toBe(await hover("default-colour"));
  });
});

describe("data-ig-scope on the host of an Ignite UI component", () => {
  it("leaves the size the component sets on its host", async () => {
    const p = await browser.newPage();
    await p.setContent(`<style>${css}</style><x-sized id="host" data-ig-scope></x-sized>
      <script>customElements.define("x-sized", class extends HTMLElement {
        connectedCallback() {
          this.attachShadow({ mode: "open" }).innerHTML =
            "<style>:host { --component-size: 2; --is-medium: 1; }</style>";
        }
      });</script>`);
    const read = (name: string) =>
      p.evaluate(
        (name) =>
          getComputedStyle(document.getElementById("host")!)
            .getPropertyValue(name)
            .trim(),
        name,
      );
    expect(await read("--component-size")).toBe("2");
    expect(await read("--is-medium")).toBe("1");
    await p.close();
  });
});

describe("docs/examples/card.html", () => {
  it("follows the two dials its section sets", async () => {
    const example = await browser.newPage();
    await example.goto(
      pathToFileURL(path.resolve("docs/examples/card.html")).href,
    );
    const card = (id: string) =>
      example.evaluate((id) => {
        const s = getComputedStyle(document.getElementById(id)!);
        return { padding: s.paddingTop, radius: s.borderTopLeftRadius };
      }, id);
    expect(await card("default")).toEqual({ padding: "20px", radius: "16px" });
    const compact = await card("compact");
    expect(compact.padding).toBe("10px");
    expect(Number.parseFloat(compact.radius)).toBeLessThan(16);
    await example.close();
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
