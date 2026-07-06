import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { PATH_AFTER_LOGIN } from 'src/config-global';

import { useAuthContext } from 'src/auth/hooks';
import { setSession } from 'src/auth/context/jwt/utils';

import { useSnackbar } from 'src/components/snackbar';
import { SplashScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------
// Public landing page for admin-initiated impersonation.
// Reads `?token=` from the query string, loads the merchant session the
// same way the app does on init (setSession + fetch current client),
// flags the session as impersonating, then lands on the dashboard.
// ----------------------------------------------------------------------

export default function ImpersonateView() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const { refreshUser } = useAuthContext();

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const token = searchParams.get('token');

    const bail = () => {
      setSession(null);
      enqueueSnackbar(t('impersonation_invalid_token'), { variant: 'error' });
      router.replace(paths.auth.jwt.login);
    };

    if (!token) {
      bail();
      return;
    }

    (async () => {
      try {
        // Same session bootstrap the app performs on init: store the
        // token, then load the current client (the "me" endpoint) to
        // populate localStorage['zaity-user-info'].
        setSession(token);

        const client = await refreshUser();

        if (!client) {
          bail();
          return;
        }

        sessionStorage.setItem('impersonating', '1');
        if (client?.name) {
          sessionStorage.setItem('impersonating_merchant', client.name);
        }

        router.replace(PATH_AFTER_LOGIN);
      } catch (error) {
        console.error('Impersonation failed:', error);
        bail();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <SplashScreen />;
}
