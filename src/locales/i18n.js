import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { localStorageGetItem } from 'src/utils/storage-available';

import { defaultLang } from './config-lang';

// French (default) + Arabic (fallback) are always needed — static imports avoid waterfall
import translationFr from './langs/fr.json';
import translationAr from './langs/ar.json';

// ----------------------------------------------------------------------

const lng = localStorageGetItem('i18nextLng', defaultLang.value);

// Other languages loaded on demand
const langLoaders = {
  en: () => import('./langs/en.json'),
  vi: () => import('./langs/vi.json'),
  cn: () => import('./langs/cn.json'),
};

const resources = {
  fr: { translations: translationFr },
  ar: { translations: translationAr },
};

// If active language is not French or Arabic, load it dynamically
if (!resources[lng] && langLoaders[lng]) {
  const data = await langLoaders[lng]();
  resources[lng] = { translations: data.default };
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
