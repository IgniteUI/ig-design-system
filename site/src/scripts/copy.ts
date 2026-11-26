// Copies the value of a button and reports it in the toast, which is also the live region.
// A button copies its data-copy, which is the text it shows.

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

const copy = (button: HTMLElement) => {
  const text = button.dataset.copy;
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
  const button = (e.target as Element).closest<HTMLElement>(
    "button[data-copy]",
  );
  if (button) copy(button);
});
