/* =========================================================
   CONFIGURACIÓN DEL SITIO — cambia los datos SOLO aquí
   ========================================================= */
window.JL_CONFIG = {
  // Teléfono de WhatsApp: solo números, con código de país (56 = Chile)
  whatsapp: "56930887075",
  phoneDisplay: "+56 9 3088 7075",
  email: "jallallaturismoaventura@gmail.com",

  // Redes sociales. Deja "" para ocultar una red en todo el sitio.
  facebook: "https://www.facebook.com/share/1BLBdyu36v/", // TODO: reemplazar por el link fijo de la página
  messenger: "",          // ej: "https://m.me/jallallaturismo" (chat directo de Facebook)
  instagram: "",          // ej: "https://www.instagram.com/jallalla.turismo"
  instagramDM: "",        // ej: "https://ig.me/m/jallalla.turismo" (chat directo de Instagram)
  tiktok: "https://www.tiktok.com/@jallalla.turismo",

  // Mapa
  mapsQuery: "Iquique, Chile",

  // Precios en pesos chilenos (solo números). null = muestra "Consultar precio"
  prices: {
    sandboard: null,      // ej: 25000
    parapente: null,
    buceo: null,
    rappel: null,
    yoga: null,
  },

  // Reseñas: URL de tu Apps Script (termina en /exec). Ver apps-script/README.md
  reviewsApi: "",
};
