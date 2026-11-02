// Reseñas de Jallalla: lectura (Google Sheets vía Apps Script) + formulario
(function () {
  // La URL del Apps Script se configura en js/config.js (reviewsApi)
  const API = window.JL_REVIEWS_API || (window.JL_CONFIG || {}).reviewsApi || "";
  const PAGE_SIZE = 6;
  const CACHE_KEY = "jl_reviews_cache_v1";
  const CACHE_MS = 5 * 60 * 1000;
  const SOURCES = { facebook: "fa-facebook-f", instagram: "fa-instagram", tiktok: "fa-tiktok", whatsapp: "fa-whatsapp", google: "fa-google" };
  const SOURCE_NAMES = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", whatsapp: "WhatsApp", google: "Google" };
  let GOOGLE = null; // { rating, total, url } desde el Apps Script

  // Todas las claves de reseñas están en js/i18n.js con el prefijo "rv."
  const t = (k, vars) => (window.jlT ? window.jlT("rv." + k, vars) : k);
  const lang = () => window.jlLang || document.documentElement.lang || "es";
  const $ = (id) => document.getElementById(id);

  // Crea elementos de forma segura (sin innerHTML con texto del usuario)
  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else n.setAttribute(k, v);
    });
    (children || []).forEach((c) => c && n.appendChild(c));
    return n;
  }
  const icon = (cls) => el("i", { class: cls, "aria-hidden": "true" });

  function stars(rating, extraClass) {
    const wrap = el("span", { class: "rv-stars " + (extraClass || ""), role: "img", "aria-label": t("starsAria", { n: rating }) });
    for (let i = 1; i <= 5; i++) {
      const full = rating >= i;
      const half = !full && rating >= i - 0.5;
      wrap.appendChild(icon("fa-solid " + (full ? "fa-star" : half ? "fa-star-half-stroke" : "fa-star is-empty")));
    }
    return wrap;
  }

  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
  }
  function hue(name) {
    let h = 0;
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
    return h;
  }
  function fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    try { return new Intl.DateTimeFormat(lang(), { month: "long", year: "numeric" }).format(d); }
    catch (_) { return d.toLocaleDateString(); }
  }

  // ---------- Carga de datos ----------
  // Reseñas cargadas a mano (panel o data/resenas.json): se muestran siempre
  let STATIC = [];
  async function loadStatic() {
    try {
      const res = await fetch("data/resenas.json", { cache: "no-cache" });
      const data = res.ok ? await res.json() : {};
      STATIC = (data.resenas || [])
        .filter((r) => r && r.nombre && r.texto)
        .map((r) => ({
          name: String(r.nombre),
          rating: Math.max(1, Math.min(5, parseInt(r.estrellas, 10) || 5)),
          activity: r.actividad || "otra",
          date: r.fecha || "",
          text: String(r.texto),
          source: r.fuente || "web",
          reply: r.respuesta || "",
        }));
    } catch (_) { STATIC = []; }
  }

  async function fetchReviews() {
    await loadStatic();
    if (!API) return sortByDate(STATIC);
    try {
      const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (c && Date.now() - c.at < CACHE_MS) { GOOGLE = c.google || null; return merge(c.reviews); }
    } catch (_) {}
    const res = await fetch(API, { method: "GET" });
    const data = await res.json();
    if (!data.ok) throw new Error("api");
    const reviews = Array.isArray(data.reviews) ? data.reviews : [];
    GOOGLE = data.google && data.google.rating ? data.google : null;
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), reviews, google: GOOGLE })); } catch (_) {}
    return merge(reviews);
  }

  // Une las de la planilla con las cargadas a mano, sin repetir (mismo nombre y texto)
  function merge(fromSheet) {
    const key = (r) => (String(r.name) + "|" + String(r.text)).toLowerCase().replace(/\s+/g, " ").trim();
    const seen = new Set(fromSheet.map(key));
    return sortByDate(fromSheet.concat(STATIC.filter((r) => !seen.has(key(r)))));
  }
  const sortByDate = (list) => list.slice().sort((a, b) => (String(a.date) < String(b.date) ? 1 : -1));

  // ---------- Tarjeta ----------
  function card(r, opts) {
    const name = String(r.name || "Viajero");
    const text = String(r.text || "");
    const long = !opts?.compact && text.length > 260;

    const p = el("p", { class: "rv-text" + (long ? " is-clamped" : ""), text });
    const parts = [
      el("div", { class: "rv-card-head" }, [
        el("span", { class: "rv-avatar", style: `--h:${hue(name)}`, "aria-hidden": "true", text: initials(name) }),
        el("div", { class: "rv-who" }, [
          r.authorUrl && /^https:\/\//.test(r.authorUrl)
            ? el("a", { class: "rv-author-link", href: r.authorUrl, target: "_blank", rel: "noopener nofollow" }, [el("strong", { text: name })])
            : el("strong", { text: name }),
          el("span", { class: "rv-date", text: fmtDate(r.date) }),
        ]),
        SOURCES[r.source]
          ? el("span", { class: "rv-source", title: t("via") + " " + SOURCE_NAMES[r.source] }, [icon("fa-brands " + SOURCES[r.source])])
          : null,
      ]),
      el("div", { class: "rv-card-meta" }, [
        stars(r.rating),
        r.activity ? el("span", { class: "rv-tag", text: t("act_" + r.activity) }) : null,
      ]),
      p,
    ];

    if (long) {
      const btn = el("button", { type: "button", class: "rv-readmore", text: t("readMore") });
      btn.addEventListener("click", () => {
        const open = p.classList.toggle("is-clamped");
        btn.textContent = open ? t("readMore") : t("readLess");
      });
      parts.push(btn);
    }

    if (r.source === "google" && GOOGLE && GOOGLE.url && /^https:\/\//.test(GOOGLE.url)) {
      parts.push(el("a", { class: "rv-google-link", href: GOOGLE.url, target: "_blank", rel: "noopener" }, [
        icon("fa-brands fa-google"), document.createTextNode(" " + t("seeOnGoogle")),
      ]));
    }

    if (r.reply && !opts?.compact) {
      parts.push(el("div", { class: "rv-reply" }, [
        el("strong", {}, [icon("fa-solid fa-reply"), document.createTextNode(" " + t("reply"))]),
        el("p", { text: r.reply }),
      ]));
    }

    return el("article", { class: "rv-card" + (opts?.compact ? " rv-card-compact" : "") }, parts);
  }

  // ---------- Página de reseñas ----------
  function initReviewsPage() {
    const list = $("rvList");
    if (!list) return;

    let all = [];
    let state = "loading"; // loading | ready | error
    let filter = "all";
    let sort = "recent";
    let shown = PAGE_SIZE;

    function renderSummary() {
      const n = all.length;
      const avg = n ? all.reduce((s, r) => s + Number(r.rating || 0), 0) / n : 0;
      $("rvAvg").textContent = n ? avg.toFixed(1).replace(".", lang() === "en" ? "." : ",") : "–";
      $("rvAvgStars").replaceChildren(stars(Math.round(avg * 2) / 2, "rv-stars-lg"));
      $("rvCount").textContent = n === 0 ? t("sumNone") : n === 1 ? t("sumOne") : t("sumBased", { n });

      // Nota de Google (si el Apps Script la entrega)
      let g = $("rvGoogleSum");
      if (!g) {
        g = el("a", { id: "rvGoogleSum", class: "rv-google-sum", target: "_blank", rel: "noopener" });
        $("rvCount").after(g);
      }
      if (GOOGLE && GOOGLE.rating) {
        g.hidden = false;
        if (/^https:\/\//.test(GOOGLE.url || "")) g.href = GOOGLE.url;
        g.replaceChildren(icon("fa-brands fa-google"), document.createTextNode(" " + t("googleSummary", {
          r: Number(GOOGLE.rating).toFixed(1).replace(".", lang() === "en" ? "." : ","),
          n: GOOGLE.total,
        })));
      } else {
        g.hidden = true;
      }

      const bars = $("rvBars");
      bars.replaceChildren();
      for (let s = 5; s >= 1; s--) {
        const c = all.filter((r) => Number(r.rating) === s).length;
        const pct = n ? Math.round((c / n) * 100) : 0;
        bars.appendChild(el("div", { class: "rv-bar" }, [
          el("span", { class: "rv-bar-label" }, [document.createTextNode(String(s)), icon("fa-solid fa-star")]),
          el("span", { class: "rv-bar-track" }, [el("span", { class: "rv-bar-fill", style: `width:${pct}%` })]),
          el("span", { class: "rv-bar-count", text: String(c) }),
        ]));
      }
    }

    function renderList() {
      list.replaceChildren();
      $("rvMore").hidden = true;

      if (state === "loading") return list.appendChild(el("p", { class: "rv-state", text: t("loading") }));
      if (state === "error") return list.appendChild(el("p", { class: "rv-state", text: t("loadError") }));

      let rows = all.filter((r) => filter === "all" || r.activity === filter);
      rows = rows.slice().sort((a, b) =>
        sort === "best" ? b.rating - a.rating || (a.date < b.date ? 1 : -1) : a.date < b.date ? 1 : -1
      );

      if (!rows.length) {
        const empty = el("div", { class: "rv-empty" }, [
          icon("fa-regular fa-comments"),
          el("p", { text: all.length ? t("emptyFilter") : t("empty") }),
        ]);
        if (!all.length) empty.appendChild(el("a", { href: "#escribir", class: "rv-btn rv-btn-primary", text: t("writeBtn") }));
        return list.appendChild(empty);
      }

      rows.slice(0, shown).forEach((r) => list.appendChild(card(r)));
      $("rvMore").hidden = rows.length <= shown;
    }

    function renderAll() { renderSummary(); renderList(); }

    // Filtros y orden
    document.querySelectorAll("#rvFilters .gallery-filter").forEach((b) =>
      b.addEventListener("click", () => {
        filter = b.dataset.filter;
        shown = PAGE_SIZE;
        document.querySelectorAll("#rvFilters .gallery-filter").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        renderList();
      })
    );
    $("rvSort").addEventListener("change", (e) => { sort = e.target.value; renderList(); });
    $("rvMore").addEventListener("click", () => { shown += PAGE_SIZE; renderList(); });

    document.addEventListener("jl:lang", renderAll);

    fetchReviews()
      .then((r) => { all = r; state = "ready"; })
      .catch(() => { state = "error"; })
      .finally(renderAll);

    initForm();
  }

  // ---------- Formulario ----------
  function initForm() {
    const form = $("rvForm");
    if (!form) return;

    const startedAt = Date.now();
    const msg = $("rvMsg");
    const text = $("rvText");
    const rateLabel = $("rvRateLabel");

    const showMsg = (key) => { msg.textContent = t(key); msg.hidden = false; };
    const updateRateLabel = () => {
      const r = form.querySelector("input[name=rating]:checked");
      rateLabel.textContent = r ? t("rate" + r.value) : "";
    };

    text.addEventListener("input", () => { $("rvChars").textContent = `${text.value.length}/800`; });
    form.querySelectorAll("input[name=rating]").forEach((r) => r.addEventListener("change", updateRateLabel));
    document.addEventListener("jl:lang", updateRateLabel);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.hidden = true;

      const rating = form.querySelector("input[name=rating]:checked");
      const payload = {
        name: $("rvName").value.trim(),
        activity: $("rvActivity").value || "otra",
        rating: rating ? Number(rating.value) : 0,
        text: text.value.trim(),
        lang: lang(),
        consent: $("rvConsent").checked,
        website: $("rvWebsite").value,
        elapsed: Date.now() - startedAt,
      };

      if (payload.name.length < 2 || !payload.rating || payload.text.length < 15) return showMsg("errRequired");
      if (/https?:\/\/|www\./i.test(payload.text)) return showMsg("errLinks");
      if (!payload.consent) return showMsg("errConsent");
      // Sin planilla conectada: la reseña se envía por WhatsApp al negocio
      if (!API) {
        const cfg = (await window.JL_READY) || window.JL_CONFIG || {};
        const msg = [
          t("waIntro"),
          "★".repeat(payload.rating) + " (" + payload.rating + "/5)",
          t("act_" + payload.activity) + " · " + payload.name,
          "",
          payload.text,
        ].join("\n");
        window.open(`https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
        form.reset();
        $("rvChars").textContent = "0/800";
        updateRateLabel();
        form.hidden = true;
        $("rvSuccess").hidden = false;
        return;
      }

      const btn = $("rvSubmit");
      btn.disabled = true;
      $("rvSubmitText").textContent = t("fSending");

      try {
        // text/plain evita el "preflight" CORS, así funciona directo con Apps Script
        const res = await fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!data.ok) {
          const map = { rate_limited: "errRate", links: "errLinks", too_fast: "errFast", invalid: "errRequired" };
          showMsg(map[data.error] || "errGeneric");
        } else {
          form.reset();
          $("rvChars").textContent = "0/800";
          updateRateLabel();
          form.hidden = true;
          $("rvSuccess").hidden = false;
          try { sessionStorage.removeItem(CACHE_KEY); } catch (_) {}
        }
      } catch (_) {
        showMsg("errGeneric");
      } finally {
        btn.disabled = false;
        $("rvSubmitText").textContent = t("fSend");
      }
    });

    $("rvAnother").addEventListener("click", () => {
      $("rvSuccess").hidden = true;
      form.hidden = false;
      $("rvName").focus();
    });
  }

  // ---------- Widget del inicio ----------
  function initHome() {
    const box = $("homeReviews");
    if (!box) return;
    let reviews = null;

    function render() {
      box.replaceChildren();
      const top = (reviews || []).filter((r) => r.rating >= 4).slice(0, 3);
      if (!top.length) {
        box.classList.add("is-empty");
        box.appendChild(el("div", { class: "rv-empty" }, [
          icon("fa-regular fa-comments"),
          el("p", { text: t("homeEmpty") }),
          el("a", { href: "reviews.html#escribir", class: "rv-btn rv-btn-primary", text: t("homeCta") }),
        ]));
        return;
      }
      box.classList.remove("is-empty");
      top.forEach((r) => box.appendChild(card(r, { compact: true })));
    }

    document.addEventListener("jl:lang", () => reviews && render());
    fetchReviews().catch(() => []).then((r) => { reviews = r; render(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { initReviewsPage(); initHome(); });
  } else {
    initReviewsPage();
    initHome();
  }
})();
