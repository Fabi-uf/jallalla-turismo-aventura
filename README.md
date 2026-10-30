# Jallalla Turismo Aventura — sitio web

Sitio estático (HTML, CSS y JS, sin frameworks). Funciona en cualquier hosting: cPanel, Hostinger, Netlify, GitHub Pages, etc.

## Estructura

```
index.html  about.html  activities.html  gallery.html  reviews.html  contact.html  privacidad.html  404.html
css/style.css            estilos de todo el sitio
main.js                  idioma, menú, WhatsApp, cookies, mapa, formulario
js/config.js             ⭐ DATOS DEL NEGOCIO: teléfono, redes, precios, URL de reseñas
js/i18n.js               ⭐ TEXTOS en español e inglés
js/gallery.js            filtros y visor de la galería
js/reviews.js            reseñas (lectura + formulario)
img/gallery/             fotos optimizadas (thumbs = miniaturas, full = grandes) + galeria.json
img/posters/             portadas de los videos
videos/                  videos comprimidos
fonts/  vendor/          tipografías e íconos (locales, sin CDN)
apps-script/             backend gratis de reseñas (Google Sheets) + instrucciones
tools/                   scripts de mantenimiento (no se suben al hosting)
```

## Cambios rápidos

| Quiero cambiar…                         | Dónde                                   |
|-----------------------------------------|-----------------------------------------|
| WhatsApp, correo, redes sociales        | `js/config.js`                          |
| Precios (null = "Consultar precio")     | `js/config.js` → `prices`               |
| Cualquier texto (ES o EN)               | `js/i18n.js` (busca el texto)           |
| Duración / lugar de una actividad       | En `index.html` y `activities.html` (chips de la tarjeta) |
| Fotos de la galería                     | Ver "Agregar fotos"                     |

Para ocultar una red social en todo el sitio, déjala vacía (`""`) en `config.js`.

## Agregar fotos a la galería

1. Copia las fotos originales en `fotos-nuevas/<categoria>/` (ej: `fotos-nuevas/yoga/foto1.jpg`).
2. Ejecuta `python3 tools/galeria.py` (necesita `pip install pillow`).
3. Opcional: escribe el título de cada foto en `img/gallery/galeria.json` (`"es"` y `"en"`) y vuelve a ejecutar el paso 2.

## Agregar un video

`bash tools/video.sh ruta/al/video.mp4 nombre` (necesita ffmpeg). Crea `videos/nombre.mp4` y su portada. Después copia una tarjeta `video-card` en la página donde lo quieras mostrar.

## Antes de subir al hosting (checklist)

1. **Dominio:** `python3 tools/seo.py https://www.tudominio.cl` → completa canonical, vista previa para redes, sitemap.xml y robots.txt.
2. **Reseñas:** sigue `apps-script/README.md` y pega la URL en `js/config.js` → `reviewsApi`.
3. **Facebook / Instagram:** revisa los links en `js/config.js`.
4. **Sube todo menos:** `tools/`, `apps-script/`, `fotos-nuevas/`, `README.md`, `.git/`, `.vscode/`.
5. **HTTPS:** cuando el hosting active el certificado SSL, descomenta las líneas de HTTPS en `.htaccess`.
6. **Google:** crea el Perfil de Empresa en Google (gratis) y registra el sitio en Google Search Console enviando `sitemap.xml`.

## Cookies y privacidad

- El banner aparece la primera vez. "Solo necesarias" guarda solo el idioma y la decisión.
- Google Maps se carga únicamente si la persona acepta.
- Si en el futuro agregan Google Analytics, cárgalo solo cuando `window.jlConsent() === "all"` (o escuchando el evento `jl:consent`).
- La política está en `privacidad.html` (español e inglés).
