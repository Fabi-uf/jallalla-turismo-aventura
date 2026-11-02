#!/usr/bin/env python3
"""
SEO del sitio: completa las URLs absolutas cuando ya tienen dominio.

Uso (desde la carpeta del proyecto):
    python3 tools/seo.py https://jallalla-turismo-aventura.cl

Qué hace:
  - En cada página .html completa el bloque <!-- SEO:START --> ... <!-- SEO:END -->
    con canonical, og:url, og:image y (en el inicio) los datos estructurados de la empresa.
  - Crea/actualiza sitemap.xml y robots.txt.
Puedes ejecutarlo de nuevo cuantas veces quieras (por ejemplo si cambias el dominio).
Sin dominio (python3 tools/seo.py --sin-dominio) deja los bloques sin URLs absolutas.
"""
import datetime
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
START, END = "<!-- SEO:START -->", "<!-- SEO:END -->"
# Páginas que van al sitemap (prioridad)
PAGES = {
    "index.html": "1.0",
    "activities.html": "0.9",
    "gallery.html": "0.7",
    "reviews.html": "0.7",
    "contact.html": "0.8",
    "about.html": "0.6",
    "privacidad.html": "0.2",
}


def read_config():
    d = json.loads((ROOT / "data" / "sitio.json").read_text(encoding="utf-8"))
    return {"whatsapp": "".join(c for c in str(d.get("whatsapp", "")) if c.isdigit()),
            "email": d.get("email", ""), "facebook": d.get("facebook", ""),
            "instagram": d.get("instagram", ""), "tiktok": d.get("tiktok", ""),
            "googleMaps": d.get("googleMaps", "")}


def business_jsonld(domain):
    cfg = read_config()
    data = {
        "@context": "https://schema.org",
        "@type": "TravelAgency",
        "name": "Jallalla Turismo Aventura",
        "description": "Turismo aventura en Iquique: sandboard en el Cerro Dragón, parapente biplaza, buceo y snorkel, rappel y trekking, y yoga en la playa.",
        "telephone": "+" + cfg["whatsapp"] if cfg["whatsapp"] else None,
        "email": cfg["email"] or None,
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Iquique",
            "addressRegion": "Tarapacá",
            "addressCountry": "CL",
        },
        "areaServed": ["Iquique", "Alto Hospicio", "Región de Tarapacá"],
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "00:00",
            "closes": "23:59",
        },
        "knowsLanguage": ["es", "en"],
        "sameAs": [u for u in [cfg["facebook"], cfg["instagram"], cfg["tiktok"], cfg["googleMaps"]] if u] or None,
    }
    if domain:
        data["url"] = domain + "/"
        data["image"] = domain + "/img/og-cover.jpg"
        data["logo"] = domain + "/img/logo.png" if (ROOT / "img" / "logo.png").exists() else None
    data = {k: v for k, v in data.items() if v is not None}
    return '<script type="application/ld+json">\n' + json.dumps(data, ensure_ascii=False, indent=2) + "\n</script>"


def block_for(filename, domain):
    lines = []
    if domain and filename != "404.html":
        path = "/" if filename == "index.html" else "/" + filename
        url = domain + path
        lines += [
            f'<link rel="canonical" href="{url}">',
            f'<meta property="og:url" content="{url}">',
            f'<meta property="og:image" content="{domain}/img/og-cover.jpg">',
            '<meta property="og:image:width" content="1200">',
            '<meta property="og:image:height" content="630">',
            f'<meta name="twitter:image" content="{domain}/img/og-cover.jpg">',
        ]
    if filename == "index.html":
        lines.append(business_jsonld(domain))
    return "\n  ".join([START] + lines + [END])


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    arg = sys.argv[1].strip()
    domain = None if arg == "--sin-dominio" else arg.rstrip("/")
    if domain and not re.match(r"^https?://[^/]+$", domain):
        sys.exit("El dominio debe ser del tipo https://www.tudominio.cl (sin rutas al final)")

    pattern = re.compile(re.escape(START) + r".*?" + re.escape(END), re.S)
    for html in sorted(ROOT.glob("*.html")):
        text = html.read_text(encoding="utf-8")
        if START not in text:
            continue
        html.write_text(pattern.sub(lambda _: block_for(html.name, domain), text), encoding="utf-8")
        print("  actualizado", html.name)

    robots = "User-agent: *\nAllow: /\n"
    if domain:
        today = datetime.date.today().isoformat()
        urls = "".join(
            f"  <url>\n    <loc>{domain}{'/' if p == 'index.html' else '/' + p}</loc>\n"
            f"    <lastmod>{today}</lastmod>\n    <priority>{prio}</priority>\n  </url>\n"
            for p, prio in PAGES.items() if (ROOT / p).exists()
        )
        (ROOT / "sitemap.xml").write_text(
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "</urlset>\n",
            encoding="utf-8",
        )
        robots += f"\nSitemap: {domain}/sitemap.xml\n"
        print("  creado sitemap.xml")
    (ROOT / "robots.txt").write_text(robots, encoding="utf-8")
    print("  actualizado robots.txt")
    print("Listo." if domain else "Listo (sin dominio). Ejecuta de nuevo con tu dominio cuando lo tengan.")


if __name__ == "__main__":
    main()
