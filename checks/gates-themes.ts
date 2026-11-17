// Gate: the contrast pairings are measured in a browser, on the live tokens, in both themes. Fails on any pairing below its minimum.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

type Pair = [fg: string, bg: string, min?: number];
type Row = { fg: string; bg: string; ratio: number; min: number; ok: boolean };
const OUT = path.join(import.meta.dirname, "../dist/");
const REP = path.join(import.meta.dirname, "../reports/");
(async () => {
  const pairs: Pair[] = JSON.parse(
    fs.readFileSync(`${REP}contrast-pairs.json`, "utf8"),
  );
  const css =
    fs.readFileSync(`${OUT}tokens.css`, "utf8") +
    fs.readFileSync(`${OUT}theme.css`, "utf8");
  const declared = new Set(
    [...css.matchAll(/(?<![\w-])--([\w-]+)\s*:/g)].map((m) => m[1]),
  );
  const missing = [
    ...new Set(
      pairs
        .flatMap(([fg, bg]) => [fg, bg])
        .filter((n) => !declared.has(n.startsWith("ig-") ? n : `igd-${n}`)),
    ),
  ];
  if (missing.length) {
    console.log(
      `theme contrast gate: ${missing.join(", ")} is in a pairing and is not a token. Fix the name in CONTRAST_PAIRS in src/spec.ts.`,
    );
    process.exit(1);
  }
  const b = await chromium.launch();
  const p = await b.newPage();
  let fail = 0;
  const report: Record<string, Row[]> = {};
  for (const theme of ["light", "dark"]) {
    await p.setContent(
      `<style>${css}</style><body><div id="t" data-theme="${theme}"><i id="pr"></i></div>`,
    );
    const rows = await p.evaluate((pairs) => {
      const e = document.getElementById("pr")!;
      const k = document
        .createElement("canvas")
        .getContext("2d", { willReadFrequently: true })!;
      k.canvas.width = k.canvas.height = 1;
      const rgb = (n: string) => {
        e.style.color = `var(--${n.startsWith("ig-") ? n : `igd-${n}`})`;
        const c = getComputedStyle(e).color;
        k.clearRect(0, 0, 1, 1);
        k.fillStyle = "#fff";
        k.fillRect(0, 0, 1, 1);
        k.fillStyle = c;
        k.fillRect(0, 0, 1, 1);
        return [...k.getImageData(0, 0, 1, 1).data].slice(0, 3);
      };
      const lum = (a: number[]) => {
        const f = (v: number) => {
          const x = v / 255;
          return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * f(a[0]) + 0.7152 * f(a[1]) + 0.0722 * f(a[2]);
      };
      return pairs.map(([fg, bg, min = 4.5]) => {
        const x = lum(rgb(fg));
        const y = lum(rgb(bg));
        const r = (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
        return { fg, bg, ratio: +r.toFixed(2), min, ok: r >= min };
      });
    }, pairs);
    report[theme] = rows;
    for (const r of rows)
      if (!r.ok) {
        fail++;
        console.log(
          `${theme}: ${r.fg} on ${r.bg} is ${r.ratio}:1, needs ${r.min}`,
        );
      }
  }
  fs.writeFileSync(
    `${REP}contrast-report-themes.json`,
    JSON.stringify(report, null, 1),
  );
  console.log(
    fail
      ? `theme contrast gate: ${fail} FAILING`
      : `theme contrast gate: pass (${pairs.length} pairings × 2 themes, AA)`,
  );
  await b.close();
  process.exit(fail ? 1 : 0);
})();
