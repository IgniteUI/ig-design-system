// The dial buttons: each sets one dial on the element its group names, or clears it.
import { changed } from "./events.ts";

for (const button of document.querySelectorAll<HTMLButtonElement>(
  "button[data-dial]",
))
  button.addEventListener("click", () => {
    const group = button.closest<HTMLElement>("[data-dials]");
    const target = document.getElementById(group?.dataset.dials ?? "");
    const dial = button.dataset.dial;
    if (!group || !target || !dial) return;
    if (button.dataset.value)
      target.style.setProperty(dial, button.dataset.value);
    else target.style.removeProperty(dial);
    for (const b of group.querySelectorAll(`button[data-dial="${dial}"]`))
      b.setAttribute("aria-pressed", String(b === button));
    changed();
  });
