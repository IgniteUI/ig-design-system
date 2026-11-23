// The type set buttons: each switches the page to its set, or back to the default.
import { changed } from "./events.ts";

const root = document.documentElement;
const buttons = document.querySelectorAll<HTMLButtonElement>(
  "button[data-type-set]",
);

for (const button of buttons)
  button.addEventListener("click", () => {
    const set = button.dataset.typeSet ?? "";
    if (root.getAttribute("data-igd-type") === set)
      root.removeAttribute("data-igd-type");
    else root.setAttribute("data-igd-type", set);
    for (const b of buttons)
      b.setAttribute(
        "aria-pressed",
        String(root.getAttribute("data-igd-type") === b.dataset.typeSet),
      );
    changed();
  });
