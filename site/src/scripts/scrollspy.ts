// Marks the link of the section in view, and stops a jump below the sticky rows. The browser tracks the section where it can; elsewhere an observer does.

const links = [
  ...document.querySelectorAll<HTMLAnchorElement>("[data-section-list] a"),
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
        "[data-section-list] a:target-current",
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

// Stops a jump below the sticky rows: the top bar where it sticks, and the section list where it is a row.
const nav = document.querySelector<HTMLElement>("[data-section-nav]");
const header = document.querySelector<HTMLElement>("header");
const row = matchMedia("(max-width: 1024px)");
const offset = () => {
  if (!nav || !row.matches) {
    document.documentElement.style.removeProperty("scroll-padding-block-start");
    return;
  }
  const bar =
    header && getComputedStyle(header).position === "sticky"
      ? header.offsetHeight
      : 0;
  const gap = Number.parseFloat(getComputedStyle(nav).paddingBlockStart);
  document.documentElement.style.setProperty(
    "scroll-padding-block-start",
    `${bar + nav.offsetHeight + gap}px`,
  );
};
if (nav) {
  new ResizeObserver(offset).observe(nav);
  row.addEventListener("change", offset);
  addEventListener("resize", offset);
  offset();
}
