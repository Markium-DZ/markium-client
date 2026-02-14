import { lazy, Suspense } from 'react';

import { PhoneVerifiedGuard } from 'src/auth/guard';
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
            <PhoneVerifiedGuard>
              <AuthMinimalLayout maxWidth={960}>
                <StoreSetupPage />
              </AuthMinimalLayout>
            </PhoneVerifiedGuard>
          </Suspense>
        ),
      },
    ],
  },
];
