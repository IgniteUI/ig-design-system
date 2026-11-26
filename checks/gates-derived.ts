// Gate: every state colour of a component is a base token or follows one, and equals the engine's value at the default.
// Usage: node checks/gates-derived.ts [dist directory]
import fs from "node:fs";
import path from "node:path";
import { chromium, type Page } from "playwright";

type Derived = { base: string };
type Named<T> = Record<string, T>;
const ROOT = path.join(import.meta.dirname, "..");
const OUT = path.join(process.argv[2] ?? path.join(ROOT, "dist"), "/");
const REP = path.join(ROOT, "reports/");
const BASES = [
  "color-background-action",
  "color-foreground-action",
  "color-accent-brand",
  "color-accent-inverse-1",
  "color-foreground-link-inverse",
  "footer-link-foreground",
  "color-foreground-error",
  "badge-bundle-foreground",
  "color-foreground-heading",
  "color-foreground-inverse",
  "color-foreground-faint",
  "color-background-band",
  "footer-foreground-faint",
  "footer-foreground",
  "shadow-card-hover",
];
// A light and a dark probe: a token follows its base when either one moves it.
const PROBES = ["oklch(.6 .2 150)", "oklch(.3 .15 300)"];
// A selector for a state: a pseudo-class or an attribute that marks one.
const STATE_SELECTOR =
  /:hover|:focus|:active|:disabled|aria-|:checked|data-open|data-active|:invalid|placeholder/;
// The last part of a token name that says which member of a group it is.
const MEMBER_SUFFIX =
  /-(fill-hover|background|border|color|hover|active|subtle|on|ring|muted|strong|default|inverse)$/;
// The least difference between the largest and the smallest channel, of 255, for a colour to count as chromatic.
const CHROMATIC_SPREAD = 24;

/** The colour and shadow tokens that the state rules of the reference components read, each with the selectors that use it. */
const stateTokens = (componentsCss: string) => {
  const used: Named<string[]> = {};
  const css = componentsCss.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!STATE_SELECTOR.test(selector)) continue;
    for (const [, property, value] of body.matchAll(
      /([a-z-]+)\s*:\s*([^;]+)/g,
    )) {
      if (!/color|background|border|shadow|outline|fill|stroke/.test(property))
        continue;
      for (const [, token] of value.matchAll(/var\(--igd-([a-z0-9-]+)/g))
        if (!/^(focus-ring|radius|border-width|space|size)/.test(token)) {
          used[token] ??= [];
          used[token].push(selector.trim().split("\n").pop()!.slice(0, 60));
        }
    }
  }
  return used;
};

/** Every colour token the stylesheets declare. */
const colorTokens = (css: string) =>
  [
    ...new Set(
      [
        ...css.matchAll(
          /^\s*--igd-((?:color|badge|footer|nav|table|tile|fw|window|callout)-[a-z0-9-]+):/gm,
        ),
      ].map((m) => m[1]),
    ),
  ].filter(
    (n) => !/shadow|gradient|glow|width|height|size|radius|offset|blur/.test(n),
  );

