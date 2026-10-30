#!/usr/bin/env python3
"""
Galería: agrega fotos nuevas y regenera gallery.html.

Uso (desde la carpeta del proyecto):
  1. Copia las fotos originales en  fotos-nuevas/<categoria>/
     (ej: fotos-nuevas/sandboard/IMG_1234.jpg). Categorías: ver img/gallery/galeria.json
     Si usas una categoría nueva, agrégala en "categorias" de galeria.json (es/en).
  2. Ejecuta:  python3 tools/galeria.py
  3. (Opcional) Abre img/gallery/galeria.json, escribe el título de cada foto en "es" y "en",
     y vuelve a ejecutar el paso 2.

Requiere Pillow:  pip install pillow
"""
import html
import json
import pathlib
import re
import shutil
import sys
import unicodedata

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "img" / "gallery" / "galeria.json"
THUMBS = ROOT / "img" / "gallery" / "thumbs"
FULL = ROOT / "img" / "gallery" / "full"
INBOX = ROOT / "fotos-nuevas"
START, END = "<!-- GALERIA:START -->", "<!-- GALERIA:END -->"
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic"}


def slug(text):
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "foto"


def process_new(data):
    if not INBOX.exists():
        return 0
    try:
        from PIL import Image, ImageOps
    except ImportError:
        sys.exit("Falta Pillow. Instálalo con:  pip install pillow")

    names = {f["archivo"] for f in data["fotos"]}
    added = 0
    for cat_dir in sorted(p for p in INBOX.iterdir() if p.is_dir() and p.name != "procesadas"):
        cat = slug(cat_dir.name)
        if cat not in data["categorias"]:
            data["categorias"][cat] = {"es": cat_dir.name.capitalize(), "en": cat_dir.name.capitalize()}
            print(f"  categoría nueva '{cat}' (revisa su nombre en inglés en galeria.json)")
        for src in sorted(cat_dir.iterdir()):
            if src.suffix.lower() not in EXTS:
                continue
            name = base = f"{cat}-{slug(src.stem)}"
            i = 2
            while name in names:
                name = f"{base}-{i}"
                i += 1
            try:
                im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
            except Exception as e:  # noqa: BLE001
                print(f"  no se pudo abrir {src.name}: {e}")
                continue
            full = im.copy()
            full.thumbnail((1800, 1800))
            full.save(FULL / f"{name}.webp", "WEBP", quality=80, method=6)
            thumb = im.copy()
            thumb.thumbnail((720, 1200))
            thumb.save(THUMBS / f"{name}.webp", "WEBP", quality=75, method=6)
            data["fotos"].insert(0, {"archivo": name, "categoria": cat, "es": "", "en": "",
                                     "ancho": thumb.width, "alto": thumb.height})
            names.add(name)
            done = INBOX / "procesadas" / cat_dir.name
            done.mkdir(parents=True, exist_ok=True)
            shutil.move(str(src), done / src.name)
            added += 1
            print(f"  + {name}")
    return added


def render(data):
    cats = data["categorias"]
    fotos = data["fotos"]
    esc = lambda s: html.escape(s or "", quote=True)  # noqa: E731

    counts = {c: sum(1 for f in fotos if f["categoria"] == c) for c in cats}
    out = ['<div class="gallery-filters" role="toolbar" aria-label="Filtrar fotos" data-t-aria="gallery.filters">',
           f'  <button type="button" class="gallery-filter" data-filter="all" aria-pressed="true"><span data-t="gallery.filterAll">Todas</span> <span class="count">{len(fotos)}</span></button>']
    for c, label in cats.items():
        if counts.get(c):
            out.append(f'  <button type="button" class="gallery-filter" data-filter="{c}" aria-pressed="false">'
                       f'<span data-es="{esc(label["es"])}" data-en="{esc(label["en"])}">{esc(label["es"])}</span> '
                       f'<span class="count">{counts[c]}</span></button>')
    out.append("</div>\n")
    out.append('<div class="gallery-masonry" id="galleryGrid">')
    for i, f in enumerate(fotos):
        cat = cats.get(f["categoria"], {"es": f["categoria"], "en": f["categoria"]})
        es = f.get("es") or cat["es"]
        en = f.get("en") or cat["en"]
        n = f["archivo"]
        out.append(f'''  <figure class="gallery-item" data-cat="{esc(f["categoria"])}">
    <a href="img/gallery/full/{n}.webp" data-lightbox>
      <img src="img/gallery/thumbs/{n}.webp" width="{f["ancho"]}" height="{f["alto"]}" loading="{"eager" if i < 3 else "lazy"}" decoding="async" alt="{esc(es)}" data-alt-es="{esc(es)}" data-alt-en="{esc(en)}">
      <figcaption>
        <span><span class="cap-tag" data-es="{esc(cat["es"])}" data-en="{esc(cat["en"])}">{esc(cat["es"])}</span><span class="cap-title" data-es="{esc(es)}" data-en="{esc(en)}">{esc(es)}</span></span>
        <span class="cap-zoom" aria-hidden="true"><i class="fa-solid fa-expand"></i></span>
      </figcaption>
    </a>
  </figure>''')
    out.append("</div>")
    return "\n".join(out)


def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    added = process_new(data)
    # quita de la lista fotos cuyos archivos ya no existen
    data["fotos"] = [f for f in data["fotos"] if (THUMBS / f"{f['archivo']}.webp").exists()]
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    page = ROOT / "gallery.html"
    text = page.read_text(encoding="utf-8")
    block = START + "\n" + render(data) + "\n" + END
    text = re.sub(re.escape(START) + r".*?" + re.escape(END), lambda _: block, text, flags=re.S)
    page.write_text(text, encoding="utf-8")
    print(f"Listo: {added} foto(s) nueva(s), {len(data['fotos'])} en total. gallery.html actualizado.")


if __name__ == "__main__":
    main()
