(function () {
  var root = document.documentElement;
  var probe = document.createElement("canvas").getContext("2d");
  function hex(color) {
    probe.clearRect(0, 0, 1, 1); probe.fillStyle = color; probe.fillRect(0, 0, 1, 1);
    var d = probe.getImageData(0, 0, 1, 1).data;
    return "#" + [d[0], d[1], d[2]].map(function (v) { return v.toString(16).padStart(2, "0"); }).join("") + (d[3] < 255 ? " at " + Math.round(d[3] / 2.55) + "%" : "");
  }
  // Writes the rendered value of each token next to its name.
  function read() {
    var el = document.createElement("i"); el.style.position = "absolute"; document.body.appendChild(el);
    document.querySelectorAll("output[data-color]").forEach(function (o) { el.style.backgroundColor = "var(" + o.dataset.color + ")"; o.textContent = hex(getComputedStyle(el).backgroundColor); });
    document.querySelectorAll("output[data-length]").forEach(function (o) { el.style.inlineSize = "var(" + o.dataset.length + ")"; o.textContent = Math.round(parseFloat(getComputedStyle(el).inlineSize) * 100) / 100 + "px"; });
    el.remove();
    document.querySelectorAll("output[data-type]").forEach(function (o) {
      var s = getComputedStyle(document.querySelector(".sample." + o.dataset.type));
      o.textContent = Math.round(parseFloat(s.fontSize) * 10) / 10 + "px / " + Math.round(parseFloat(s.lineHeight) * 10) / 10 + "px, " + s.fontWeight;
    });
  }

  // theme and type set
  var theme = document.getElementById("theme");
  function sync() { theme.setAttribute("aria-pressed", String(root.getAttribute("data-theme") === "dark")); read(); }
  theme.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    // Stores the theme only while it differs from the system's.
    try {
      if ((next === "dark") === matchMedia("(prefers-color-scheme: dark)").matches) localStorage.removeItem("igd-showcase-theme");
      else localStorage.setItem("igd-showcase-theme", next);
    } catch (e) {}
    sync();
  });
  document.querySelectorAll("button[data-set]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (root.getAttribute("data-igd-type") === b.dataset.set) root.removeAttribute("data-igd-type"); else root.setAttribute("data-igd-type", b.dataset.set);
      document.querySelectorAll("button[data-set]").forEach(function (x) { x.setAttribute("aria-pressed", String(root.getAttribute("data-igd-type") === x.dataset.set)); });
      read();
    });
  });

  // filter: a token stays when every word is in its name or its note
  var filter = document.getElementById("filter"), matches = document.getElementById("matches"), empty = document.getElementById("empty");
  var items = [].slice.call(document.querySelectorAll("[data-token]"));
  var haystack = items.map(function (el) { return (el.dataset.token + " " + el.textContent).toLowerCase(); });
  function apply() {
    var words = filter.value.toLowerCase().split(/\s+/).filter(Boolean), shown = 0;
    items.forEach(function (el, i) { var keep = words.every(function (w) { return haystack[i].indexOf(w) > -1; }); el.hidden = !keep; if (keep) shown++; });
    document.querySelectorAll(".group, main > section").forEach(function (box) { box.hidden = !box.querySelector("[data-token]:not([hidden])"); });
    // Opens folded groups while a filter is on.
    document.querySelectorAll("details.fold").forEach(function (d) { if (words.length) d.open = true; });
    document.querySelectorAll(".sections a").forEach(function (a) { a.parentElement.hidden = document.querySelector(a.getAttribute("href")).hidden; });
    empty.hidden = shown > 0;
    matches.textContent = words.length ? (shown === 1 ? "1 match" : shown + " matches") : "";
  }
  filter.addEventListener("input", apply);
  addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== filter) { e.preventDefault(); filter.focus(); }
    if (e.key === "Escape" && document.activeElement === filter) { filter.value = ""; apply(); }
  });

  // copy: one status element is the visible message and the live region
  var toast = document.getElementById("toast"), timer, last = "";
  function report(message) {
    clearTimeout(timer);
    // Appends a no-break space to a message equal to the previous one.
    if (message === last) message += "\u00A0";
    last = message;
    toast.textContent = message; toast.setAttribute("data-shown", "");
    timer = setTimeout(function () { toast.removeAttribute("data-shown"); toast.textContent = ""; }, 2000);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-copy]"); if (!b) return;
    var text = b.dataset.copy;
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(
      function () { report("Copied " + text); },
      function () { report("Copy failed: " + text); }
    );
  });

  // current section: the browser tracks it where it can; elsewhere an observer does
  var links = [].slice.call(document.querySelectorAll(".sections a"));
  function mark(current) { links.forEach(function (a) { a.setAttribute("aria-current", String(a === current)); }); }
  if (CSS.supports("scroll-target-group: auto")) {
    var settle = function () { mark(document.querySelector(".sections a:target-current")); };
    // Reads the current-section link a frame after the scroll ends.
    var wait, later = function () { clearTimeout(wait); wait = setTimeout(settle, 150); };
    later(); document.addEventListener("scroll", later, { passive: true }); document.addEventListener("scrollend", later);
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { var on = a.getAttribute("href") === "#" + entry.target.id; a.classList.toggle("target-current", on); a.setAttribute("aria-current", String(on)); });
      });
    }, { rootMargin: "-30% 0px -65% 0px", threshold: 0 });
    document.querySelectorAll("main > section").forEach(function (s) { observer.observe(s); });
  }

  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
    var stored = null;
    try { stored = localStorage.getItem("igd-showcase-theme"); } catch (_) {}
    if (stored) return;
    root.setAttribute("data-theme", e.matches ? "dark" : "light");
    sync();
  });
  addEventListener("resize", read);
  addEventListener("storage", function (e) {
    if (e.key !== "igd-showcase-theme") return;
    root.setAttribute("data-theme", (e.newValue ? e.newValue === "dark" : matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light");
    sync();
  });
  document.fonts.ready.then(sync);
})();
