// Copies the value of a button and reports it in the toast, which is also the live region.
// A name button holds two values: data-copy, the name ready for CSS, and data-copy-alt, the name alone.
// The "Copy as" switch picks which one a click copies; Alt with a click or with Enter copies the other.

const KEY = "igd-copy";
const toast = document.querySelector<HTMLElement>("[data-toast]");
let timer: ReturnType<typeof setTimeout> | undefined;
let last = "";

const report = (message: string) => {
  if (!toast) return;
  clearTimeout(timer);
  // Appends a no-break space to a message equal to the previous one, so it is announced again.
  const text = message === last ? `${message} ` : message;
  last = text;
  toast.textContent = text;
  toast.setAttribute("data-shown", "");
  timer = setTimeout(() => {
    toast.removeAttribute("data-shown");
    toast.textContent = "";
  }, 2500);
};

const stored = () => {
  try {
    return localStorage.getItem(KEY) === "name" ? "name" : "css";
  } catch {
    return "css";
  }
};
let format: "css" | "name" = stored();

// What a button copies: the form the switch picks, or the other one when `other` is set.
const textOf = (button: HTMLElement, other = false) => {
  const { copy, copyAlt } = button.dataset;
  if (!copyAlt) return copy;
  return (format === "name") !== other ? copyAlt : copy;
};

// Shows the choice on every switch and in the name of every name button.
const show = () => {
  for (const b of document.querySelectorAll<HTMLElement>("[data-copy-format]"))
    b.setAttribute("aria-pressed", String(b.dataset.copyFormat === format));
  for (const b of document.querySelectorAll<HTMLElement>(
    "button[data-copy-alt]",
  ))
    b.setAttribute("aria-label", `Copy ${textOf(b)}`);
};

const copy = (button: HTMLElement, other: boolean) => {
  const text = textOf(button, other);
  if (!text) return;
  // A long value, such as a code sample, is reported by its label, not printed in the toast.
  const what = button.dataset.copyLabel ?? text;
  (navigator.clipboard
    ? navigator.clipboard.writeText(text)
    : Promise.reject(new Error("no clipboard"))
  ).then(
    () => report(`Copied ${what}`),
    () =>
      report(`Could not copy ${what}. Select the text and copy it by hand.`),
  );
};

document.addEventListener("click", (e) => {
  const target = e.target as Element;
  const choice = target.closest<HTMLElement>("[data-copy-format]");
  if (choice) {
    format = choice.dataset.copyFormat === "name" ? "name" : "css";
    try {
      localStorage.setItem(KEY, format);
    } catch {}
    show();
    return;
  }
  const button = target.closest<HTMLElement>("button[data-copy]");
  if (button) copy(button, e.altKey);
});

// Alt and Enter on a focused button; the click the browser would send carries no Alt.
document.addEventListener("keydown", (e) => {
  if (!e.altKey || e.key !== "Enter") return;
  const button = (e.target as Element).closest<HTMLElement>(
    "button[data-copy]",
  );
  if (!button) return;
  e.preventDefault();
  copy(button, true);
});

show();
