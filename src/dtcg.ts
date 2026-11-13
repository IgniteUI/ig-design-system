// node src/dtcg.ts <tokens.json> <theme.css> <out.tokens.json>
// Emits the tokens in the Design Tokens Community Group format (Format Module 2025.10) for design tools and native platforms.
// tokens.json stays the source; this file is generated from it and validated before it is written.
import fs from "node:fs";
import { isMain } from "./main.ts";
import type { Tokens } from "./types.ts";

type DtcgToken = {
  $value: unknown;
  $description?: string;
  $type?: string;
  $extensions?: object;
};
type DtcgGroup = {
  $type: string;
  $description?: string;
  [name: string]: DtcgToken | string | undefined;
};
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
const hexColor = (hex: string, alpha?: number) => {
  const c = [1, 3, 5].map((i) =>
    r4(Number.parseInt(hex.slice(i, i + 2), 16) / 255),
  );
  return {
    colorSpace: "srgb",
    components: c,
    ...(alpha !== undefined && alpha !== 1 ? { alpha } : {}),
    hex: hex.toLowerCase(),
  };
};
const toHex = (r: string, g: string, b: string) =>
  `#${[r, g, b].map((v) => (+v).toString(16).padStart(2, "0")).join("")}`;
export const color = (v: string) => {
  if (/^#[0-9a-f]{6}$/i.test(v)) return hexColor(v);
  const m = v.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (m)
    return hexColor(
      toHex(m[1], m[2], m[3]),
      m[4] === undefined ? undefined : +m[4],
    );
  return null;
};
export const dim = (v: string) => {
  const m = String(v).match(/^(-?[\d.]+)(px|rem)$/);
  return m
    ? { value: +m[1], unit: m[2] }
    : String(v) === "0"
      ? { value: 0, unit: "px" }
      : null;
};
/** Converts tokens.json to the DTCG file and validates it. `bundle` is theme.css, the source of the motion tokens. */
export const toDtcg = (T: Tokens, bundle: string) => {
  const cssOnly: Record<string, { value: string; reason: string }> = {};
  const skip = (name: string, value: string, why: string) => {
    cssOnly[name] = { value, reason: why };
  };
  const tok = (
    value: unknown,
    usage?: string,
    extra: object = {},
  ): DtcgToken => ({
    $value: value,
    ...(usage ? { $description: usage } : {}),
    ...extra,
  });
  const out: Record<string, DtcgGroup> = {};

  // colour: engine steps and semantic names in one group, so an alias is {color.<name>}
  out.color = { $type: "color" };
  for (const t of T.color.tokens) {
    const a = String(t.value).match(/^\{(.+)\}$/);
    const v = a ? `{color.${a[1]}}` : color(t.value);
    if (v) out.color[t.name] = tok(v, t.usage);
    else skip(t.name, t.value, "not a plain colour");
  }

  out.spacing = { $type: "dimension" };
  for (const t of T.spacing.tokens) {
    const a = String(t.value).match(/^\{(.+)\}$/);
    out.spacing[t.name] = tok(a ? `{spacing.${a[1]}}` : dim(t.value), t.usage);
  }
  out.radius = { $type: "dimension" };
  for (const t of T.radius.tokens)
    out.radius[t.name] = tok(dim(t.value), t.usage);
  out.size = { $type: "dimension" };
  out.letterSpacing = {
    $type: "number",
    $description: "Letter spacing as a multiple of the font size (em).",
  };
  for (const t of T.size.tokens) {
    const d = dim(t.value);
    const em = String(t.value).match(/^(-?[\d.]+)em$/);
    if (d) out.size[t.name] = tok(d, t.usage);
    else if (em) out.letterSpacing[t.name] = tok(+em[1], t.usage);
    else skip(t.name, t.value, "not a length");
  }
  out.breakpoint = { $type: "dimension" };
  for (const t of T.breakpoint.tokens)
    out.breakpoint[t.name] = tok(dim(t.value), t.usage);
  out.opacity = { $type: "number" };
  for (const t of T.opacity.tokens)
    out.opacity[t.name] = tok(+t.value, t.usage);
  out.zIndex = { $type: "number" };
  for (const t of T.zIndex.tokens) out.zIndex[t.name] = tok(+t.value, t.usage);
  out.fontWeight = { $type: "fontWeight" };
  for (const t of T.weight.tokens)
    out.fontWeight[t.name] = tok(+t.value, t.usage);
  out.fontFamily = { $type: "fontFamily" };
  for (const [k, v] of Object.entries(T.type.families))
    out.fontFamily[`font-${k}`] = tok(
      v.split(",").map((s) => s.trim().replace(/^'|'$/g, "")),
    );

  // shadows: one object per layer; filters and "none" cannot be expressed and are listed under $extensions
  out.shadow = { $type: "shadow" };
  const layer = (s: string) => {
    const inset = /^inset\s+/.test(s);
    const m = s
      .replace(/^inset\s+/, "")
      .match(
        /^(-?[\d.]+(?:px)?)\s+(-?[\d.]+(?:px)?)\s+(-?[\d.]+(?:px)?)\s+(-?[\d.]+(?:px)?)\s+(rgba?\([^)]*\))$/,
      );
    if (!m) return null;
    const px = (x: string) => ({ value: Number.parseFloat(x), unit: "px" });
    const c = color(m[5].replace(/\s/g, "").replace(/,/g, ","));
    return (
      c && {
        color: c,
        offsetX: px(m[1]),
        offsetY: px(m[2]),
        blur: px(m[3]),
        spread: px(m[4]),
        ...(inset ? { inset: true } : {}),
      }
    );
  };
  for (const t of T.shadow.tokens) {
    const parts = String(t.value)
      .split(/,(?![^(]*\))/)
      .map((s) => s.trim());
    const ls = parts.map(layer);
    if (t.value === "none" || ls.some((l) => !l))
      skip(
        t.name,
        t.value,
        t.value === "none" ? "no shadow" : "a CSS filter, not a box shadow",
      );
    else out.shadow[t.name] = tok(ls.length === 1 ? ls[0] : ls, t.usage);
  }

  // gradients: the format holds colour stops only, so the angle travels in $extensions; radial glows are CSS only
  out.gradient = { $type: "gradient" };
  for (const t of T.gradient.tokens) {
    const m = String(t.value).match(/^linear-gradient\(([\d.]+)deg,\s*(.+)\)$/);
    if (!m) {
      skip(t.name, t.value, "a radial glow");
      continue;
    }
    const stops = m[2]
      .split(/,(?![^(]*\))/)
      .map((s) =>
        s.trim().match(/^(#[0-9a-f]{6}|rgba?\([^)]*\))(?:\s+([\d.]+)%)?$/i),
      );
    if (stops.some((s) => !s)) {
      skip(t.name, t.value, "stops are not plain colours");
      continue;
    }
    out.gradient[t.name] = tok(
      stops.map((s, i) => ({
        color: color(s![1].replace(/\s/g, "")),
        position:
          s![2] !== undefined ? +s![2] / 100 : r4(i / (stops.length - 1)),
      })),
      t.usage,
      {
        $extensions: {
          "com.infragistics.css": { angle: +m[1], value: t.value },
        },
      },
    );
  }

  // type styles as composite tokens. Line height is a multiple of the font size; letter spacing is converted from em.
  out.typography = { $type: "typography" };
  for (const g of T.type.groups)
    for (const st of g.styles) {
      const fs_ = dim(st.fontSize)!;
      const lh = dim(st.lineHeight)!;
      const em = st.letterSpacing ? Number.parseFloat(st.letterSpacing) : 0;
      out.typography[st.name] = tok(
        {
          fontFamily: `{fontFamily.font-${st.family || g.family}}`,
          fontSize: fs_,
          fontWeight: +st.fontWeight,
          letterSpacing: { value: r4(em * fs_.value), unit: fs_.unit },
          lineHeight: r4(lh.value / fs_.value),
        },
        st.usage,
      );
    }

  // motion lives in theme.css
  out.duration = { $type: "duration" };
  out.easing = { $type: "cubicBezier" };
  for (const m of bundle.matchAll(
    /^\s*--(duration-[a-z0-9-]+):\s*([\d.]+)(ms|s);/gm,
  ))
    out.duration[m[1]] ??= tok({ value: +m[2], unit: m[3] });
  for (const m of bundle.matchAll(
    /^\s*--(easing-[a-z0-9-]+):\s*cubic-bezier\(([^)]+)\);/gm,
  ))
    out.easing[m[1]] ??= tok(m[2].split(",").map(Number));
  for (const g of ["duration", "easing"])
    if (Object.keys(out[g]).length === 1) delete out[g];
  const file = {
    $description: `${T.name}, version ${T.version}. Generated from tokens.json; do not edit by hand.`,
    ...out,
    $extensions: {
      "com.infragistics.css-only": {
        $description:
          "Tokens the format cannot express. They exist in tokens.css and theme.css.",
        tokens: cssOnly,
      },
    },
  };

  // ---- validate before writing: names, required $value, a resolvable type, aliases that resolve, no cycles ----
  const errs: string[] = [];
  const flat: Record<string, { v: unknown; type?: string }> = {};
  const isToken = (v: DtcgToken | DtcgGroup): v is DtcgToken => "$value" in v;
  const walk = (
    node: DtcgGroup | Record<string, DtcgGroup>,
    path: string[],
    type?: string,
  ): void => {
    for (const [k, v] of Object.entries(node) as [
      string,
      DtcgToken | DtcgGroup,
    ][]) {
      if (k.startsWith("$")) continue;
      if (/[{}.]/.test(k)) errs.push(`bad name ${k}`);
      const p = [...path, k];
      if (v && typeof v === "object" && isToken(v)) {
        if (v.$value === null || v.$value === undefined)
          errs.push(`no value ${p.join(".")}`);
        flat[p.join(".")] = { v: v.$value, type: v.$type || type };
      } else walk(v, p, v.$type || type);
    }
  };
  walk(out, [], undefined);
  const refs = (v: unknown): string[] =>
    typeof v === "string"
      ? [...v.matchAll(/^\{([^}]+)\}$/g)].map((m) => m[1])
      : v && typeof v === "object"
        ? Object.values(v).flatMap(refs)
        : [];
  const resolve = (name: string, seen: string[] = []): void => {
    if (seen.includes(name)) {
      errs.push(`cycle ${name}`);
      return;
    }
    const t = flat[name];
    if (!t) {
      errs.push(`alias to missing token ${name} (from ${seen.at(-1)})`);
      return;
    }
    for (const r of refs(t.v)) resolve(r, [...seen, name]);
  };
  for (const [name, t] of Object.entries(flat)) {
    if (!t.type) errs.push(`no type ${name}`);
    resolve(name);
  }
  return { file, groups: out, flat, cssOnly, errs };
};

if (isMain(import.meta.url)) {
  const [, , IN, BUNDLE, OUT] = process.argv;
  const { file, flat, cssOnly, errs } = toDtcg(
    JSON.parse(fs.readFileSync(IN, "utf8")),
    fs.readFileSync(BUNDLE, "utf8"),
  );
  if (errs.length) {
    console.error(errs.slice(0, 20).join("\n"));
    console.error(`DTCG export: ${errs.length} error(s)`);
    process.exit(1);
  }
  fs.writeFileSync(OUT, JSON.stringify(file, null, 2));
  const byType: Record<string, number> = {};
  for (const t of Object.values(flat))
    byType[t.type!] = (byType[t.type!] || 0) + 1;
  console.log(
    `DTCG export: ${Object.keys(flat).length} tokens (${Object.entries(byType)
      .map(([k, n]) => `${k} ${n}`)
      .join(
        ", ",
      )}); ${Object.keys(cssOnly).length} CSS-only listed under $extensions`,
  );
}
