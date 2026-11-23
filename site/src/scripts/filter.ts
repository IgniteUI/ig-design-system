// The token filter: a token stays when every word typed is in its name, its value or its note.
import { READ } from "./events.ts";

const input = document.querySelector<HTMLInputElement>("[data-filter]");
const matches = document.querySelector<HTMLElement>("[data-filter-matches]");
const empty = document.querySelector<HTMLElement>("[data-filter-empty]");

if (input) {
  const items = [...document.querySelectorAll<HTMLElement>("[data-token]")];
  const folds = [
    ...document.querySelectorAll<HTMLDetailsElement>(
      "details[data-filter-group], [data-token] details",
    ),
  ];
  // The folds the reader opened, kept while a filter opens the others.
  let opened: Set<HTMLDetailsElement> | undefined;
  const text = (el: Element | null) => (el?.textContent ?? "").toLowerCase();

  const apply = () => {
    // A pasted var(--name) is searched as the name.
    const words = input.value
      .toLowerCase()
      .replace(/var\(|\)/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    const on = words.length > 0;
    if (on && !opened) opened = new Set(folds.filter((d) => d.open));
    let shown = 0;
    for (const el of items) {
      // Read on every pass, because the readouts write the values after the page loads.
      const tip = el.querySelector<HTMLElement>("[title]")?.title ?? "";
      const all = `${el.dataset.token} ${text(el)} ${tip}`.toLowerCase();
      const keep = words.every((w) => all.includes(w));
      el.hidden = !keep;
      if (!keep) continue;
      shown++;
      // Opens the rest of a note when a word is found only there.
      for (const rest of el.querySelectorAll<HTMLDetailsElement>("details"))
        rest.open = on
          ? words.some((w) => text(rest).includes(w))
          : Boolean(opened?.has(rest));
    }
    for (const box of document.querySelectorAll<HTMLElement>(
      "[data-filter-group], main section",
    )) {
      const left = box.querySelectorAll("[data-token]:not([hidden])").length;
      box.hidden = left === 0;
      if (box instanceof HTMLDetailsElement)
        box.open = on || Boolean(opened?.has(box));
    }
    if (!on) opened = undefined;
    // What is not a token steps aside while a filter is on, so the matches come first.
    for (const rest of document.querySelectorAll<HTMLElement>(
      "[data-filter-rest], [data-filter-scope] > :not([data-filter-group], h1)",
    ))
      rest.hidden = on;
    // Counts the tokens left in each section, in its heading and in its link.
    for (const count of document.querySelectorAll<HTMLElement>(
      "[data-count]",
    )) {
      const link = count.closest<HTMLAnchorElement>("a");
      const section = link
        ? document.getElementById(link.hash.slice(1))
        : count.closest("section");
      const number = count.firstChild;
      if (!section || !number) continue;
      number.textContent = on
        ? String(section.querySelectorAll("[data-token]:not([hidden])").length)
        : (count.dataset.count ?? "");
    }
    for (const a of document.querySelectorAll<HTMLAnchorElement>(
      "[data-section-list] a",
    )) {
      const target = document.getElementById(a.hash.slice(1));
      const box = target?.closest<HTMLElement>("[data-filter-group], section");
      if (a.parentElement)
        a.parentElement.hidden = Boolean(target?.hidden || box?.hidden);
    }
    if (empty) empty.hidden = shown > 0;
    if (matches)
      matches.textContent = on
        ? shown === 1
          ? "1 match"
          : `${shown} matches`
        : "";
  };

  // Keeps the filter in the address, so a result can be shared.
  const store = () => {
    const url = new URL(location.href);
    if (input.value) url.searchParams.set("q", input.value);
    else url.searchParams.delete("q");
    history.replaceState(null, "", url);
  };

  input.addEventListener("input", () => {
    apply();
    store();
    // Shows the first match when the reader filters from further down the page.
    const top = document.getElementById("content");
    if (top && top.getBoundingClientRect().top < 0)
      top.scrollIntoView({ behavior: "instant" });
  });
  addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
    }
    if (e.key === "Escape" && input.value) {
      input.value = "";
      apply();
      store();
    }
  });

  // Values are written after the page loads and again on a theme or type set change, so a filter is applied again then.
  document.addEventListener(READ, () => {
    if (input.value) apply();
  });

  const asked = new URL(location.href).searchParams.get("q");
  if (asked) {
    input.value = asked;
    apply();
  }
}
