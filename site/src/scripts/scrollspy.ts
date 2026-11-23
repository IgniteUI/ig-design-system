// Marks the link of the section in view. The browser tracks it where it can; elsewhere an observer does.

const links = [
  ...document.querySelectorAll<HTMLAnchorElement>("[data-section-nav] a"),
];

const mark = (current: Element | null) => {
  for (const a of links) a.setAttribute("aria-current", String(a === current));
};

if (CSS.supports("scroll-target-group: auto")) {
  let wait: ReturnType<typeof setTimeout> | undefined;
  const settle = () =>
    mark(document.querySelector("[data-section-nav] a:target-current"));
  // Reads the current link a moment after the scroll ends.
  const later = () => {
    clearTimeout(wait);
    wait = setTimeout(settle, 150);
  };
  later();
  document.addEventListener("scroll", later, { passive: true });
  document.addEventListener("scrollend", later);
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const a of links) {
          const on = a.hash === `#${entry.target.id}`;
          a.classList.toggle("target-current", on);
          a.setAttribute("aria-current", String(on));
        }
      }
    },
    { rootMargin: "-30% 0px -65% 0px", threshold: 0 },
  );
  for (const a of links) {
    const target = document.getElementById(a.hash.slice(1));
    if (target) observer.observe(target);
  }
}
