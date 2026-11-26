// Marks the link of the section being read, and stops a jump below the sticky rows.

const links = [
  ...document.querySelectorAll<HTMLAnchorElement>("[data-section-list] a"),
];
const targets = links.map((a) => document.getElementById(a.hash.slice(1)));
const nav = document.querySelector<HTMLElement>("[data-section-nav]");
const header = document.querySelector<HTMLElement>("header");
const notice = document.querySelector<HTMLElement>("[data-dark-notice]");
const row = matchMedia("(max-width: 1024px)");
let current: HTMLAnchorElement | undefined;
// The link last clicked, until the reader scrolls by hand. At the end of the page it stays marked while its section is in view.
let clicked: HTMLAnchorElement | undefined;

// Brings a link into view when its list scrolls sideways, without moving the page.
const reveal = (link: HTMLElement) => {
  const list = link.closest("ul");
  if (!list || list.scrollWidth <= list.clientWidth) return;
  const left =
    link.getBoundingClientRect().left -
    list.getBoundingClientRect().left +
    list.scrollLeft;
  list.scrollTo({ left: left - (list.clientWidth - link.offsetWidth) / 2 });
};

// The section being read is the last one whose top, with its scroll margin, has passed the line a jump stops at, or the first one above that.
const mark = () => {
  const line =
    Number.parseFloat(
      getComputedStyle(document.documentElement).scrollPaddingBlockStart,
    ) || 0;
  const ended =
    Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight;
  let found: HTMLAnchorElement | undefined;
  links.forEach((a, i) => {
    const target = targets[i];
    if (!target || target.closest("[hidden]")) return;
    const margin =
      Number.parseFloat(getComputedStyle(target).scrollMarginBlockStart) || 0;
    if (
      !found ||
      ended ||
      target.getBoundingClientRect().top - margin <= line + 1
    )
      found = a;
  });
  const target = clicked && targets[links.indexOf(clicked)];
  if (ended && target && target.getBoundingClientRect().top < innerHeight)
    found = clicked;
  if (found === current) return;
  current = found;
  for (const a of links) {
    a.classList.toggle("current", a === found);
    a.setAttribute("aria-current", String(a === found));
  }
  if (found) reveal(found);
};

// Stops a jump below the sticky rows: the page keeps the notice and the top bar where it sticks, and a target keeps the section list where it is a row.
const offset = () => {
  const root = document.documentElement.style;
  if (!nav || !row.matches) {
    root.removeProperty("scroll-padding-block-start");
    root.removeProperty("--row-block-size");
    return;
  }
  const bar =
    header && getComputedStyle(header).position === "sticky"
      ? header.offsetHeight
      : 0;
  const gap = Number.parseFloat(getComputedStyle(nav).paddingBlockStart);
  root.setProperty(
    "scroll-padding-block-start",
    `${(notice?.offsetHeight ?? 0) + bar}px`,
  );
  root.setProperty("--row-block-size", `${nav.offsetHeight + gap}px`);
};

if (nav) {
  new ResizeObserver(() => {
    offset();
    mark();
  }).observe(nav);
  if (notice) new ResizeObserver(offset).observe(notice);
  row.addEventListener("change", offset);
  addEventListener("resize", offset);
  offset();
}
if (links.length) {
  for (const a of links)
    a.addEventListener("click", () => {
      clicked = a;
    });
  for (const type of ["wheel", "touchmove", "keydown"])
    addEventListener(
      type,
      () => {
        clicked = undefined;
      },
      { passive: true },
    );
  let queued = false;
  addEventListener(
    "scroll",
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        mark();
      });
    },
    { passive: true },
  );
  mark();
}
