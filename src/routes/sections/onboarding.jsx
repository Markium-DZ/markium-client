import { lazy, Suspense } from 'react';

import { AuthGuard } from 'src/auth/guard';
import AuthMinimalLayout from 'src/layouts/auth/minimal';

import { SplashScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

const StoreSetupPage = lazy(() => import('src/pages/onboarding/store-setup'));

// ----------------------------------------------------------------------

export const onboardingRoutes = [
  {
    path: 'onboarding',
    children: [
      {
        path: 'store-setup',
        element: (
          <Suspense fallback={<SplashScreen />}>
            <AuthGuard>
              <AuthMinimalLayout maxWidth={960}>
                <StoreSetupPage />
              </AuthMinimalLayout>
            </AuthGuard>
          </Suspense>
        ),
      },
    ],
  },
];
