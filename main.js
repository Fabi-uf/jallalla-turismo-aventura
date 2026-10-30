/* =========================================================
   Jallalla Turismo Aventura — script común a todas las páginas
   - Idioma (ES/EN), menú móvil, enlaces de WhatsApp/redes,
     precios, banner de cookies, mapa y formulario de contacto.
   Los datos se editan en js/config.js y los textos en js/i18n.js
   ========================================================= */
(function () {
  const CFG = window.JL_CONFIG || {};
  const DICT = window.JL_I18N || { es: {}, en: {} };
  const LANGS = ["es", "en"];
  const page = document.documentElement.dataset.page || "index";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------- Idioma ----------
  function detectLang() {
    const fromUrl = new URLSearchParams(location.search).get("lang");
    if (LANGS.includes(fromUrl)) return fromUrl;
    try {
      const saved = localStorage.getItem("jl_lang");
      if (LANGS.includes(saved)) return saved;
    } catch (_) {}
    return (navigator.language || "es").toLowerCase().startsWith("es") ? "es" : "en";
  }

  let lang = detectLang();

  function t(key, vars) {
    let s = (DICT[lang] && DICT[lang][key]) ?? (DICT.es && DICT.es[key]) ?? key;
    if (vars) Object.keys(vars).forEach((k) => { s = s.split("{" + k + "}").join(vars[k]); });
    return s.replace("{y}", new Date().getFullYear());
  }

  function applyLang() {
    document.documentElement.lang = lang;
    const title = DICT[lang] && DICT[lang][page + ".metaTitle"];
    if (title) document.title = title;

    $$("[data-t]").forEach((el) => { el.textContent = t(el.dataset.t); });
    $$("[data-t-alt]").forEach((el) => { el.alt = t(el.dataset.tAlt); });
    $$("[data-t-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.tAria)); });
    $$("[data-t-ph]").forEach((el) => { el.placeholder = t(el.dataset.tPh); });
    $$("[data-t-title]").forEach((el) => { el.title = t(el.dataset.tTitle); });
    // Textos que vienen con su traducción en el mismo HTML (ej: galería)
    const L = lang === "en" ? "En" : "Es";
    $$("[data-es]").forEach((el) => { el.textContent = el.dataset[lang] || el.dataset.es; });
    $$("[data-alt-es]").forEach((el) => { el.alt = el.dataset["alt" + L] || el.dataset.altEs; });

    const sel = $("#language");
    if (sel) sel.value = lang;

    applyPrices();
    applyWhatsapp();

    window.jlLang = lang;
    document.dispatchEvent(new CustomEvent("jl:lang", { detail: lang }));
  }

  window.jlT = t;
  window.jlLang = lang;

  // ---------- Precios ----------
  function applyPrices() {
    const fmt = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
    $$("[data-price]").forEach((el) => {
      const value = (CFG.prices || {})[el.dataset.price];
      el.textContent = value ? t("price.from", { p: fmt.format(value) }) : t("price.ask");
    });
  }

  // ---------- WhatsApp y redes ----------
  const waUrl = (text) => `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(text)}`;

  function applyWhatsapp() {
    $$("[data-wa]").forEach((a) => {
      const act = a.dataset.wa;
      const text = act ? t("wa.msgActivity", { a: t("act." + act + ".title") }) : t("wa.msgGeneral");
      a.href = waUrl(text);
      a.target = "_blank";
      a.rel = "noopener";
    });
  }

  function applyLinks() {
    const links = {
      facebook: CFG.facebook,
      messenger: CFG.messenger,
      instagram: CFG.instagram,
      instagramDM: CFG.instagramDM,
      tiktok: CFG.tiktok,
      email: CFG.email ? "mailto:" + CFG.email : "",
      phone: CFG.phoneDisplay ? "tel:+" + CFG.whatsapp : "",
      maps: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(CFG.mapsQuery || "Iquique, Chile"),
    };
    $$("[data-link]").forEach((a) => {
      const url = links[a.dataset.link];
      if (!url) { (a.closest("[data-link-wrap]") || a).hidden = true; return; }
      a.href = url;
      if (/^https?:/.test(url)) { a.target = "_blank"; a.rel = "noopener"; }
    });
    $$("[data-config]").forEach((el) => { el.textContent = CFG[el.dataset.config] || ""; });
  }

  // ---------- Menú móvil ----------
  function initMenu() {
    const btn = $("#menuToggle");
    const nav = $("#navLinks");
    if (!btn || !nav) return;
    const set = (open) => {
      nav.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.querySelector("i").className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
    };
    btn.addEventListener("click", () => set(!nav.classList.contains("open")));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
    document.addEventListener("click", (e) => {
      if (nav.classList.contains("open") && !nav.contains(e.target) && !btn.contains(e.target)) set(false);
    });
  }

  // ---------- Cookies / consentimiento ----------
  const CONSENT_KEY = "jl_consent"; // "all" | "necessary"
  const getConsent = () => { try { return localStorage.getItem(CONSENT_KEY); } catch (_) { return null; } };

  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (_) {}
    $("#cookieBanner")?.remove();
    applyConsent();
    document.dispatchEvent(new CustomEvent("jl:consent", { detail: value }));
  }
  window.jlConsent = getConsent;

  function showCookieBanner() {
    if ($("#cookieBanner")) return;
    const box = document.createElement("div");
    box.className = "cookie-banner";
    box.id = "cookieBanner";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-live", "polite");
    box.setAttribute("aria-labelledby", "cookieTitle");
    box.innerHTML = `
      <h2 id="cookieTitle"><i class="fa-solid fa-cookie-bite" aria-hidden="true"></i> <span data-t="cookies.title"></span></h2>
      <p><span data-t="cookies.text"></span> <a href="privacidad.html" data-t="cookies.more"></a></p>
      <div class="cookie-actions">
        <button type="button" class="btn btn-dark" data-consent="all" data-t="cookies.accept"></button>
        <button type="button" class="btn btn-light" data-consent="necessary" data-t="cookies.reject"></button>
      </div>`;
    document.body.appendChild(box);
    $$("[data-t]", box).forEach((el) => { el.textContent = t(el.dataset.t); });
    $$("[data-consent]", box).forEach((b) => b.addEventListener("click", () => setConsent(b.dataset.consent)));
  }

  // Mapas de Google: solo se cargan con consentimiento
  function applyConsent() {
    const ok = getConsent() === "all";
    $$("[data-map]").forEach((box) => {
      if (ok && !box.querySelector("iframe")) {
        const q = encodeURIComponent(CFG.mapsQuery || "Iquique, Chile");
        box.innerHTML = `<iframe src="https://www.google.com/maps?q=${q}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Google Maps"></iframe>`;
      }
    });
  }

  function initConsent() {
    $$("[data-map]").forEach((box) => {
      box.innerHTML = `
        <div class="map-placeholder">
          <i class="fa-solid fa-map-location-dot" aria-hidden="true"></i>
          <p data-t="map.blocked">${t("map.blocked")}</p>
          <button type="button" class="btn btn-dark" data-t="map.load">${t("map.load")}</button>
        </div>`;
      box.querySelector("button").addEventListener("click", () => setConsent("all"));
    });
    $$("[data-cookie-prefs]").forEach((b) => b.addEventListener("click", showCookieBanner));
    if (!getConsent()) showCookieBanner();
    applyConsent();
  }

  // ---------- Formulario de contacto → WhatsApp ----------
  function initContactForm() {
    const form = $("#waForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const err = $("#waFormError");
      if (!name) { err.hidden = false; form.name.focus(); return; }
      err.hidden = true;

      const act = form.activity.value;
      const date = form.date.value;
      const people = form.people.value;
      const msg = form.message.value.trim();

      const lines = [t("contact.waHello", { n: name })];
      if (act) lines.push(t("contact.waAct", { a: act === "otra" ? t("contact.fOther") : t("act." + act + ".title") }));
      if (date) {
        const d = new Date(date + "T12:00:00");
        lines.push(t("contact.waDate", { d: d.toLocaleDateString(lang === "es" ? "es-CL" : "en-US", { day: "numeric", month: "long", year: "numeric" }) }));
      }
      if (people) lines.push(t("contact.waPeople", { p: people }));
      if (msg) lines.push("", msg);

      window.open(waUrl(lines.join("\n")), "_blank", "noopener");
    });

    const dateInput = form.date;
    if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);
  }

  // ---------- Contadores (Nosotros) ----------
  function initCounters() {
    const nums = $$("[data-count]");
    if (!nums.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || "";
        const start = performance.now();
        const step = (now) => {
          const p = Math.min((now - start) / 900, 1);
          el.textContent = Math.floor(target * p).toLocaleString("es-CL") + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    nums.forEach((n) => io.observe(n));
  }

  // ---------- Botón flotante de WhatsApp ----------
  function initFloat() {
    if (page === "404") return;
    const a = document.createElement("a");
    a.className = "wa-float";
    a.dataset.wa = "";
    a.dataset.tAria = "wa.float";
    a.innerHTML = '<i class="fa-brands fa-whatsapp" aria-hidden="true"></i>';
    document.body.appendChild(a);
  }

  // ---------- Inicio ----------
  function init() {
    initFloat();
    applyLinks();
    initMenu();
    initContactForm();
    initCounters();

    $("#language")?.addEventListener("change", (e) => {
      lang = LANGS.includes(e.target.value) ? e.target.value : "es";
      try { localStorage.setItem("jl_lang", lang); } catch (_) {}
      applyLang();
    });

    applyLang();
    initConsent();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
