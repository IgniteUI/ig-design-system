// The explorers of the guide: a pressed option outlines what uses that token in the drawing and shows its use and name.
for (const explorer of document.querySelectorAll<HTMLElement>(
  "[data-explorer]",
)) {
  const choose = (token: string) => {
    for (const b of explorer.querySelectorAll("button[data-pick]"))
      b.setAttribute(
        "aria-pressed",
        String(b.getAttribute("data-pick") === token),
      );
    for (const p of explorer.querySelectorAll<HTMLElement>("[data-part]"))
      p.toggleAttribute("data-current", p.dataset.part === token);
    for (const i of explorer.querySelectorAll<HTMLElement>("[data-info]"))
      i.hidden = i.dataset.info !== token;
    const lift = explorer.querySelector<HTMLElement>("[data-lift]");
    if (lift) lift.style.boxShadow = `var(--igd-${token})`;
  };
  for (const b of explorer.querySelectorAll<HTMLButtonElement>(
    "button[data-pick]",
  ))
    b.addEventListener("click", () => choose(b.dataset.pick ?? ""));
}
