import { useCallback } from 'react';


import { localStorageGetItem } from 'src/utils/storage-available';

import { useSettingsContext } from 'src/components/settings';

import { allLangs  , allLangs2, defaultLang } from './config-lang';
import { useTranslation } from 'react-i18next';

// ----------------------------------------------------------------------

export function useLocales() {
  const langStorage = localStorageGetItem('i18nextLng');
  const currentLang = allLangs.find((lang) => lang.value === langStorage) || defaultLang;

  return {
    allLangs,
    currentLang,
  };
}

export function useLocales2(english,arabic) {
  const langStorage = localStorageGetItem('i18nextLng');
  const langs = allLangs2(english,arabic);
  return {
    langs,
  };
}

// ----------------------------------------------------------------------

export function useTranslate() {
  const { t, i18n, ready } = useTranslation();

  const settings = useSettingsContext();

  const onChangeLang = useCallback(
    async (newlang) => {
      // Lazy-load the language bundle before switching
      await i18n.loadLanguageAsync?.(newlang);
      i18n.changeLanguage(newlang);
      settings.onChangeDirectionByLang(newlang);
    },
    [i18n, settings]
  );

  return {
    t,
    i18n,
    ready,
    onChangeLang,
  };
}
