// Galería: filtros por categoría + lightbox (sin librerías externas)
(function () {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;

  const items = Array.from(grid.querySelectorAll(".gallery-item"));
  const filters = Array.from(document.querySelectorAll(".gallery-filter"));

  // ---------- Filtros ----------
  function applyFilter(cat) {
    filters.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === cat)));
    items.forEach((it) => {
      it.hidden = !(cat === "all" || it.dataset.cat === cat);
    });
    try { history.replaceState(null, "", cat === "all" ? location.pathname + location.search : "#" + cat); } catch (_) {}
  }

  filters.forEach((b) => b.addEventListener("click", () => applyFilter(b.dataset.filter)));

  const initial = location.hash.slice(1);
  if (filters.some((b) => b.dataset.filter === initial)) applyFilter(initial);

  // ---------- Lightbox ----------
  const lb = document.getElementById("lightbox");
  const img = document.getElementById("lbImg");
  const stage = document.getElementById("lbStage");
  const counter = document.getElementById("lbCounter");
  const tag = document.getElementById("lbTag");
  const title = document.getElementById("lbTitle");
  const btnClose = document.getElementById("lbClose");
  const btnPrev = document.getElementById("lbPrev");
  const btnNext = document.getElementById("lbNext");

  let list = [];
  let index = 0;
  let lastFocus = null;

  const visibleItems = () => items.filter((it) => !it.hidden);

  function show(i) {
    index = (i + list.length) % list.length;
    const it = list[index];
    const link = it.querySelector("a");
    const thumb = it.querySelector("img");

    img.classList.add("loading");
    img.alt = thumb.alt;
    // Muestra el thumb al tiro y lo reemplaza cuando carga la versión grande
    img.src = thumb.currentSrc || thumb.src;
    const full = new Image();
    full.onload = () => {
      if (list[index] === it) { img.src = full.src; img.classList.remove("loading"); }
    };
    full.src = link.href;

    counter.textContent = `${index + 1} / ${list.length}`;
    tag.textContent = it.querySelector(".cap-tag")?.textContent || "";
    title.textContent = it.querySelector(".cap-title")?.textContent || "";

    // Precarga la siguiente
    const next = list[(index + 1) % list.length];
    if (next) new Image().src = next.querySelector("a").href;

    const single = list.length < 2;
    btnPrev.hidden = single;
    btnNext.hidden = single;
  }

  function open(it) {
    list = visibleItems();
    lastFocus = document.activeElement;
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add("open"));
    document.body.classList.add("lb-lock");
    show(list.indexOf(it));
    btnClose.focus();
  }

  function close() {
    lb.classList.remove("open");
    document.body.classList.remove("lb-lock");
    setTimeout(() => { lb.hidden = true; img.src = ""; }, 250);
    lastFocus?.focus();
  }

  grid.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-lightbox]");
    if (!link) return;
    e.preventDefault();
    open(link.closest(".gallery-item"));
  });

  btnClose.addEventListener("click", close);
  btnPrev.addEventListener("click", () => show(index - 1));
  btnNext.addEventListener("click", () => show(index + 1));

  // Cerrar al hacer clic fuera de la foto
  lb.addEventListener("click", (e) => {
    if (e.target === lb || e.target === stage) close();
  });

  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(index - 1);
    else if (e.key === "ArrowRight") show(index + 1);
    else if (e.key === "Tab") {
      // Mantiene el foco dentro del visor
      const f = [btnClose, btnPrev, btnNext].filter((b) => !b.hidden);
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });

  // Swipe en celular
  let x0 = null;
  stage.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();
