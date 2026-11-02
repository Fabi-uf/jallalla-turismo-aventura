#!/usr/bin/env python3
"""
Galería: optimiza fotos nuevas y regenera gallery.html a partir de data/galeria.json.

Se ejecuta SOLO en GitHub (Action .github/workflows/galeria.yml) cada vez que
alguien sube fotos desde el panel (Pages CMS) o cambia data/galeria.json.
También puedes ejecutarlo a mano:  python3 tools/galeria.py   (pip install pillow pillow-heif)

Dos formas de agregar fotos:
  A) Panel: Galería → agregar foto (se sube a fotos-nuevas/ y queda listada en data/galeria.json)
  B) A mano: copia fotos en fotos-nuevas/<categoria>/ (ej: fotos-nuevas/yoga/foto.jpg)
Categorías y sus nombres (es/en): data/categorias.json
"""
import html
import json
import pathlib
import re
import sys
import unicodedata

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "galeria.json"
CATS = ROOT / "data" / "categorias.json"
THUMBS = ROOT / "img" / "gallery" / "thumbs"
FULL = ROOT / "img" / "gallery" / "full"
INBOX = ROOT / "fotos-nuevas"
START, END = "<!-- GALERIA:START -->", "<!-- GALERIA:END -->"
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Falta Pillow. Instálalo con:  pip install pillow pillow-heif")
try:  # fotos de iPhone
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass


def slug(text):
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "foto"


def rel(path):
    """Ruta relativa al proyecto, sin '/' inicial (el panel puede escribir '/fotos-nuevas/x.jpg')."""
    return str(path or "").strip().lstrip("/")


def optimize(src, name):
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    full = im.copy()
    full.thumbnail((1800, 1800))
    full.save(FULL / f"{name}.webp", "WEBP", quality=80, method=6)
    thumb = im.copy()
    thumb.thumbnail((720, 1200))
    thumb.save(THUMBS / f"{name}.webp", "WEBP", quality=75, method=6)


def unique_name(base, used):
    name, i = base, 2
    while name in used or (FULL / f"{name}.webp").exists():
        name, i = f"{base}-{i}", i + 1
    return name


