// Curated starter themes for the Store Theme gallery. Applying one loads its
// palette + section layout into the editor and the live preview; nothing is
// persisted until the merchant hits Save (so trying a theme is non-destructive).
//
// Section settings use the same shape the editor stores: localized fields are
// { ar, en, fr } maps; everything else is a plain value. Keys must match the
// backend SectionCatalog (hero-v1, image-banner-v1, products-grid-v1).
//
// `swatch` is the theme's primary colour; the gallery renders a concrete
// mini-storefront mockup from it plus the hero copy (see ThemeCardPreview).

const DEFAULT_BANNER =
  'https://pub-3ceebe22515549368685ef8994607425.r2.dev/store-front-default-home-image/desktop.png';

// Localized-string helper: L(arabic, english, french)
const L = (ar, en, fr) => ({ ar, en, fr });

// Mirrors the storefront's src/theme/styles.ts — used to render the gallery
// mockup in the actual theme font + corner radius (the dashboard loads these
// font families in index.html).
export const STYLE_PRESETS = {
  editorial: { font: "'Fraunces', Georgia, serif", radius: 14 },
  minimal: { font: "'Geist', system-ui, sans-serif", radius: 4 },
  bold: { font: "'Space Grotesk', system-ui, sans-serif", radius: 6 },
  soft: { font: "'Baloo 2', system-ui, sans-serif", radius: 22 },
};

const hero = (settings) => ({ type: 'hero-v1', enabled: true, settings });
const banner = (settings) => ({ type: 'image-banner-v1', enabled: true, settings });
const grid = () => ({ type: 'products-grid-v1', enabled: true, settings: {} });

export const STORE_THEMES = [
  {
    id: 'minimal',
    style: 'minimal',
    palette: 'graphite',
    swatch: '#454A53',
    sections: [
      hero({
        eyebrow: L('مجموعة جديدة', 'New in', 'Nouveauté'),
        headline: L('أناقة بسيطة', 'Simply refined', 'La simplicité'),
        subhead: L(
          'منتجات مختارة بعناية بتصميم عصري وأنيق.',
          'Carefully chosen pieces with a clean, modern feel.',
          'Des pièces choisies avec soin, au style épuré.'
        ),
        cta_text: L('تسوق الآن', 'Shop now', 'Acheter'),
        cta_link: '/products',
        layout: 'split',
      }),
      grid(),
    ],
  },
  {
    id: 'bold',
    style: 'bold',
    palette: 'crimson',
    swatch: '#DE4A40',
    sections: [
      hero({
        eyebrow: L('عرض محدود', 'Limited drop', 'Offre limitée'),
        headline: L('اطلب الآن', 'Make it yours', 'Faites-vous plaisir'),
        subhead: L(
          'أفضل المنتجات بأسعار لا تُقاوم.',
          'Standout products at prices you will love.',
          'Des produits phares à prix imbattables.'
        ),
        cta_text: L('اكتشف', 'Discover', 'Découvrir'),
        cta_link: '/products',
        layout: 'overlap',
      }),
      banner({
        image: DEFAULT_BANNER,
        caption: L('تخفيضات الموسم', 'Season sale', 'Soldes de saison'),
        link: '/products',
        height: 'medium',
      }),
      grid(),
    ],
  },
  {
    id: 'elegant',
    style: 'editorial',
    palette: 'violet',
    swatch: '#9A69CF',
    sections: [
      hero({
        eyebrow: L('مختارات', 'Curated', 'Sélection'),
        headline: L('أناقة خالدة', 'Timeless elegance', 'Élégance intemporelle'),
        subhead: L(
          'قطع فاخرة تروي قصتك الخاصة.',
          'Refined pieces that tell your story.',
          'Des pièces raffinées qui racontent votre histoire.'
        ),
        cta_text: L('استكشف', 'Explore', 'Explorer'),
        cta_link: '/products',
        layout: 'overlap',
      }),
      grid(),
      banner({
        image: DEFAULT_BANNER,
        caption: L('صُنع بعناية', 'Made with care', 'Fait avec soin'),
        link: '/products',
        height: 'short',
      }),
    ],
  },
  {
    id: 'warm',
    style: 'soft',
    palette: 'terracotta',
    swatch: '#DB7150',
    sections: [
      hero({
        eyebrow: L('أهلاً بك', 'Welcome', 'Bienvenue'),
        headline: L('دفء وأصالة', 'Warm & authentic', 'Chaleur & authenticité'),
        subhead: L(
          'منتجات تجلب الدفء إلى كل يوم.',
          'Products that bring warmth to every day.',
          'Des produits qui réchauffent le quotidien.'
        ),
        cta_text: L('تسوق', 'Shop', 'Boutique'),
        cta_link: '/products',
        layout: 'split',
      }),
      banner({
        image: DEFAULT_BANNER,
        caption: L('جديدنا', 'Just in', 'Nouveautés'),
        link: '/products',
        height: 'medium',
      }),
      grid(),
    ],
  },
  {
    id: 'fresh',
    style: 'minimal',
    palette: 'emerald',
    swatch: '#24A578',
    sections: [
      hero({
        eyebrow: L('طبيعي', 'Natural', 'Naturel'),
        headline: L('نضارة كل يوم', 'Fresh every day', 'La fraîcheur au quotidien'),
        subhead: L(
          'منتجات طبيعية بجودة عالية.',
          'Natural products, thoughtfully sourced.',
          'Des produits naturels, sélectionnés avec soin.'
        ),
        cta_text: L('تسوق الآن', 'Shop now', 'Acheter'),
        cta_link: '/products',
        layout: 'split',
      }),
      grid(),
      banner({
        image: DEFAULT_BANNER,
        caption: L('وصل حديثاً', 'New arrivals', 'Nouveautés'),
        link: '/products',
        height: 'short',
      }),
    ],
  },
  {
    id: 'ocean',
    style: 'bold',
    palette: 'ocean',
    swatch: '#3E8FDE',
    sections: [
      hero({
        eyebrow: L('مجموعتنا', 'Our collection', 'Notre collection'),
        headline: L('اكتشف المزيد', 'Discover more', 'Découvrez plus'),
        subhead: L(
          'تجربة تسوق سلسة وممتعة.',
          'A smooth, effortless shopping experience.',
          'Une expérience d’achat fluide et agréable.'
        ),
        cta_text: L('ابدأ الآن', 'Get started', 'Commencer'),
        cta_link: '/products',
        layout: 'overlap',
      }),
      grid(),
    ],
  },
  {
    id: 'rose',
    style: 'soft',
    palette: 'rose',
    swatch: '#DB5B8B',
    sections: [
      hero({
        eyebrow: L('بلمسة أنثوية', 'With love', 'Avec amour'),
        headline: L('جمالك يبدأ هنا', 'Your beauty starts here', 'Votre beauté commence ici'),
        subhead: L(
          'منتجات مختارة تبرز جمالك.',
          'Handpicked pieces to make you shine.',
          'Des pièces choisies pour vous sublimer.'
        ),
        cta_text: L('اكتشفي', 'Discover', 'Découvrir'),
        cta_link: '/products',
        layout: 'overlap',
      }),
      banner({
        image: DEFAULT_BANNER,
        caption: L('عروض خاصة', 'Special offers', 'Offres spéciales'),
        link: '/products',
        height: 'medium',
      }),
      grid(),
    ],
  },
];