/** The rendered value of each token: `r,g,b,a` for a colour, the computed box-shadow for a shadow. `overrides` are declared on :root. */
const renderedValues = async (
  page: Page,
  css: string,
  names: string[],
  overrides = "",
) => {
  await page.setContent(
    `<style>${css}</style><style>:root{${overrides}}</style><body><div id=pr></div>`,
  );
  return page.evaluate((ns: string[]) => {
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

/** The derived tokens whose live value is more than one channel step from the published one. Logs each. */
const driftCount = (
  derived: Named<Derived>,
  published: Named<string>,
  live: Named<string>,
) => {
  let drifted = 0;
  for (const name of Object.keys(derived)) {
    const before = published[name].split(",").map(Number);
    const after = live[name].split(",").map(Number);
    const distance = Math.max(...before.map((v, i) => Math.abs(v - after[i])));
    if (distance > 1) {
      drifted++;
      console.log("DRIFT", name, published[name], live[name]);
    }
  }
  return drifted;
};

/** The tokens among `names` that change when `token` is set to a probe colour. */
const movedBy = async (
  read: (overrides: string) => Promise<Named<string>>,
  token: string,
  names: string[],
  live: Named<string>,
) => {
  const moved = new Set<string>();
  for (const probe of PROBES) {
    const values = await read(
      `--igd-${token}: ${token.includes("shadow") ? `0 0 0 9px ${probe}` : probe};`,
    );
    for (const name of names) if (values[name] !== live[name]) moved.add(name);
  }
  return moved;
};

/** For each token, the tokens whose override moves it. */
const invert = (movedByToken: Named<string[]>) => {
  const movers: Named<string[]> = {};
  for (const [token, moved] of Object.entries(movedByToken))
    for (const name of moved) {
      movers[name] ??= [];
      movers[name].push(token);
    }
  return movers;
};

/** The difference between the largest and the smallest colour channel of `r,g,b,a`. */
const channelSpread = (value: string) => {
  const [r, g, b] = value.split(",").map(Number);
  return Math.max(r, g, b) - Math.min(r, g, b);
};

/**
 * The groups of tokens that share a stem and hold two chromatic colours or more, each with its roots.
 * A member is a root when overriding no other token moves it.
 */
const pairedGroups = (
  colors: string[],
  live: Named<string>,
  movers: Named<string[]>,
) => {
  const groups: Named<string[]> = {};
  for (const name of colors) {
    const stem = MEMBER_SUFFIX.test(name)
      ? name.replace(MEMBER_SUFFIX, "")
      : name;
    groups[stem] ??= [];
    groups[stem].push(name);
  }
  const pairs: { stem: string; roots: string[] }[] = [];
  for (const [stem, members] of Object.entries(groups)) {
    if (members.length < 2) continue;
    const chromatic = members.filter(
      (n) => channelSpread(live[n]) > CHROMATIC_SPREAD,
    );
    if (chromatic.length < 2) continue;
    pairs.push({
      stem,
      roots: chromatic.filter((n) => !(movers[n] || []).length),
    });
  }
  return pairs;
};

(async () => {
  const tokens = fs.readFileSync(`${OUT}tokens.css`, "utf8");
  const bundle =
    fs.readFileSync(`${OUT}theme.css`, "utf8") +
    "\n" +
    fs.readFileSync(path.join(ROOT, ".cache/components.css"), "utf8");
  const derived: Named<Derived> = JSON.parse(
    fs.readFileSync(`${REP}derived-states.json`, "utf8"),
  );
  const used = stateTokens(
    fs.readFileSync(path.join(ROOT, "reference/components.css"), "utf8"),
  );
  const bases = [...BASES];
  for (const d of Object.values(derived))
    if (!bases.includes(d.base) && !derived[d.base]) bases.push(d.base);
  const colors = colorTokens(tokens + bundle);
  const names = [
    ...new Set([
      ...Object.keys(used),
      ...Object.keys(derived),
      ...colors,
      ...bases,
    ]),
  ];

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const published = await renderedValues(page, tokens, names);
  const live = await renderedValues(page, tokens + bundle, names);
  const readLive = (overrides: string) =>
    renderedValues(page, tokens + bundle, names, overrides);
  let fail = driftCount(derived, published, live);

  const follows: Named<string[]> = {};
  for (const base of bases)
    for (const name of await movedBy(readLive, base, names, live)) {
      follows[name] ??= [];
      follows[name].push(base);
    }
  for (const [name, d] of Object.entries(derived))
    if (!(follows[name] || []).includes(d.base)) {
      fail++;
      console.log("NOT DERIVED", name, "should follow", d.base);
    }

  const movedByColor: Named<string[]> = {};
  for (const token of colors) {
    const moved = await movedBy(readLive, token, colors, live);
    movedByColor[token] = colors.filter((n) => n !== token && moved.has(n));
  }
  const pairs = pairedGroups(colors, live, invert(movedByColor));
  for (const { stem, roots } of pairs)
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

  const rows: [token: string, kind: string][] = [];
  for (const name of Object.keys(used).sort()) {
    const followed = (follows[name] || []).filter((x) => x !== name);
    const kind = bases.includes(name)
      ? "base"
      : followed.length
        ? `derived from ${followed.join(", ")}`
        : "ORPHAN";
    if (kind === "ORPHAN") fail++;
    rows.push([name, kind]);
  }
  console.log(rows.map(([name, kind]) => name.padEnd(34) + kind).join("\n"));
  console.log(
    fail
      ? `derived-state gate: ${fail} FAILING`
      : `derived-state gate: pass (${rows.length} state colours, ${Object.keys(derived).length} derived tokens, ${pairs.length} paired groups)`,
  );
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
