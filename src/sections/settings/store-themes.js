// Curated starter themes for the Store Theme gallery. Applying one loads its
// palette + design style + section layout into the editor and the live
// preview; nothing is persisted until the merchant hits Save.
//
// HONESTY RULE (merchant feedback 2026-07-05): a theme must differ
// STRUCTURALLY — hero structure, composition, imagery — not just by colour,
// font, or copy. Colour alone is the Appearance palette picker's job.
// Themes: hero structures + chrome structures (appearance.structure) + 
// compositions + image worlds.
//
// Section settings use the editor's stored shape: localized fields are
// { ar, en, fr } maps. Keys must match the backend SectionCatalog.

const DEFAULT_BANNER =
  'https://pub-3ceebe22515549368685ef8994607425.r2.dev/store-front-default-home-image/desktop.png';

// Proven image URLs (same set the storefront's category defaults use).
const IMG = {
  studio: 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=1800&q=85', // minimal interior
  atelier: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1800&q=85', // jewellery atelier
  home: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1800&q=85', // warm living room
  furniture: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=1800&q=85',
};

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
const marquee = (settings) => ({ type: 'marquee-strip-v1', enabled: true, settings });
const richText = (settings) => ({ type: 'rich-text-v1', enabled: true, settings });
const grid = () => ({ type: 'products-grid-v1', enabled: true, settings: {} });

export const STORE_THEMES = [
  {
    // Split hero (image beside text), studio imagery, nothing but products.
    id: 'minimal',
    thumb: '/assets/themes/minimal.jpg',
    style: 'minimal',
    structure: 'editorial',
    palette: 'graphite',
    swatch: '#454A53',
    sections: [
      hero({
        image_desktop: IMG.studio,
        eyebrow: L('مجموعة مختارة', 'Selected works', 'Sélection'),
        headline: L('أقل، لكن أفضل', 'Less, but better', 'Moins, mais mieux'),
        subhead: L(
          'قطع مختارة بعناية. لا شيء زائد.',
          'Carefully chosen pieces. Nothing extra.',
          'Des pièces choisies avec soin. Rien de superflu.'
        ),
        cta_text: L('تسوق', 'Shop', 'Boutique'),
        cta_link: '/products',
        layout: 'split',
      }),
      grid(),
    ],
  },
  {
    // Statement hero: flat brand-colour typographic band — no photo at all —
    // with an announcement marquee. Structurally unlike everything else.
    id: 'bold',
    thumb: '/assets/themes/bold.jpg',
    style: 'bold',
    structure: 'editorial',
    palette: 'crimson',
    swatch: '#DE4A40',
    sections: [
      marquee({
        text: L('توصيل لكل الولايات • الدفع عند الاستلام', 'Delivery to all wilayas • Cash on delivery', 'Livraison 58 wilayas • Paiement à la livraison'),
        speed: 'medium',
      }),
      hero({
        eyebrow: L('عرض محدود', 'Limited drop', 'Offre limitée'),
        headline: L('اطلب الآن', 'Grab it now', 'Foncez'),
        subhead: L(
          'أفضل المنتجات بأسعار لا تُقاوم.',
          'Standout products at prices you will love.',
          'Des produits phares à prix imbattables.'
        ),
        cta_text: L('اكتشف', 'Discover', 'Découvrir'),
        cta_link: '/products',
        layout: 'statement',
      }),
      grid(),
    ],
  },
  {
    // Full-bleed editorial photo hero, serif type, banner below the grid.
    id: 'elegant',
    thumb: '/assets/themes/elegant.jpg',
    style: 'editorial',
    structure: 'editorial',
    palette: 'violet',
    swatch: '#9A69CF',
    sections: [
      hero({
        image_desktop: IMG.atelier,
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
    // Split hero with warm interior imagery, rounded type, story-led
    // composition: banner + products + an "our story" text block.
    id: 'warm',
    thumb: '/assets/themes/warm.jpg',
    style: 'soft',
    structure: 'editorial',
    palette: 'terracotta',
    swatch: '#DB7150',
    sections: [
      hero({
        image_desktop: IMG.home,
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
        image: IMG.furniture,
        caption: L('جديدنا', 'Just in', 'Nouveautés'),
        link: '/products',
        height: 'medium',
      }),
      grid(),
      richText({
        heading: L('قصتنا', 'Our story', 'Notre histoire'),
        body: L(
          'نختار كل قطعة بعناية لتدوم وتُحب.',
          'We pick every piece with care, to last and to be loved.',
          'Chaque pièce est choisie avec soin, pour durer et être aimée.'
        ),
        align: 'center',
      }),
    ],
  },
  {
    // Playful chrome (structure): solid brand banner header, wavy brand
    // footer, white buy-button product cards — plus a flat statement hero.
    // Structurally unlike every editorial-chrome theme.
    id: 'playful',
    thumb: '/assets/themes/playful.jpg',
    style: 'soft',
    palette: 'emerald',
    swatch: '#24A578',
    structure: 'playful',
    sections: [
      hero({
        eyebrow: L('جديد هنا؟', 'New here?', 'Nouveau ici ?'),
        headline: L('تسوق بفرح', 'Shop happy!', 'Achetez heureux !'),
        subhead: L(
          'منتجات ممتعة، توصيل سريع، والدفع عند الباب.',
          'Fun products, fast delivery, pay at your door.',
          'Des produits fun, livraison rapide, paiement à la porte.'
        ),
        cta_text: L('ابدأ التسوق', 'Start shopping', 'Commencer'),
        cta_link: '/products',
        layout: 'statement',
      }),
      marquee({
        text: L('توصيل لكل الولايات • الدفع عند الاستلام', 'Delivery to all 58 wilayas • Cash on delivery', 'Livraison 58 wilayas • Paiement à la livraison'),
        speed: 'medium',
      }),
      grid(),
    ],
  },
];
