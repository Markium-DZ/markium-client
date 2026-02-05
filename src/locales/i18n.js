import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { localStorageGetItem } from 'src/utils/storage-available';

import { defaultLang } from './config-lang';

// ----------------------------------------------------------------------

const lng = localStorageGetItem('i18nextLng', defaultLang.value);

// Each language JSON becomes a separate chunk — only the active one is fetched
const langLoaders = {
  en: () => import('./langs/en.json'),
  fr: () => import('./langs/fr.json'),
  vi: () => import('./langs/vi.json'),
  cn: () => import('./langs/cn.json'),
  ar: () => import('./langs/ar.json'),
};

// Only load active language + fallback (top-level await requires target: esnext)
const resources = {};
const activeData = await (langLoaders[lng] ?? langLoaders.ar)();
resources[lng] = { translations: activeData.default };

if (lng !== 'ar') {
  const fallbackData = await langLoaders.ar();
  resources.ar = { translations: fallbackData.default };
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng,
    fallbackLng: 'ar',
    debug: false,
    ns: ['translations'],
    defaultNS: 'translations',
    interpolation: {
      escapeValue: false,
    },
  });

// Lazy-load additional languages on demand (called when user switches language)
i18n.loadLanguageAsync = async (lang) => {
  if (i18n.hasResourceBundle(lang, 'translations')) return;
  const loader = langLoaders[lang];
  if (loader) {
    const data = await loader();
    i18n.addResourceBundle(lang, 'translations', data.default, true, true);
  }
};

export default i18n;
