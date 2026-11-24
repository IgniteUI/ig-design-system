// The dial buttons: each sets one dial on the element its group names, or clears it. The reset button clears them all.
import { changed } from "./events.ts";

const press = (group: HTMLElement, dial: string, pressed: Element | null) => {
  for (const b of group.querySelectorAll(`button[data-dial="${dial}"]`))
    b.setAttribute("aria-pressed", String(b === pressed));
};

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
    press(group, dial, button);
    changed();
  });

for (const reset of document.querySelectorAll<HTMLButtonElement>(
  "button[data-dial-reset]",
))
  reset.addEventListener("click", () => {
    const group = reset.closest<HTMLElement>("[data-dials]");
    const target = document.getElementById(group?.dataset.dials ?? "");
    if (!group || !target) return;
    const dials = new Set(
      [...group.querySelectorAll<HTMLElement>("button[data-dial]")].map(
        (b) => b.dataset.dial ?? "",
      ),
    );
    for (const dial of dials) {
      target.style.removeProperty(dial);
      press(
        group,
        dial,
        group.querySelector(`button[data-dial="${dial}"][data-value=""]`),
      );
    }
    changed();
  });