def main():
    cats = json.loads(CATS.read_text(encoding="utf-8"))
    data = json.loads(DATA.read_text(encoding="utf-8")) if DATA.exists() else {"fotos": []}
    fotos = [f for f in data.get("fotos", []) if isinstance(f, dict)]
    used = {pathlib.Path(rel(f.get("imagen"))).stem for f in fotos if rel(f.get("imagen")).startswith("img/gallery/full/")}
    changed = 0

    # A) Fotos subidas desde el panel: imagen apunta a un archivo original → se optimiza
    keep = []
    for f in fotos:
        path = rel(f.get("imagen"))
        cat = slug(f.get("categoria") or "otra")
        f["categoria"] = cat
        if path.startswith("img/gallery/full/") and path.endswith(".webp"):
            if not (FULL / pathlib.Path(path).name).exists():
                print(f"  ! falta {path}, se quita de la galería")
                changed += 1
                continue
            name = pathlib.Path(path).stem
            if not (THUMBS / f"{name}.webp").exists():
                optimize(FULL / f"{name}.webp", name)
            keep.append(f)
            continue
        src = ROOT / path
        if not path or not src.exists() or src.suffix.lower() not in EXTS:
            print(f"  ! no encuentro la imagen '{path}', se quita de la galería")
            changed += 1
            continue
        name = unique_name(f"{cat}-{slug(src.stem)}", used)
        try:
            optimize(src, name)
        except Exception as e:  # noqa: BLE001
            print(f"  ! no se pudo abrir {src.name}: {e}")
            continue
        used.add(name)
        src.unlink()
        f["imagen"] = f"img/gallery/full/{name}.webp"
        keep.append(f)
        changed += 1
        print(f"  + {name} (desde el panel)")
    fotos = keep

    # B) Fotos dejadas a mano en fotos-nuevas/<categoria>/
    if INBOX.exists():
        for cat_dir in sorted(p for p in INBOX.iterdir() if p.is_dir()):
            cat = slug(cat_dir.name)
            for src in sorted(cat_dir.iterdir()):
                if src.suffix.lower() not in EXTS:
                    continue
                name = unique_name(f"{cat}-{slug(src.stem)}", used)
                try:
                    optimize(src, name)
                except Exception as e:  # noqa: BLE001
                    print(f"  ! no se pudo abrir {src.name}: {e}")
                    continue
                used.add(name)
                src.unlink()
                fotos.insert(0, {"imagen": f"img/gallery/full/{name}.webp", "categoria": cat, "es": "", "en": ""})
                changed += 1
                print(f"  + {name} (carpeta)")

    # Categorías nuevas: nombre provisional (se puede corregir en data/categorias.json)
    for f in fotos:
        if f["categoria"] not in cats:
            cats[f["categoria"]] = {"es": f["categoria"].replace("-", " ").capitalize(), "en": f["categoria"].replace("-", " ").capitalize()}
            print(f"  categoría nueva '{f['categoria']}' (revisa su nombre en data/categorias.json)")

    # Solo los campos del panel (el panel borra campos desconocidos)
    clean = [{"imagen": f["imagen"], "categoria": f["categoria"], "es": f.get("es") or "", "en": f.get("en") or ""} for f in fotos]
    DATA.write_text(json.dumps({"fotos": clean}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    CATS.write_text(json.dumps(cats, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    page = ROOT / "gallery.html"
    text = page.read_text(encoding="utf-8")
    block = START + "\n" + render(clean, cats) + "\n" + END
    page.write_text(re.sub(re.escape(START) + r".*?" + re.escape(END), lambda _: block, text, flags=re.S), encoding="utf-8")
    print(f"Listo: {changed} cambio(s), {len(clean)} fotos en la galería.")


def render(fotos, cats):
    esc = lambda s: html.escape(s or "", quote=True)  # noqa: E731
    counts = {}
    for f in fotos:
        counts[f["categoria"]] = counts.get(f["categoria"], 0) + 1
    out = ['<div class="gallery-filters" role="toolbar" aria-label="Filtrar fotos" data-t-aria="gallery.filters">',
           f'  <button type="button" class="gallery-filter" data-filter="all" aria-pressed="true"><span data-t="gallery.filterAll">Todas</span> <span class="count">{len(fotos)}</span></button>']
    for c, label in cats.items():
        if counts.get(c):
            out.append(f'  <button type="button" class="gallery-filter" data-filter="{esc(c)}" aria-pressed="false">'
                       f'<span data-es="{esc(label["es"])}" data-en="{esc(label["en"])}">{esc(label["es"])}</span> '
                       f'<span class="count">{counts[c]}</span></button>')
    out.append("</div>\n")
    out.append('<div class="gallery-masonry" id="galleryGrid">')
    for i, f in enumerate(fotos):
        cat = cats.get(f["categoria"], {"es": f["categoria"], "en": f["categoria"]})
        es = f["es"] or cat["es"]
        en = f["en"] or cat["en"]
        n = pathlib.Path(f["imagen"]).stem
        with Image.open(THUMBS / f"{n}.webp") as t:
            w, h = t.size
        out.append(f'''  <figure class="gallery-item" data-cat="{esc(f["categoria"])}">
    <a href="img/gallery/full/{n}.webp" data-lightbox>
      <img src="img/gallery/thumbs/{n}.webp" width="{w}" height="{h}" loading="{"eager" if i < 3 else "lazy"}" decoding="async" alt="{esc(es)}" data-alt-es="{esc(es)}" data-alt-en="{esc(en)}">
      <figcaption>
        <span><span class="cap-tag" data-es="{esc(cat["es"])}" data-en="{esc(cat["en"])}">{esc(cat["es"])}</span><span class="cap-title" data-es="{esc(es)}" data-en="{esc(en)}">{esc(es)}</span></span>
        <span class="cap-zoom" aria-hidden="true"><i class="fa-solid fa-expand"></i></span>
      </figcaption>
    </a>
  </figure>''')
    out.append("</div>")
    return "\n".join(out)


if __name__ == "__main__":
    main()
