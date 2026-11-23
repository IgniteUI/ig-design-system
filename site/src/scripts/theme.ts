// The theme button. The page follows the system until the button is used, and stores a choice only while it differs from the system.
import { changed } from "./events.ts";

const KEY = "igd-theme";
const root = document.documentElement;
const system = matchMedia("(prefers-color-scheme: dark)");
const button = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");

const stored = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

const apply = (dark: boolean) => {
  root.setAttribute("data-theme", dark ? "dark" : "light");
  button?.setAttribute("aria-pressed", String(dark));
  changed();
};

button?.addEventListener("click", () => {
  const dark = root.getAttribute("data-theme") !== "dark";
  try {
    if (dark === system.matches) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, dark ? "dark" : "light");
  } catch {}
  apply(dark);
});

system.addEventListener("change", (e) => {
  if (!stored()) apply(e.matches);
});

addEventListener("storage", (e) => {
  if (e.key === KEY) apply(e.newValue ? e.newValue === "dark" : system.matches);
});

button?.setAttribute(
  "aria-pressed",
  String(root.getAttribute("data-theme") === "dark"),
);
