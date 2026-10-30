#!/usr/bin/env bash
# Optimiza un video para la web y crea su imagen de portada.
# Uso:  bash tools/video.sh ruta/al/video-original.mp4 nombre-corto
# Ej:   bash tools/video.sh ~/Descargas/IMG_4455.MOV yoga
# Resultado: videos/yoga.mp4 y img/posters/yoga.webp  (requiere ffmpeg)
set -euo pipefail
src="$1"; name="$2"
cd "$(dirname "$0")/.."
ffmpeg -v error -y -i "$src" -t 30 -an -map_metadata -1 \
  -vf "scale='min(432,iw)':-2" -c:v libx264 -preset veryfast -crf 30 -pix_fmt yuv420p -movflags +faststart \
  "videos/$name.mp4"
ffmpeg -v error -y -ss 1 -i "videos/$name.mp4" -frames:v 1 -c:v libwebp -quality 72 "img/posters/$name.webp"
echo "Listo: videos/$name.mp4 ($(du -h "videos/$name.mp4" | cut -f1)) y img/posters/$name.webp"
echo "Ahora agrega una tarjeta en la sección de videos (busca 'video-card' en index.html o activities.html)."
