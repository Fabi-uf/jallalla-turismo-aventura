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
