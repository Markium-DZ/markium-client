
/* eslint-disable perfectionist/sort-imports */
import 'src/global.css';

// i18n
import 'src/locales/i18n';

// ----------------------------------------------------------------------

import { lazy, Suspense } from 'react';

import Router from 'src/routes/sections';

import ThemeProvider from 'src/theme';

import { useScrollToTop } from 'src/hooks/use-scroll-to-top';

import ProgressBar from 'src/components/progress-bar';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import SnackbarProvider from 'src/components/snackbar/snackbar-provider';
import { SettingsProvider } from 'src/components/settings';
import { LiveRegionProvider } from 'src/components/live-region';

import { AuthProvider } from 'src/auth/context/jwt';

// Lazy-load components not needed for the initial login page render
const LocalizationProvider = lazy(() => import('src/locales/localization-provider'));
const SettingsDrawer = lazy(() => import('src/components/settings/drawer/settings-drawer'));
const CheckoutProvider = lazy(() =>
  import('src/sections/checkout/context').then((m) => ({ default: m.CheckoutProvider }))
);
// import { AuthProvider } from 'src/auth/context/auth0';
// import { AuthProvider } from 'src/auth/context/amplify';
// import { AuthProvider } from 'src/auth/context/firebase';
// import { AuthProvider } from 'src/auth/context/supabase';

// ----------------------------------------------------------------------

export default function App() {
  useScrollToTop();

  return (
    <AuthProvider>
      <SettingsProvider
        defaultSettings={{
          themeMode: 'light', // 'light' | 'dark'
          themeDirection: 'ltr', //  'rtl' | 'ltr'
          themeContrast: 'default', // 'default' | 'bold'
          themeLayout: 'vertical', // 'vertical' | 'horizontal' | 'mini'
          themeColorPresets: 'default', // 'default' | 'cyan' | 'purple' | 'blue' | 'orange' | 'red'
          themeStretch: false,
        }}
      >
        <ThemeProvider>
          <LiveRegionProvider>
          <MotionLazy>
            <SnackbarProvider>
              <Suspense fallback={null}>
                <SettingsDrawer />
              </Suspense>
              <ProgressBar />
              <Suspense fallback={<ProgressBar />}>
                <CheckoutProvider>
                  <LocalizationProvider>
                    <Router />
                  </LocalizationProvider>
                </CheckoutProvider>
              </Suspense>
            </SnackbarProvider>
          </MotionLazy>
          </LiveRegionProvider>
        </ThemeProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
