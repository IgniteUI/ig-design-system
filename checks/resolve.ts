// Gate: every token resolves in a browser, in both themes, when a page loads the package as a site does.
// node checks/resolve.ts
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { cssVar } from "../src/namespace.ts";

const ROOT = path.join(import.meta.dirname, "..");
const read = (f: string) => fs.readFileSync(path.join(ROOT, f), "utf8");

type Family = { tokens: { name: string }[] };
const tokens = JSON.parse(read("dist/tokens.json")) as Record<string, Family>;
// The property a token of each family is tried on. Both are inherited, so an invalid value shows the parent's sentinel.
const KIND: Record<string, "color" | "letterSpacing"> = {
  color: "color",
  spacing: "letterSpacing",
  radius: "letterSpacing",
  size: "letterSpacing",
};
const css = read("dist/tokens.css") + read("dist/theme.css");
// A property declared only on a component selector, such as [data-ig="icon-tile"], has no value on the page and is left out.
const declared = [
  ...new Set(
    [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter((rule) => /:root|\[data-theme/.test(rule[1]))
      .flatMap((rule) =>
        [...rule[2].matchAll(/(?<![\w-])(--[\w-]+)\s*:/g)].map((m) => m[1]),
      ),
  ),
];
const typed = Object.entries(KIND).flatMap(([family, prop]) =>
  tokens[family].tokens.map((t) => [cssVar(t.name), prop] as const),
);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let fail = 0;
  for (const theme of ["light", "dark"]) {
    await page.setContent(
      `<style>${css}</style><body><div id="scope" data-theme="${theme}" style="color: rgb(1, 2, 3); letter-spacing: 1.337px"><i id="probe"></i></div>`,
    );
    const bad = await page.evaluate(
      ([names, kinds]) => {
        const probe = document.getElementById("probe") as HTMLElement;
        const found: string[] = [];
        for (const name of names) {
          probe.style.setProperty("--probe", `var(${name})`);
          if (!getComputedStyle(probe).getPropertyValue("--probe").trim())
            found.push(`${name} resolves to nothing`);
        }
        probe.style.removeProperty("--probe");
        for (const [name, prop] of kinds) {
          probe.style[prop] = "";
          probe.style[prop] = `var(${name})`;
          const value = getComputedStyle(probe)[prop];
          if (value === (prop === "color" ? "rgb(1, 2, 3)" : "1.337px"))
            found.push(
              `${name} is not a valid ${prop === "color" ? "colour" : "length"}`,
            );
        }
        return found;
      },
      [declared, typed] as const,
    );
    for (const b of bad) {
      fail++;
      console.log(`UNRESOLVED ${theme}: ${b}`);
    }
  }
  await browser.close();
  console.log(
    fail
      ? `resolve gate: ${fail} FAILING`
      : `resolve gate: pass (${declared.length} custom properties, ${typed.length} typed, × 2 themes)`,
  );
  process.exit(fail ? 1 : 0);
})();
