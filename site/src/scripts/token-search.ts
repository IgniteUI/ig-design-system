// The search of the Tokens overview: a token is listed when every word typed is in its name, value, use or family.
// A ?q= in the address fills it in.

const input = document.querySelector<HTMLInputElement>("[data-token-search]");
const count = document.querySelector<HTMLElement>("[data-token-search-count]");
const items = [
  ...document.querySelectorAll<HTMLElement>("[data-token-search-results] li"),
];

if (input && count) {
  const idle = count.textContent ?? "";
  const apply = () => {
    // A pasted var(--name) is searched as the name.
    const words = input.value
      .toLowerCase()
      .replace(/var\(|\)/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    let shown = 0;
    for (const item of items) {
      const match =
        words.length > 0 &&
        words.every((w) => (item.dataset.search ?? "").includes(w));
      item.hidden = !match;
      if (match) shown++;
    }
    count.textContent = !words.length
      ? idle
      : shown
        ? `${shown} ${shown === 1 ? "token matches" : "tokens match"}.`
        : "No token matches. Try a shorter word, such as hover or inset.";
  };
  input.addEventListener("input", apply);
  // A link such as tokens/?q=space-inset-md opens the overview with that search.
  const query = new URLSearchParams(location.search).get("q");
  if (query) input.value = query;
  apply();
}
