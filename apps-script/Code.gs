/**
 * Jallalla Turismo Aventura — API de reseñas (Google Apps Script + Google Sheets)
 *
 * Cómo funciona:
 *  - POST  -> guarda una reseña nueva con estado "pendiente".
 *  - GET   -> devuelve solo las reseñas con estado "aprobada" (JSON).
 *  - Para publicar una reseña, en la planilla cambia la columna "estado" a "aprobada".
 *
 * Instalación: ver apps-script/README.md
 */

// ===================== CONFIGURACIÓN =====================
const SHEET_NAME = "Reseñas";
const AUTO_APPROVE = false;      // true = se publican al tiro, sin revisión (no recomendado)
const NOTIFY_EMAIL = "";         // ej: "jallallaturismoaventura@gmail.com" para recibir aviso de cada reseña nueva
const MAX_POSTS_PER_10_MIN = 15; // límite global anti-spam
const CACHE_SECONDS = 300;       // cuánto se cachea la lista pública (5 min)

// ---- Reseñas de Google (opcional). Ver apps-script/README.md ----
const GOOGLE_API_KEY = "";               // API key de Google Cloud (restringida a Places API)
const GOOGLE_PLACE_ID = "";              // Place ID de la ficha de Jallalla en Google Maps
const GOOGLE_MAX_CALLS_PER_MONTH = 900;  // tope duro: nunca se pasa de esto (el gratis es 1.000)
const GOOGLE_TZ = "America/Santiago";
// =========================================================

const HEADERS = ["fecha", "nombre", "estrellas", "actividad", "idioma", "texto", "estado", "fuente", "respuesta"];
const ACTIVITIES = ["sandboard", "parapente", "buceo", "rappel", "yoga", "otra"];
const LANGS = ["es", "en", "fr", "pt", "de"];
const CACHE_KEY = "approved_v1";

/** Ejecútala UNA vez desde el editor para crear la hoja con formato. */
function setup() {
  const sh = getSheet_();
  const estado = sh.getRange(2, 7, sh.getMaxRows() - 1, 1);
  estado.setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(["pendiente", "aprobada", "rechazada"], true).build()
  );
  const fuente = sh.getRange(2, 8, sh.getMaxRows() - 1, 1);
  fuente.setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(["web", "facebook", "instagram", "tiktok", "whatsapp"], true).build()
  );
  sh.setColumnWidth(6, 420);
  sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff");
}

/**
 * Ejecútala UNA vez para activar las reseñas de Google:
 * crea un disparador diario (6:00) y hace la primera consulta.
 */
function activarGoogle() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === "actualizarGoogle")
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("actualizarGoogle").timeBased().everyDays(1).atHour(6).create();
  actualizarGoogle();
}

