import { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useAuthContext } from 'src/auth/hooks';
import { SplashScreen } from 'src/components/loading-screen';

import AuthMinimalLayout from 'src/layouts/auth/minimal';

// ----------------------------------------------------------------------

const StoreSetupPage = lazy(() => import('src/pages/onboarding/store-setup'));

// ----------------------------------------------------------------------

// Lightweight guard: only checks authentication, NOT store setup status.
// AuthGuard can't be used here because it redirects to /onboarding/store-setup
// when the store isn't set up, creating an infinite loop on this page.
function OnboardingGuard({ children }) {
  const { loading } = useAuthContext();

  if (loading) {
    return <SplashScreen />;
  }

  return <OnboardingGuardContainer>{children}</OnboardingGuardContainer>;
}

OnboardingGuard.propTypes = {
  children: PropTypes.node,
};

function OnboardingGuardContainer({ children }) {
  const router = useRouter();
  const { authenticated } = useAuthContext();
  const [checked, setChecked] = useState(false);

  const check = useCallback(() => {
    if (!authenticated) {
      const returnTo = window.location.pathname + window.location.search;
      const searchParams = new URLSearchParams({ returnTo }).toString();
      router.replace(`${paths.auth.jwt.login}?${searchParams}`);
      return;
    }
    setChecked(true);
  }, [authenticated, router]);

  useEffect(() => {
    check();
  }, [check]);

  if (!checked) {
    return null;
  }

  return <>{children}</>;
}

OnboardingGuardContainer.propTypes = {
  children: PropTypes.node,
};

// ----------------------------------------------------------------------

export const onboardingRoutes = [
  {
    path: 'onboarding',
    children: [
      {
        path: 'store-setup',
        element: (
          <Suspense fallback={<SplashScreen />}>
            <OnboardingGuard>
              <AuthMinimalLayout maxWidth={960}>
                <StoreSetupPage />
              </AuthMinimalLayout>
            </OnboardingGuard>
          </Suspense>
        ),
      },
    ],
  },
];
