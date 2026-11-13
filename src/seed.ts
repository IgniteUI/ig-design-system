/* Infragistics Marketing Design System — components/seed.js
   One seed colour drives the brand ramp (primary + info). The ramp is re-derived in CSS from three knobs,
   so hover, active, focus, tints, borders, shadows, glows and the gradient start all follow. No per-state colour exists.
   setSeed('#155dfc') | setSeed({ l: .547, c: .246, h: 262.9 }) | setSecondary('#9810fa') | resetSeed() | contrast() | inGamut(o) | fit(o)
   A seed given as l, c, h that no screen can show is fitted first: its chroma is lowered until it can be shown. */
(function (g) {
  var DEFAULT = "#155dfc";
  function toOklch(hex: string): IgOklch {
    var v = [1, 3, 5].map(function (i) {
      var x = parseInt(hex.slice(i, i + 2), 16) / 255;
      return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    var r = v[0],
      gg = v[1],
      b = v[2];
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * gg + 0.0514459929 * b),
      m = Math.cbrt(0.2119034982 * r + 0.6806995451 * gg + 0.1073969566 * b),
      s = Math.cbrt(0.0883024619 * r + 0.2817188376 * gg + 0.6299787005 * b);
    var A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    var h = (Math.atan2(B, A) * 180) / Math.PI;
    if (h < 0) h += 360;
    return {
      l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      c: Math.hypot(A, B),
      h: h,
    };
  }
  var D = toOklch(DEFAULT);
  /* can a standard (sRGB) screen show this colour? */
  function inGamut(o: IgOklch): boolean {
    var a = o.c * Math.cos((o.h * Math.PI) / 180),
      b = o.c * Math.sin((o.h * Math.PI) / 180);
    var l = Math.pow(o.l + 0.3963377774 * a + 0.2158037573 * b, 3),
      m = Math.pow(o.l - 0.1055613458 * a - 0.0638541728 * b, 3),
      s = Math.pow(o.l - 0.0894841775 * a - 1.291485548 * b, 3);
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ].every(function (v) {
      return v > -0.0005 && v < 1.0005;
    });
  }
  /* guard rail: a seed no screen can show is brought back by lowering its chroma, keeping lightness and hue.
     Without it the browser clips the colour and the label colour is chosen for a colour that is not the one on screen. */
  function fit(o: IgOklch): IgFittedOklch {
    if (inGamut(o)) return { l: o.l, c: o.c, h: o.h, fitted: false };
    var lo = 0,
      hi = o.c;
    for (var i = 0; i < 24; i++) {
      var mid = (lo + hi) / 2;
      if (inGamut({ l: o.l, c: mid, h: o.h })) lo = mid;
      else hi = mid;
    }
    return { l: o.l, c: lo, h: o.h, fitted: true };
  }
  /* the seeds that can be moved at runtime: the knob family each one drives, and the engine's own value */
  var FAMILIES: Record<IgSeedFamily, string> = {
    brand: DEFAULT,
    secondary: "#9810fa",
  };
  function setSeed(
    seed: string | IgOklch,
    el?: HTMLElement,
    family?: IgSeedFamily,
  ): IgOklch | IgFittedOklch {
    el = el || document.documentElement;
    family = family || "brand";
    var o = typeof seed === "string" ? toOklch(seed) : fit(seed),
      d = toOklch(FAMILIES[family]);
    el.style.setProperty("--" + family + "-dl", (o.l - d.l).toFixed(6));
    el.style.setProperty("--" + family + "-kc", (o.c / d.c).toFixed(6));
    el.style.setProperty("--" + family + "-dh", (o.h - d.h).toFixed(4));
    return o;
  }
  function setSecondary(seed: string | IgOklch, el?: HTMLElement) {
    return setSeed(seed, el, "secondary");
  }
  /* with no family named, every seed goes back to the engine's value */
  function resetSeed(el?: HTMLElement, family?: IgSeedFamily): void {
    var target = el || document.documentElement;
    (family ? [family] : Object.keys(FAMILIES)).forEach(function (f) {
      ["-dl", "-kc", "-dh"].forEach(function (k) {
        target.style.removeProperty("--" + f + k);
      });
    });
  }
  function rgb(c: string): number[] {
    var k = document
      .createElement("canvas")
      .getContext("2d", { willReadFrequently: true })!;
    k.fillStyle = "#000";
    k.fillStyle = c;
    k.fillRect(0, 0, 1, 1);
    return Array.prototype.slice.call(k.getImageData(0, 0, 1, 1).data, 0, 3);
  }
  function lum(a: number[]) {
    var f = function (v: number) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(a[0]) + 0.7152 * f(a[1]) + 0.0722 * f(a[2]);
  }
  function ratio(a: number[], b: number[]) {
    var x = lum(a),
      y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  /* the AA pairings a seed touches: the label on the action fill, and the action colour as text on the page. page is the raw fill against the page, for information */
  function contrast(): IgSeedContrast {
    var p = document.createElement("div");
    p.style.cssText =
      "position:absolute;visibility:hidden;background:var(--color-action-default);color:var(--color-action-on);outline-color:var(--color-action-text)";
    document.body.appendChild(p);
    var s = getComputedStyle(p),
      bg = rgb(s.backgroundColor),
      on = rgb(s.color),
      tx = rgb(s.outlineColor),
      pg = rgb(getComputedStyle(document.body).backgroundColor);
    p.remove();
    return {
      label: ratio(bg, on),
      text: ratio(tx, pg),
      page: ratio(bg, pg),
      labelOk: ratio(bg, on) >= 4.5,
      textOk: ratio(tx, pg) >= 4.5,
      pageOk: ratio(bg, pg) >= 3,
    };
  }
  g.IgSeed = {
    DEFAULT: DEFAULT,
    SECONDARY: FAMILIES.secondary,
    setSeed: setSeed,
    setSecondary: setSecondary,
    resetSeed: resetSeed,
    toOklch: toOklch,
    inGamut: inGamut,
    fit: fit,
    contrast: contrast,
    rgb: rgb,
  };
})(typeof window !== "undefined" ? window : globalThis);

interface IgOklch {
  l: number;
  c: number;
  h: number;
}
interface IgFittedOklch extends IgOklch {
  fitted: boolean;
}
type IgSeedFamily = "brand" | "secondary";
interface IgSeedContrast {
  label: number;
  text: number;
  page: number;
  labelOk: boolean;
  textOk: boolean;
  pageOk: boolean;
}
interface IgSeedApi {
  DEFAULT: string;
  SECONDARY: string;
  /** Moves a seed family on `el` (default: the root, family `brand`). An `l, c, h` seed outside sRGB is fitted first. */
  setSeed(
    seed: string | IgOklch,
    el?: HTMLElement,
    family?: IgSeedFamily,
  ): IgOklch | IgFittedOklch;
  setSecondary(
    seed: string | IgOklch,
    el?: HTMLElement,
  ): IgOklch | IgFittedOklch;
  /** Puts one family back to the engine's value, or every family when none is named. */
  resetSeed(el?: HTMLElement, family?: IgSeedFamily): void;
  toOklch(hex: string): IgOklch;
  inGamut(o: IgOklch): boolean;
  /** Lowers chroma until the colour is inside sRGB; lightness and hue are kept. */
  fit(o: IgOklch): IgFittedOklch;
  /** Measures the AA pairings a seed touches on the current page. */
  contrast(): IgSeedContrast;
  rgb(c: string): number[];
}
declare var IgSeed: IgSeedApi;
