
(function () {
  // ---- Helpers ----
  const $ = (id) => document.getElementById(id);
  const setText = (id, val) => {
    const el = $(id);
    if (!el) return false;
    if (Array.isArray(val)) {
      el.innerHTML = "";
      val.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        el.appendChild(li);
      });
    } else {
      el.textContent = val;
    }
    return true;
  };

  const getPageKey = () => {
    try {
      const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
      return (file.replace(".html", "") || "index");
    } catch (_) {
      return "index";
    }
  };

  // ---- Traducciones ----
  const I18N = {
    common: {
      es: {
        navInicio: "Inicio",
        navAbout: "Sobre Nosotros",
        navActivities: "Actividades",
        navGallery: "Galería",
        navContact: "Contacto",
        footerText: "© 2025 Jallalla Turismo Aventura - Iquique, Chile",
        footerFirma: "Sitio desarrollado por Fabi",
      },
      en: {
        navInicio: "Home",
        navAbout: "About Us",
        navActivities: "Activities",
        navGallery: "Gallery",
        navContact: "Contact Us",
        footerText: "© 2025 Jallalla Adventure Tourism - Iquique, Chile",
        footerFirma: "Site developed by Fabi",
      },
      fr: {
        navInicio: "Accueil",
        navAbout: "À Propos",
        navActivities: "Activités",
        navGallery: "Galerie",
        navContact: "Contact",
        footerText: "© 2025 Jallalla Tourisme Aventure - Iquique, Chili",
        footerFirma: "Site développé par Fabi",
      },
      pt: {
        navInicio: "Início",
        navAbout: "Sobre Nós",
        navActivities: "Atividades",
        navGallery: "Galeria",
        navContact: "Contato",
        footerText: "© 2025 Jallalla Turismo de Aventura - Iquique, Chile",
        footerFirma: "Site desenvolvido por Fabi",
      },
      de: {
        navInicio: "Startseite",
        navAbout: "Über Uns",
        navActivities: "Aktivitäten",
        navGallery: "Galerie",
        navContact: "Kontakt",
        footerText: "© 2025 Jallalla Abenteuertourismus – Iquique, Chile",
        footerFirma: "Seite entwickelt von Fabi",
      },
    },

    pages: {
      // -------------------
      // HOME / INDEX
      // -------------------
      index: {
        es: {
          pageTitle: "Inicio - Jallalla Turismo Aventura",
          title: "Bienvenidos a Jallalla Turismo Aventura",
          desc1: "Descubre Iquique y sus alrededores con nuestras emocionantes actividades al aire libre.",
          desc2: "Desde deportes de aventura hasta experiencias relajantes en la playa, tenemos algo para todos.",
          desc3: "Explora, disfruta y crea recuerdos inolvidables con nuestro equipo de expertos guías.",
        },
        en: {
          pageTitle: "Home - Jallalla Adventure Tourism",
          title: "Welcome to Jallalla Adventure Tourism",
          desc1: "Discover Iquique and its surroundings with our exciting outdoor activities.",
          desc2: "From adventure sports to relaxing beach experiences, we have something for everyone.",
          desc3: "Explore, enjoy, and create unforgettable memories with our team of expert guides.",
        },
        fr: {
          pageTitle: "Accueil - Jallalla Tourisme Aventure",
          title: "Bienvenue chez Jallalla Tourisme Aventure",
          desc1: "Découvrez Iquique et ses environs avec nos activités de plein air palpitantes.",
          desc2: "Des sports d’aventure aux moments de détente sur la plage, il y en a pour tous.",
          desc3: "Explorez, profitez et créez des souvenirs inoubliables avec notre équipe de guides experts.",
        },
        pt: {
          pageTitle: "Início - Jallalla Turismo de Aventura",
          title: "Bem-vindos à Jallalla Turismo de Aventura",
          desc1: "Descubra Iquique e arredores com nossas emocionantes atividades ao ar livre.",
          desc2: "De esportes de aventura a experiências relaxantes na praia, temos algo para todos.",
          desc3: "Explore, aproveite e crie memórias inesquecíveis com nossa equipe de guias especialistas.",
        },
        de: {
          pageTitle: "Startseite - Jallalla Abenteuertourismus",
          title: "Willkommen bei Jallalla Abenteuertourismus",
          desc1: "Entdecken Sie Iquique und Umgebung mit unseren spannenden Outdoor-Aktivitäten.",
          desc2: "Von Abenteuersport bis zu entspannten Strandmomenten – für jeden ist etwas dabei.",
          desc3: "Entdecken, genießen und schaffen Sie unvergessliche Erinnerungen mit unserem Team aus erfahrenen Guides.",
        },
      },

      // -------------------
      // ABOUT
      // -------------------
      about: {
        es: {
          pageTitle: "Sobre Nosotros - Jallalla Turismo Aventura",
          title: "Sobre Nosotros",
          desc1: "En Jallalla Turismo Aventura nos apasiona brindar experiencias únicas en Iquique y sus alrededores. Nuestro equipo está formado por guías expertos en deportes de aventura y actividades al aire libre.",
          desc2: "Nos preocupamos por la seguridad, la diversión y la conexión con la naturaleza, ofreciendo experiencias memorables para toda la familia.",
          desc3: "Desde sandboard en el Cerro Dragón hasta parapente sobre la ciudad, cada actividad está diseñada para que disfrutes al máximo de la aventura y la belleza de nuestra región.",
        },
        en: {
          pageTitle: "About Us - Jallalla Adventure Tourism",
          title: "About Us",
          desc1: "At Jallalla Adventure Tourism, we love creating unique experiences in Iquique and its surroundings. Our team is made up of expert guides in outdoor and adventure sports.",
          desc2: "We focus on safety, fun, and nature, offering memorable experiences for the whole family.",
          desc3: "From sandboarding at Cerro Dragón to paragliding over the city, every activity is designed to help you enjoy the adventure and the beauty of our region.",
        },
        fr: {
          pageTitle: "À Propos - Jallalla Tourisme Aventure",
          title: "À Propos",
          desc1: "Chez Jallalla Tourisme Aventure, nous proposons des expériences uniques à Iquique et ses environs. Notre équipe est composée de guides experts en activités de plein air.",
          desc2: "Nous privilégions la sécurité, le plaisir et le lien avec la nature, pour des expériences mémorables en famille.",
          desc3: "Du sandboard au Cerro Dragón au parapente au-dessus de la ville, chaque activité est pensée pour profiter au maximum de l’aventure et de la beauté de la région.",
        },
        pt: {
          pageTitle: "Sobre Nós - Jallalla Turismo de Aventura",
          title: "Sobre Nós",
          desc1: "Na Jallalla Turismo de Aventura oferecemos experiências únicas em Iquique e arredores. Nossa equipe é formada por guias especialistas em atividades ao ar livre.",
          desc2: "Priorizamos segurança, diversão e conexão com a natureza, com experiências memoráveis para toda a família.",
          desc3: "Do sandboard no Cerro Dragón ao parapente sobre a cidade, cada atividade é feita para você aproveitar a aventura e a beleza da região.",
        },
        de: {
          pageTitle: "Über Uns - Jallalla Abenteuertourismus",
          title: "Über Uns",
          desc1: "Bei Jallalla Abenteuertourismus bieten wir einzigartige Erlebnisse in Iquique und Umgebung. Unser Team besteht aus erfahrenen Guides für Outdoor- und Abenteuersport.",
          desc2: "Wir legen Wert auf Sicherheit, Spaß und Naturverbundenheit – für unvergessliche Erlebnisse mit der ganzen Familie.",
          desc3: "Vom Sandboarding am Cerro Dragón bis zum Paragliding über der Stadt – jede Aktivität ist auf maximalen Genuss der Abenteuer und der Landschaft ausgelegt.",
        },
      },

      // -------------------
      // ACTIVITIES
      // -------------------
      activities: {
        es: {
          pageTitle: "Actividades - Jallalla Turismo Aventura",
          title: "Nuestras Actividades",
          desc1: [
            "🏂 Sandboard en el Cerro Dragón",
            "🪂 Parapente sobre Iquique",
            "🤿 Buceo y Snorkel",
            "🧗 Rappel y Trekking",
            "🧘 Yoga en la playa",
          ],
        },
        en: {
          pageTitle: "Activities - Jallalla Adventure Tourism",
          title: "Our Activities",
          desc1: [
            "🏂 Sandboarding at Cerro Dragón",
            "🪂 Paragliding over Iquique",
            "🤿 Diving & Snorkeling",
            "🧗 Rappelling & Trekking",
            "🧘 Beach Yoga",
          ],
        },
        fr: {
          pageTitle: "Activités - Jallalla Tourisme Aventure",
          title: "Nos Activités",
          desc1: [
            "🏂 Sandboard au Cerro Dragón",
            "🪂 Parapente au-dessus d’Iquique",
            "🤿 Plongée & Snorkeling",
            "🧗 Rappel & Randonnée",
            "🧘 Yoga sur la plage",
          ],
        },
        pt: {
          pageTitle: "Atividades - Jallalla Turismo de Aventura",
          title: "Nossas Atividades",
          desc1: [
            "🏂 Sandboard no Cerro Dragón",
            "🪂 Parapente sobre Iquique",
            "🤿 Mergulho e Snorkel",
            "🧗 Rapel e Trekking",
            "🧘 Yoga na praia",
          ],
        },
        de: {
          pageTitle: "Aktivitäten - Jallalla Abenteuertourismus",
          title: "Unsere Aktivitäten",
          desc1: [
            "🏂 Sandboarding am Cerro Dragón",
            "🪂 Paragliding über Iquique",
            "🤿 Tauchen & Schnorcheln",
            "🧗 Abseilen & Trekking",
            "🧘 Yoga am Strand",
          ],
        },
      },

      // -------------------
      // GALLERY
      // -------------------
      gallery: {
        es: { pageTitle: "Galería - Jallalla Turismo Aventura", title: "Nuestra Galería" },
        en: { pageTitle: "Gallery - Jallalla Adventure Tourism", title: "Our Gallery" },
        fr: { pageTitle: "Galerie - Jallalla Tourisme Aventure", title: "Notre Galerie" },
        pt: { pageTitle: "Galeria - Jallalla Turismo de Aventura", title: "Nossa Galeria" },
        de: { pageTitle: "Galerie - Jallalla Abenteuertourismus", title: "Unsere Galerie" },
      },

      // -------------------
      // CONTACT
      // -------------------
      contact: {
        es: { pageTitle: "Contacto - Jallalla Turismo Aventura", title: "Contacto" },
        en: { pageTitle: "Contact - Jallalla Adventure Tourism", title: "Contact Us" },
        fr: { pageTitle: "Contact - Jallalla Tourisme Aventure", title: "Contact" },
        pt: { pageTitle: "Contato - Jallalla Turismo de Aventura", title: "Contato" },
        de: { pageTitle: "Kontakt - Jallalla Abenteuertourismus", title: "Kontakt" },
      },
    },
  };

  // ---- Aplicar traducciones ----
  function applyI18n(lang) {
    const page = getPageKey();
    const safeLang = I18N.common[lang] ? lang : "es";

    // Comunes (navbar/footer)
    Object.entries(I18N.common[safeLang]).forEach(([id, text]) => setText(id, text));

    // Página actual
    const pageDict = (I18N.pages[page] && I18N.pages[page][safeLang]) || {};
    Object.entries(pageDict).forEach(([id, text]) => {
      if (id === "pageTitle" && typeof text === "string") {
        document.title = text; 
      } else {
        setText(id, text);
      }
    });

    // lang en <html>
    try { document.documentElement.setAttribute("lang", safeLang); } catch (_) {}
  }

  // ---- Inicializar ----
  function initLang() {
    const select = $("language");
    const browserLang = (navigator.language || "es").slice(0, 2).toLowerCase();
    const initial = localStorage.getItem("lang") || (I18N.common[browserLang] ? browserLang : "es");

    if (select) {
      select.value = initial;
      select.addEventListener("change", (e) => {
        const lang = e.target.value;
        localStorage.setItem("lang", lang);
        applyI18n(lang);
      });
    }

    applyI18n(initial);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLang);
  } else {
    initLang();
  }
})();
