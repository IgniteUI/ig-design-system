// Marks the link of the section in view. The browser tracks it where it can; elsewhere an observer does.

const links = [
  ...document.querySelectorAll<HTMLAnchorElement>("[data-section-nav] a"),
];

// Brings a link into view when its list scrolls sideways, without moving the page.
const reveal = (link: HTMLElement) => {
  const list = link.closest("ul");
  if (!list || list.scrollWidth <= list.clientWidth) return;
  list.scrollTo({
    left: link.offsetLeft - (list.clientWidth - link.offsetWidth) / 2,
  });
};

const mark = (current: HTMLAnchorElement | null) => {
  for (const a of links) a.setAttribute("aria-current", String(a === current));
  if (current) reveal(current);
};

if (CSS.supports("scroll-target-group: auto")) {
  let wait: ReturnType<typeof setTimeout> | undefined;
  const settle = () =>
    mark(
      document.querySelector<HTMLAnchorElement>(
        "[data-section-nav] a:target-current",
      ),
    );
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
          if (on) reveal(a);
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
