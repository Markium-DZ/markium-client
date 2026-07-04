// Curated starter themes for the Store Theme gallery. Applying one loads its
// palette + section layout into the editor and the live preview; nothing is
// persisted until the merchant hits Save (so trying a theme is non-destructive).
//
// Section settings use the same shape the editor stores: localized fields are
// { ar, en, fr } maps; everything else is a plain value. Keys must match the
// backend SectionCatalog (hero-v1, image-banner-v1, products-grid-v1).

const DEFAULT_BANNER =
  'https://pub-3ceebe22515549368685ef8994607425.r2.dev/store-front-default-home-image/desktop.png';

// Localized-string helper: L(arabic, english, french)
const L = (ar, en, fr) => ({ ar, en, fr });

export const STORE_THEMES = [
  {
    id: 'minimal',
    palette: 'graphite',
    swatch: '#454A53',
    sections: [
      {
        type: 'hero-v1',
        enabled: true,
        settings: {
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
        },
      },
      { type: 'products-grid-v1', enabled: true, settings: {} },
    ],
  },
  {
    id: 'bold',
    palette: 'crimson',
    swatch: '#DE4A40',
    sections: [
      {
        type: 'hero-v1',
        enabled: true,
        settings: {
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
        },
      },
      {
        type: 'image-banner-v1',
        enabled: true,
        settings: {
          image: DEFAULT_BANNER,
          caption: L('تخفيضات الموسم', 'Season sale', 'Soldes de saison'),
          link: '/products',
          height: 'medium',
        },
      },
      { type: 'products-grid-v1', enabled: true, settings: {} },
    ],
  },
  {
    id: 'elegant',
    palette: 'violet',
    swatch: '#9A69CF',
    sections: [
      {
        type: 'hero-v1',
        enabled: true,
        settings: {
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
        },
      },
      { type: 'products-grid-v1', enabled: true, settings: {} },
      {
        type: 'image-banner-v1',
        enabled: true,
        settings: {
          image: DEFAULT_BANNER,
          caption: L('صُنع بعناية', 'Made with care', 'Fait avec soin'),
          link: '/products',
          height: 'short',
        },
      },
    ],
  },
  {
    id: 'warm',
    palette: 'terracotta',
    swatch: '#DB7150',
    sections: [
      {
        type: 'hero-v1',
        enabled: true,
        settings: {
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
        },
      },
      {
        type: 'image-banner-v1',
        enabled: true,
        settings: {
          image: DEFAULT_BANNER,
          caption: L('جديدنا', 'Just in', 'Nouveautés'),
          link: '/products',
          height: 'medium',
        },
      },
      { type: 'products-grid-v1', enabled: true, settings: {} },
    ],
  },
];
