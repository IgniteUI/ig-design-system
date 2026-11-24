// The type set buttons: each switches the element it names to its set, or back to the default.
import { changed } from "./events.ts";

const buttons = document.querySelectorAll<HTMLButtonElement>(
  "button[data-type-set]",
);

for (const button of buttons)
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.typeSetTarget ?? "");
    const set = button.dataset.typeSet ?? "";
    if (!target) return;
    if (target.getAttribute("data-igd-type") === set)
      target.removeAttribute("data-igd-type");
    else target.setAttribute("data-igd-type", set);
    for (const b of buttons)
      if (b.dataset.typeSetTarget === button.dataset.typeSetTarget)
        b.setAttribute(
          "aria-pressed",
          String(target.getAttribute("data-igd-type") === b.dataset.typeSet),
        );
    changed();
  });
