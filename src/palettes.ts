// Compiles the engine's palette() Sass function and stores the raw colour of every shade as hex.

import { execSync } from "node:child_process";
import fs from "node:fs";
import { sets } from "./palette-sets.ts";

// Every shade carries its plain colour under <shade>-raw; the plain key can hold a CSS expression.
// A raw colour outside sRGB is clipped, as a browser paints it.
const rawShades = (palette: string) => `@use 'sass:color';
@use 'sass:map';
@use 'sass:string';
@use 'igniteui-theming' as *;
$p: ${palette};
.raw {
  @each $family, $shades in map.remove($p, '_meta') {
    @each $shade, $value in $shades {
      $i: string.index('#{$shade}', '-raw');
      @if $i {
        $c: color.to-gamut($value, $space: rgb, $method: clip);
        --#{$family}-#{string.slice('#{$shade}', 1, $i - 1)}: #{color.channel($c, 'red', $space: rgb)} #{color.channel($c, 'green', $space: rgb)} #{color.channel($c, 'blue', $space: rgb)} #{color.alpha($c)};
      }
    }
  }
}
`;

const hex = (v: number) => Math.round(v).toString(16).padStart(2, "0");
/** Turns the `r g b a` channels the stylesheet prints into `#rrggbb`, or `#rrggbbaa` below full alpha. */
const toHex = (channels: string) => {
  const [r, g, b, a] = channels.split(" ").map(Number);
  return `#${hex(r)}${hex(g)}${hex(b)}${a < 1 ? hex(a * 255) : ""}`;
};

fs.mkdirSync(".cache/sass", { recursive: true });
const flat: Record<string, Record<string, string>> = {};
for (const [k, expr] of Object.entries(sets)) {
  fs.writeFileSync(`.cache/sass/${k}.scss`, rawShades(expr));
  execSync(
    `npx sass --quiet --no-source-map --load-path=node_modules .cache/sass/${k}.scss .cache/sass/${k}.css`,
  );
  flat[k] = {};
  for (const m of fs
    .readFileSync(`.cache/sass/${k}.css`, "utf8")
    .matchAll(/--([\w-]+): ([^;]+);/g))
    flat[k][m[1]] = toHex(m[2]);
}
fs.writeFileSync("src/palettes.json", JSON.stringify(flat, null, 1));
for (const k of Object.keys(flat))
  console.log(
    k,
    Object.keys(flat[k]).length,
    "colours; sample:",
    flat[k]["primary-500"],
    flat[k]["gray-900"] ?? "",
    flat[k]["surface-base"] ?? "",
    flat[k]["surface-50"] ?? "",
  );
