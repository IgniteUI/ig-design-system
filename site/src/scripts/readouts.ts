// Writes the rendered value of a token into its readout: a colour, a length, a type role or a contrast ratio.
import { CHANGE } from "./events.ts";

const root = document.documentElement;
const canvas = document.createElement("canvas").getContext("2d", {
  willReadFrequently: true,
});

// The red, green, blue and alpha of a CSS colour, each 0 to 255.
const channels = (colour: string) => {
  if (!canvas) return [0, 0, 0, 255];
  canvas.clearRect(0, 0, 1, 1);
  canvas.fillStyle = colour;
  canvas.fillRect(0, 0, 1, 1);
  return [...canvas.getImageData(0, 0, 1, 1).data];
};

const hex = (colour: string) => {
  const [r, g, b, a] = channels(colour);
  const value = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  return a < 255 ? `${value} at ${Math.round(a / 2.55)}%` : value;
};

const luminance = (colour: string) => {
  const [r, g, b] = channels(colour).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const round = (value: number, digits: number) =>
  Math.round(value * 10 ** digits) / 10 ** digits;

const outputs = (attribute: string) =>
  document.querySelectorAll<HTMLOutputElement>(`output[${attribute}]`);

const read = () => {
  const probe = document.createElement("i");
  probe.style.position = "absolute";
  // Measures a token in the scope or theme region its readout sits in.
  const place = (o: Element) => {
    const region = o.closest("[data-ig-scope], [data-theme]");
    (region && region !== root ? region : document.body).appendChild(probe);
  };
  for (const o of outputs("data-colour")) {
    place(o);
    probe.style.backgroundColor = `var(${o.dataset.colour})`;
    o.textContent = hex(getComputedStyle(probe).backgroundColor);
  }
  // The value of a swatch that has no room for a readout, as its tooltip.
  for (const el of document.querySelectorAll<HTMLElement>(
    "[data-colour-title]",
  )) {
    place(el);
    probe.style.backgroundColor = `var(${el.dataset.colourTitle})`;
    el.title = hex(getComputedStyle(probe).backgroundColor);
  }
  for (const o of outputs("data-length")) {
    place(o);
    probe.style.inlineSize = `var(${o.dataset.length})`;
    o.textContent = `${round(Number.parseFloat(getComputedStyle(probe).inlineSize), 2)}px`;
  }
  probe.remove();
  for (const o of outputs("data-type")) {
    const sample = document.querySelector(
      `[data-type-sample="${o.dataset.type}"]`,
    );
    if (!sample) continue;
    const s = getComputedStyle(sample);
    o.textContent = `${round(Number.parseFloat(s.fontSize), 1)}px / ${round(Number.parseFloat(s.lineHeight), 1)}px, ${s.fontWeight}`;
  }
  // The WCAG ratio of a colour against the surface of the sample its readout belongs to.
  for (const o of outputs("data-contrast")) {
    const surface = o.closest("[data-sample]")?.querySelector("[data-surface]");
    if (!surface) continue;
    const a = luminance(o.dataset.contrast ?? "");
    const b = luminance(getComputedStyle(surface).backgroundColor);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    o.textContent = `${round(ratio, 1)}:1`;
    o.toggleAttribute("data-low", ratio < Number(o.dataset.min ?? 0));
  }
};

document.addEventListener(CHANGE, read);
addEventListener("resize", read);
document.fonts.ready.then(read);
