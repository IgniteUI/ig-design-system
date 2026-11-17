// Compiles the engine's palette() for each palette set and writes the raw colour of every shade, as hex, to src/palettes.json.
// Usage: node src/palettes.ts
import fs from "node:fs";
import { hexByte, rgbToHex } from "./color.ts";
import { sets } from "./palette-sets.ts";
import { fromRoot } from "./paths.ts";
import { compile } from "./sass.ts";

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

/** Turns the `r g b a` channels the stylesheet prints into `#rrggbb`, or `#rrggbbaa` below full alpha. */
const toHex = (channels: string) => {
  const [r, g, b, a] = channels.split(" ").map(Number);
  return `${rgbToHex([r, g, b])}${a < 1 ? hexByte(a * 255) : ""}`;
};

const flat: Record<string, Record<string, string>> = {};
for (const [k, expr] of Object.entries(sets)) {
  flat[k] = {};
  for (const m of compile(rawShades(expr)).matchAll(/--([\w-]+): ([^;]+);/g))
    flat[k][m[1]] = toHex(m[2]);
}
fs.writeFileSync(fromRoot("src/palettes.json"), JSON.stringify(flat, null, 1));
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