/** Consulta Google Places UNA vez y guarda el resultado. La llama el disparador diario. */
function actualizarGoogle() {
  if (!GOOGLE_API_KEY || !GOOGLE_PLACE_ID) return;
  const props = PropertiesService.getScriptProperties();
  const month = Utilities.formatDate(new Date(), GOOGLE_TZ, "yyyy-MM");
  const counterKey = "google_calls_" + month;
  const used = parseInt(props.getProperty(counterKey) || "0", 10);

  // Tope mensual: si ya se llegó, no se consulta (se siguen mostrando las últimas guardadas)
  if (used >= GOOGLE_MAX_CALLS_PER_MONTH) {
    console.warn("Tope mensual de Google alcanzado (" + used + "). No se consulta.");
    return;
  }
  // Se cuenta ANTES de llamar: aunque la llamada falle, cuenta como usada
  props.setProperty(counterKey, String(used + 1));
  Object.keys(props.getProperties())
    .filter((k) => k.indexOf("google_calls_") === 0 && k !== counterKey)
    .forEach((k) => props.deleteProperty(k));

  const url = "https://places.googleapis.com/v1/places/" + encodeURIComponent(GOOGLE_PLACE_ID) + "?languageCode=es";
  const res = UrlFetchApp.fetch(url, {
    headers: { "X-Goog-Api-Key": GOOGLE_API_KEY, "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews" },
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    console.error("Google respondió " + res.getResponseCode() + ": " + res.getContentText().slice(0, 300));
    return;
  }
  const d = JSON.parse(res.getContentText());
  const data = {
    rating: d.rating || null,
    total: d.userRatingCount || 0,
    url: d.googleMapsUri || "",
    updated: new Date().toISOString(),
    reviews: (d.reviews || []).map((r) => {
      const txt = r.originalText || r.text || {};
      const author = r.authorAttribution || {};
      return {
        date: r.publishTime || "",
        name: String(author.displayName || "Google").slice(0, 60),
        authorUrl: author.uri || "",
        rating: Math.max(1, Math.min(5, parseInt(r.rating, 10) || 5)),
        activity: "",
        lang: String(txt.languageCode || "es").slice(0, 2),
        text: String(txt.text || "").slice(0, 900),
        source: "google",
        reply: "",
      };
    }),
  };
  props.setProperty("google_data", JSON.stringify(data));
  CacheService.getScriptCache().remove(CACHE_KEY);
}

/** Cuántas consultas a Google van este mes (ejecútala para revisar). */
function verUsoGoogle() {
  const month = Utilities.formatDate(new Date(), GOOGLE_TZ, "yyyy-MM");
  const used = PropertiesService.getScriptProperties().getProperty("google_calls_" + month) || "0";
  console.log("Consultas a Google en " + month + ": " + used + " de " + GOOGLE_MAX_CALLS_PER_MONTH);
}

function googleData_() {
  try {
    return JSON.parse(PropertiesService.getScriptProperties().getProperty("google_data") || "null");
  } catch (_) {
    return null;
  }
}

/** Limpia la caché cuando editas la planilla a mano (aprobar/rechazar). Se instala solo como trigger simple. */
function onEdit() {
  CacheService.getScriptCache().remove(CACHE_KEY);
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- GET: reseñas aprobadas ----------
function doGet() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CACHE_KEY);
  if (cached) return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);

  const rows = getSheet_().getDataRange().getValues().slice(1);
  const reviews = rows
    .filter((r) => String(r[6]).trim().toLowerCase() === "aprobada")
    .map((r) => ({
      date: r[0] instanceof Date ? r[0].toISOString() : String(r[0] || ""),
      name: String(r[1] || "").replace(/^'/, "").slice(0, 40),
      rating: Math.max(1, Math.min(5, parseInt(r[2], 10) || 5)),
      activity: String(r[3] || ""),
      lang: String(r[4] || ""),
      text: String(r[5] || "").replace(/^'/, ""),
      source: String(r[7] || "web"),
      reply: String(r[8] || ""),
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  // Reseñas de Google guardadas por el disparador diario (las visitas NO consultan a Google)
  const g = googleData_();
  const all = g ? reviews.concat(g.reviews || []).sort((a, b) => (a.date < b.date ? 1 : -1)) : reviews;
  const google = g ? { rating: g.rating, total: g.total, url: g.url } : null;

  const body = JSON.stringify({ ok: true, reviews: all, google: google });
  if (body.length < 90000) cache.put(CACHE_KEY, body, CACHE_SECONDS);
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

// ---------- POST: nueva reseña ----------
function doPost(e) {
  let data;
  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (_) {
    return json_({ ok: false, error: "bad_request" });
  }

  // Anti-bots: campo trampa y tiempo mínimo en la página
  if (data.website) return json_({ ok: true, pending: true }); // se finge éxito
  if (!(Number(data.elapsed) >= 3000)) return json_({ ok: false, error: "too_fast" });

  const name = clean_(data.name, 40);
  const text = clean_(data.text, 800);
  const rating = parseInt(data.rating, 10);
  const activity = ACTIVITIES.indexOf(data.activity) >= 0 ? data.activity : "otra";
  const lang = LANGS.indexOf(data.lang) >= 0 ? data.lang : "es";

  if (name.length < 2 || text.length < 15 || !(rating >= 1 && rating <= 5) || data.consent !== true) {
    return json_({ ok: false, error: "invalid" });
  }
  if (/https?:\/\/|www\./i.test(text)) return json_({ ok: false, error: "links" });

  const cache = CacheService.getScriptCache();

  // Límite global de envíos
  const count = parseInt(cache.get("post_count") || "0", 10);
  if (count >= MAX_POSTS_PER_10_MIN) return json_({ ok: false, error: "rate_limited" });
  cache.put("post_count", String(count + 1), 600);

  // Evita duplicados (doble clic / reenvío)
  const fp = "dup_" + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, name + "|" + text));
  if (cache.get(fp)) return json_({ ok: true, pending: !AUTO_APPROVE });
  cache.put(fp, "1", 3600);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    getSheet_().appendRow([new Date(), name, rating, activity, lang, text, AUTO_APPROVE ? "aprobada" : "pendiente", "web", ""]);
  } finally {
    lock.releaseLock();
  }
  if (AUTO_APPROVE) cache.remove(CACHE_KEY);

  if (NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        "Nueva reseña (" + rating + "★) de " + name,
        text + "\n\nActividad: " + activity + "\nPara publicarla, cambia el estado a \"aprobada\" en la planilla:\n" +
          SpreadsheetApp.getActiveSpreadsheet().getUrl()
      );
    } catch (_) {}
  }

  return json_({ ok: true, pending: !AUTO_APPROVE });
}

/** Quita espacios extra y evita que Sheets interprete el texto como fórmula. */
function clean_(value, max) {
  let s = String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
