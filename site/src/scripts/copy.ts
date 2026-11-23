// Copies the data-copy value of a button, and reports it in the toast, which is also the live region.

const toast = document.querySelector<HTMLElement>("[data-toast]");
let timer: ReturnType<typeof setTimeout> | undefined;
let last = "";

const report = (message: string) => {
  if (!toast) return;
  clearTimeout(timer);
  // Appends a no-break space to a message equal to the previous one, so it is announced again.
  const text = message === last ? `${message} ` : message;
  last = text;
  toast.textContent = text;
  toast.setAttribute("data-shown", "");
  timer = setTimeout(() => {
    toast.removeAttribute("data-shown");
    toast.textContent = "";
  }, 2000);
};

document.addEventListener("click", (e) => {
  const button = (e.target as Element).closest<HTMLElement>(
    "button[data-copy]",
  );
  const text = button?.dataset.copy;
  if (!text) return;
  (navigator.clipboard
    ? navigator.clipboard.writeText(text)
    : Promise.reject(new Error("no clipboard"))
  ).then(
    () => report(`Copied ${text}`),
    () => report(`Copy failed: ${text}`),
  );
});
