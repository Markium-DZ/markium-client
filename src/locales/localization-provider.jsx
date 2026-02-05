import PropTypes from 'prop-types';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider as MuiLocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

// date-fns adapter locales (loaded lazily via this component)
import { fr as frFRAdapter, enUS as enUSAdapter, arSA as arSAAdapter } from 'date-fns/locale';

import { useLocales } from './use-locales';

// ----------------------------------------------------------------------

const adapterLocaleMap = {
  en: enUSAdapter,
  fr: frFRAdapter,
  ar: arSAAdapter,
};

export default function LocalizationProvider({ children }) {
  const { currentLang } = useLocales();

  return (
    <MuiLocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={adapterLocaleMap[currentLang.value] || arSAAdapter}
    >
      {children}
    </MuiLocalizationProvider>
  );
}

LocalizationProvider.propTypes = {
  children: PropTypes.node,
};
