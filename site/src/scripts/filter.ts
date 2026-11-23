// The token filter: a token stays when every word typed is in its name or its note.

const input = document.querySelector<HTMLInputElement>("[data-filter]");
const matches = document.querySelector<HTMLElement>("[data-filter-matches]");
const empty = document.querySelector<HTMLElement>("[data-filter-empty]");

if (input) {
  const items = [...document.querySelectorAll<HTMLElement>("[data-token]")];
  const haystack = items.map((el) =>
    `${el.dataset.token} ${el.textContent}`.toLowerCase(),
  );

  const apply = () => {
    const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    items.forEach((el, i) => {
      const keep = words.every((w) => haystack[i].includes(w));
      el.hidden = !keep;
      if (keep) shown++;
    });
    for (const box of document.querySelectorAll<HTMLElement>(
      "[data-filter-group], main section",
    ))
      box.hidden = !box.querySelector("[data-token]:not([hidden])");
    // Opens folded groups while a filter is on.
    if (words.length)
      for (const d of document.querySelectorAll<HTMLDetailsElement>(
        "details[data-filter-group]",
      ))
        d.open = true;
    for (const a of document.querySelectorAll<HTMLAnchorElement>(
      "[data-section-nav] a",
    )) {
      const section = document.getElementById(a.hash.slice(1));
      if (a.parentElement) a.parentElement.hidden = Boolean(section?.hidden);
    }
    if (empty) empty.hidden = shown > 0;
    if (matches)
      matches.textContent = words.length
        ? shown === 1
          ? "1 match"
          : `${shown} matches`
        : "";
  };

  input.addEventListener("input", apply);
  addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
    }
    if (e.key === "Escape" && document.activeElement === input) {
      input.value = "";
      apply();
    }
  });
}
