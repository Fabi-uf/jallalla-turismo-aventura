# Reseñas con Google Sheets (gratis)

Las reseñas se guardan en una planilla de Google. Llegan como **pendiente** y solo se publican en la web cuando cambias su estado a **aprobada**.

## Instalación (una sola vez, unos 10 minutos)

1. Entra con la cuenta de Google del negocio y crea una planilla nueva en https://sheets.new (ponle por nombre "Reseñas Jallalla").
2. En la planilla ve a **Extensiones → Apps Script**.
3. Borra lo que aparece, pega todo el contenido de `Code.gs` y guarda.
4. (Opcional) En `NOTIFY_EMAIL` pon el correo que quieres que reciba un aviso por cada reseña nueva.
5. Arriba elige la función **setup** y presiona **Ejecutar**. Google te va a pedir permisos: acéptalos ("Configuración avanzada → Ir a…" si sale la advertencia). Se creará la hoja "Reseñas".
6. Presiona **Implementar → Nueva implementación**:
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
7. Copia la URL que termina en `/exec`.
8. Pégala en `js/config.js`, en `reviewsApi: ""`, sube los cambios y listo.

## Uso diario

- Cada reseña nueva aparece en la hoja con estado `pendiente`.
- Para publicarla: cambia el estado a `aprobada`. Para ocultarla: `rechazada`.
- Columna `respuesta`: lo que escribas ahí se muestra en la web como "Respuesta de Jallalla".
- Puedes **agregar a mano las reseñas que les dejaron en Facebook, Instagram o TikTok**: llena una fila nueva, pon la fuente (`facebook`, `instagram`…) y el estado `aprobada`. Pide permiso a la persona antes de publicar su comentario.
- Los cambios se ven en la web en unos 5 minutos (por la caché).

## Si cambias el código de Code.gs

Hay que hacer **Implementar → Administrar implementaciones → editar (lápiz) → Versión: nueva versión**. Así la URL `/exec` se mantiene igual.

## Protección incluida

- Moderación antes de publicar.
- Campo trampa invisible para bots + tiempo mínimo antes de enviar.
- Límite de 15 envíos cada 10 minutos y bloqueo de duplicados.
- No se aceptan enlaces en el texto.
- El texto se escapa en la web (no se puede inyectar código).

## Reseñas de Google (opcional, gratis dentro del tope)

El script consulta Google **una vez al día** y guarda el resultado; las visitas al sitio nunca consultan a Google.
Tiene un tope duro de **900 consultas al mes** (`GOOGLE_MAX_CALLS_PER_MONTH`); el tramo gratis de Google es 1.000.
Google entrega como máximo 5 reseñas (las que considera más relevantes) + la nota y el total.

1. **Proyecto en Google Cloud:** entra a https://console.cloud.google.com con la cuenta del negocio y crea un proyecto ("Jallalla Web").
2. **Facturación:** Facturación → vincula una cuenta de facturación (pide tarjeta; no cobra dentro del tramo gratis).
3. **Alerta de presupuesto:** Facturación → Presupuestos y alertas → Crear presupuesto de **US$1** con aviso por correo al 50 % y 100 %.
4. **Activar la API:** APIs y servicios → Biblioteca → busca **Places API (New)** → Habilitar.
5. **Tope en Google (segunda protección):** APIs y servicios → Places API (New) → Cuotas y límites del sistema → edita el límite de solicitudes de "Place Details": si aparece un límite **por día**, ponlo en **50**; si solo hay **por minuto**, ponlo en **5**. (Los nombres exactos cambian en la consola; busca "GetPlace" o "Place Details".)
6. **API key:** APIs y servicios → Credenciales → Crear credenciales → Clave de API. Edítala:
   - Restricciones de API → **Restringir clave** → solo **Places API (New)**.
   - Copia la clave.
7. **Place ID:** búscalo en https://developers.google.com/maps/documentation/places/web-service/place-id (escribe "Jallalla Turismo Aventura Iquique") y copia el ID (empieza con `ChIJ…`).
8. En `Code.gs` pega la clave en `GOOGLE_API_KEY` y el ID en `GOOGLE_PLACE_ID`, guarda.
9. Ejecuta la función **`activarGoogle`** una vez (acepta los permisos). Crea el disparador diario y hace la primera consulta.
10. **Implementar → Administrar implementaciones → editar → Versión: nueva versión** (la URL `/exec` no cambia).

Para revisar el uso del mes: ejecuta **`verUsoGoogle`** y mira el registro de ejecución.
La API key queda solo en Apps Script (no en el sitio), así que nadie puede verla ni usarla desde el navegador.
