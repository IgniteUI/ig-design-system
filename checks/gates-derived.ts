// Gate: every colour a component uses in a state (hover, focus, active, disabled, invalid, checked…) is either a base
// token or derived from one. Overriding a base must move every state colour that belongs to it, and at the default
// every derived token must still equal the engine's own value.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

type Derived = { base: string };
type Named<T> = Record<string, T>;
const ROOT = path.join(import.meta.dirname, "..");
// node checks/gates-derived.ts [dist directory]
const OUT = path.join(process.argv[2] ?? path.join(ROOT, "dist"), "/");
const REP = path.join(ROOT, "reports/");
const BASES = [
  "color-action-default",
  "color-action-text",
  "color-accent-primary",
  "color-accent-inverse",
  "color-link-inverse",
  "footer-link",
  "color-feedback-error-default",
  "badge-bundle-color",
  "color-text-heading",
  "color-text-inverse",
  "color-text-muted",
  "color-surface-subtle",
  "footer-heading",
  "footer-text",
  "shadow-raised",
];
(async () => {
  const tokens = fs.readFileSync(`${OUT}tokens.css`, "utf8");
  const bundle =
    fs.readFileSync(`${OUT}theme.css`, "utf8") +
    "\n" +
    fs.readFileSync(path.join(ROOT, ".cache/components.css"), "utf8");
  const derived: Named<Derived> = JSON.parse(
    fs.readFileSync(`${REP}derived-states.json`, "utf8"),
  );
  const comp = fs
    .readFileSync(path.join(ROOT, "reference/components.css"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  const st =
    /:hover|:focus|:active|:disabled|aria-|:checked|data-open|data-active|:invalid|placeholder/;
  const used: Named<string[]> = {};
  for (const m of comp.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!st.test(m[1])) continue;
    for (const d of m[2].matchAll(/([a-z-]+)\s*:\s*([^;]+)/g)) {
      if (!/color|background|border|shadow|outline|fill|stroke/.test(d[1]))
        continue;
      for (const v of d[2].matchAll(/var\(--igd-([a-z0-9-]+)/g))
        if (!/^(focus-ring|radius|border-width|space|size)/.test(v[1])) {
          used[v[1]] ??= [];
          used[v[1]].push(m[1].trim().split("\n").pop()!.slice(0, 60));
        }
    }
  }
  for (const d of Object.values(derived))
    if (!BASES.includes(d.base) && !derived[d.base]) BASES.push(d.base);
  // every colour token, for the pair check below
  const all = [
    ...new Set(
      [
        ...(tokens + bundle).matchAll(
          /^\s*--igd-((?:color|badge|footer|nav|table|tile|fw|window|callout)-[a-z0-9-]+):/gm,
        ),
      ].map((m) => m[1]),
    ),
  ].filter(
    (n) => !/shadow|gradient|glow|width|height|size|radius|offset|blur/.test(n),
  );
  const names = [
    ...new Set([
      ...Object.keys(used),
      ...Object.keys(derived),
      ...all,
      ...BASES,
    ]),
  ];
  const b = await chromium.launch();
  const p = await b.newPage();
  const read = async (css: string, extra = "") => {
    await p.setContent(
      `<style>${css}</style><style>:root{${extra}}</style><body><div id=pr></div>`,
    );
    return p.evaluate((ns: string[]) => {
      const e = document.getElementById("pr")!;
      const o: Record<string, string> = {};
      for (const n of ns) {
        e.style.cssText = "";
        if (n.includes("shadow")) {
          e.style.boxShadow = `var(--igd-${n})`;
          o[n] = getComputedStyle(e).boxShadow;
        } else {
          e.style.color = `var(--igd-${n})`;
          const c = getComputedStyle(e).color;
          const k = document.createElement("canvas").getContext("2d")!;
          k.fillStyle = c;
          k.fillRect(0, 0, 1, 1);
          o[n] = [...k.getImageData(0, 0, 1, 1).data].join(",");
        }
      }
      return o;
    }, names);
  };
  let fail = 0;
  const snap = await read(tokens);
  const live = await read(tokens + bundle);
  for (const n of Object.keys(derived)) {
    const a = snap[n].split(",").map(Number);
    const z = live[n].split(",").map(Number);
    const d = Math.max(...a.map((v, i) => Math.abs(v - z[i])));
    if (d > 1) {
      fail++;
      console.log("DRIFT", n, snap[n], live[n]);
    }
  }
  // A light and a dark probe: a token follows its base when either one moves it, so a base that already equals one probe is still detected.
  const PROBES = ["oklch(.6 .2 150)", "oklch(.3 .15 300)"];
  const follows: Named<string[]> = {};
  for (const base of BASES) {
    const moved = new Set<string>();
    for (const probe of PROBES) {
      const o = await read(
        tokens + bundle,
        `--igd-${base}: ${base.includes("shadow") ? `0 0 0 9px ${probe}` : probe};`,
      );
      for (const n of names) if (o[n] !== live[n]) moved.add(n);
    }
    for (const n of moved) {
      follows[n] ??= [];
      follows[n].push(base);
    }
  }
  for (const [n, d] of Object.entries(derived))
    if (!(follows[n] || []).includes(d.base)) {
      fail++;
      console.log("NOT DERIVED", n, "should follow", d.base);
    }
  // 4. pairs: tokens that share a stem (x-background, x-border, x-color, x-hover…) must hang off one base.
  // A member is a root when overriding no other token moves it. A chromatic group may have one root at most.
  const SUF =
    /-(fill-hover|background|border|color|hover|active|subtle|on|ring|muted|strong|default|inverse)$/;
  const chroma = (v: string) => {
    const [r, g2, b2] = v.split(",").map(Number);
    return Math.max(r, g2, b2) - Math.min(r, g2, b2);
  };
  const moved: Named<string[]> = {};
  for (const t of all) {
    const hit = new Set<string>();
    for (const probe of PROBES) {
      const o = await read(tokens + bundle, `--igd-${t}: ${probe};`);
      for (const n of all) if (n !== t && o[n] !== live[n]) hit.add(n);
    }
    moved[t] = all.filter((n) => hit.has(n));
  }
  const affected: Named<string[]> = {};
  for (const [t, ms] of Object.entries(moved))
    for (const m of ms) {
      affected[m] ??= [];
      affected[m].push(t);
    }
  const groups: Named<string[]> = {};
  for (const n of all) {
    const stem = SUF.test(n) ? n.replace(SUF, "") : n;
    groups[stem] ??= [];
    groups[stem].push(n);
  }
  const pairs: [stem: string, members: number, roots: string[]][] = [];
  for (const [stem, ms] of Object.entries(groups)) {
    if (ms.length < 2) continue;
    const chrom = ms.filter((n) => chroma(live[n]) > 24);
    if (chrom.length < 2) continue;
    const roots = chrom.filter((n) => !(affected[n] || []).length);
    pairs.push([stem, ms.length, roots]);
    if (roots.length > 1) {
      fail++;
      console.log(
        "UNPAIRED",
        stem,
        "has",
        roots.length,
        "independent colours:",
        roots.join(", "),
      );
    }
  }
  const rows: [token: string, kind: string, uses: number][] = [];
  for (const n of Object.keys(used).sort()) {
    const f = (follows[n] || []).filter((x) => x !== n);
    const kind = BASES.includes(n)
      ? "base"
      : f.length
        ? `derived from ${f.join(", ")}`
        : "ORPHAN";
    if (kind === "ORPHAN") fail++;
    rows.push([n, kind, used[n].length]);
  }
  console.log(rows.map((r) => r[0].padEnd(34) + r[1]).join("\n"));
  fs.writeFileSync(
    `${REP}derived-gate.json`,
    JSON.stringify(
      {
        stateTokens: rows.length,
        derivedTokens: Object.keys(derived).length,
        pairGroups: pairs.length,
        rows,
        pairs,
        fail,
      },
      null,
      1,
    ),
  );
  console.log(
    fail
      ? `derived-state gate: ${fail} FAILING`
      : `derived-state gate: pass (${rows.length} state colours, ${Object.keys(derived).length} derived tokens, ${pairs.length} paired groups)`,
  );
  await b.close();
  process.exit(fail ? 1 : 0);
})();
