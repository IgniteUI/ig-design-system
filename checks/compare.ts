// Compares two renderings of the same pages, element by element. Used when a site moves onto the design system.
// node checks/compare.ts <before url> <after url> [path@width ...]
// Example: node checks/compare.ts http://localhost:4321 http://localhost:4322 /@1440 /@390 /pricing@1440
import { chromium, type Page } from "playwright";
import { isMain } from "../src/main.ts";

// The computed properties compared, in the order they are reported.
export const PROPS = [
  "fontFamily",
  "fontSize",
  "lineHeight",
  "fontWeight",
  "letterSpacing",
  "color",
  "backgroundColor",
  "borderTopColor",
  "borderRadius",
  "paddingTop",
  "boxShadow",
  "width",
  "height",
] as const;

export type Row = string[];
export type Difference = {
  prop: string;
  before: string;
  after: string;
  count: number;
};

/** Groups the differences between two snapshots of one page by property and by the pair of values. */
export const differences = (before: Row[], after: Row[]): Difference[] => {
  const found = new Map<string, Difference>();
  for (let i = 0; i < Math.min(before.length, after.length); i++)
    PROPS.forEach((prop, k) => {
      const a = before[i][k + 1];
      const b = after[i][k + 1];
      if (a === b) return;
      const key = `${prop}|${a}|${b}`;
      const d = found.get(key) ?? { prop, before: a, after: b, count: 0 };
      d.count++;
      found.set(key, d);
    });
  return [...found.values()].sort((x, y) => y.count - x.count);
};

const snapshot = async (page: Page, url: string, width: number) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url, { waitUntil: "load" });
  // Waits for fonts and late scripts.
  await page
    .waitForLoadState("networkidle", { timeout: 10000 })
    .catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1000);
  return page.evaluate((props) => {
    const rows = [...document.querySelectorAll("body *")]
      .filter((e) => !["SCRIPT", "STYLE", "LINK", "META"].includes(e.tagName))
      .map((e) => {
        const s = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        return [
          e.tagName,
          ...props.map((p) =>
            p === "width" || p === "height"
              ? String(Math.round(r[p]))
              : p === "fontFamily"
                ? s.fontFamily.split(",")[0]
                : s[p],
          ),
        ];
      });
    return {
      rows,
      height: document.documentElement.scrollHeight,
      overflow: document.documentElement.scrollWidth - innerWidth,
    };
  }, PROPS);
};

if (isMain(import.meta.url)) {
  const [beforeBase, afterBase, ...targets] = process.argv.slice(2);
  if (!beforeBase || !afterBase) {
    console.error(
      "Usage: node checks/compare.ts <before url> <after url> [path@width ...]. Both sites must be running.",
    );
    process.exit(1);
  }
  const browser = await chromium.launch();
  let total = 0;
  for (const target of targets.length ? targets : ["/@1440", "/@390"]) {
    const [pathname, width = "1440"] = target.split("@");
    const page = await browser.newPage();
    const a = await snapshot(page, beforeBase + pathname, +width);
    const b = await snapshot(page, afterBase + pathname, +width);
    await page.close();
    const diffs = differences(a.rows, b.rows);
    total += diffs.length;
    console.log(
      `${target}: ${a.rows.length} and ${b.rows.length} elements, height ${a.height}px and ${b.height}px, horizontal overflow ${a.overflow}px and ${b.overflow}px, ${diffs.length} kinds of difference`,
    );
    for (const d of diffs.slice(0, 12))
      console.log(`  ${d.count}x ${d.prop}: ${d.before} => ${d.after}`);
  }
  await browser.close();
  console.log(
    total ? `compare: ${total} kinds of difference` : "compare: no difference",
  );
}
