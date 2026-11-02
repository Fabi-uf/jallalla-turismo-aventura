# Jallalla Turismo Aventura — sitio web

Sitio estático (HTML, CSS y JS, sin frameworks). Funciona en cualquier hosting: cPanel, Hostinger, Netlify, GitHub Pages, etc.

## Estructura

```
index.html  about.html  activities.html  gallery.html  reviews.html  contact.html  privacidad.html  404.html
css/style.css            estilos de todo el sitio
main.js                  idioma, menú, WhatsApp, cookies, mapa, formulario
data/sitio.json          ⭐ DATOS DEL NEGOCIO: teléfono, redes, precios (editable en el panel)
data/resenas.json        ⭐ reseñas cargadas a mano (editable en el panel)
data/galeria.json        ⭐ fotos de la galería y su orden (editable en el panel)
data/categorias.json     nombres de las categorías de la galería (es/en)
js/config.js             configuración técnica: URL de reseñas (Apps Script)
.pages.yml               configuración del panel de administración (Pages CMS)
.github/workflows/       optimiza las fotos subidas desde el panel
js/i18n.js               ⭐ TEXTOS en español e inglés
js/gallery.js            filtros y visor de la galería
js/reviews.js            reseñas (lectura + formulario)
img/gallery/             fotos optimizadas (thumbs = miniaturas, full = grandes)
img/posters/             portadas de los videos
videos/                  videos comprimidos
fonts/  vendor/          tipografías e íconos (locales, sin CDN)
apps-script/             backend gratis de reseñas (Google Sheets) + instrucciones
tools/                   scripts de mantenimiento (no se suben al hosting)
```

## Cambios rápidos

| Quiero cambiar…                         | Dónde                                   |
|-----------------------------------------|-----------------------------------------|
| WhatsApp, correo, redes sociales        | Panel → "Contacto, redes y precios" (o `data/sitio.json`) |
| Precios (0 = "Consultar precio")        | Panel → "Contacto, redes y precios"     |
| Reseñas                                 | Panel → "Reseñas" (o planilla de Google) |
| Cualquier texto (ES o EN)               | `js/i18n.js` (busca el texto)           |
| Duración / lugar de una actividad       | En `index.html` y `activities.html` (chips de la tarjeta) |
| Fotos de la galería                     | Ver "Agregar fotos"                     |

Para ocultar una red social en todo el sitio, déjala vacía en el panel.

> Para probar el sitio en tu computador usa un servidor local (`python3 -m http.server`): los datos de `data/` no cargan abriendo el HTML con doble clic.

## Panel de administración (Pages CMS)

El negocio edita fotos, reseñas, contacto y precios en https://app.pagescms.org (se le invita por correo; no necesita cuenta de GitHub).
Cada cambio queda guardado en GitHub y se publica solo en 1–3 minutos. Las fotos subidas se optimizan
automáticamente con una GitHub Action (pestaña Actions del repo).

## Agregar fotos a la galería (a mano)

1. Copia las fotos originales en `fotos-nuevas/<categoria>/` (ej: `fotos-nuevas/yoga/foto1.jpg`).
2. Ejecuta `python3 tools/galeria.py` (necesita `pip install pillow pillow-heif`), o simplemente haz push: la Action lo hace.
3. Opcional: escribe el título de cada foto en `data/galeria.json` (`"es"` y `"en"`).

## Agregar un video

`bash tools/video.sh ruta/al/video.mp4 nombre` (necesita ffmpeg). Crea `videos/nombre.mp4` y su portada. Después copia una tarjeta `video-card` en la página donde lo quieras mostrar.

## Antes de subir al hosting (checklist)

1. **Dominio:** `python3 tools/seo.py https://jallalla-turismo-aventura.cl` → completa canonical, vista previa para redes, sitemap.xml y robots.txt.
2. **Reseñas:** sigue `apps-script/README.md` y pega la URL en `js/config.js` → `reviewsApi`.
3. **Facebook / Instagram / precios:** desde el panel.
4. El sitio se publica desde GitHub con Cloudflare Pages (no se sube a mano).
5. **HTTPS:** cuando el hosting active el certificado SSL, descomenta las líneas de HTTPS en `.htaccess`.
6. **Google:** crea el Perfil de Empresa en Google (gratis) y registra el sitio en Google Search Console enviando `sitemap.xml`.

## Cookies y privacidad

- El banner aparece la primera vez. "Solo necesarias" guarda solo el idioma y la decisión.
- Google Maps se carga únicamente si la persona acepta.
- Si en el futuro agregan Google Analytics, cárgalo solo cuando `window.jlConsent() === "all"` (o escuchando el evento `jl:consent`).
- La política está en `privacidad.html` (español e inglés).
