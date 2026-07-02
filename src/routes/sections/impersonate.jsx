import { lazy, Suspense } from 'react';

import { SplashScreen } from 'src/components/loading-screen';

// Public, no auth-guard — landing page for admin-initiated impersonation links.
const ImpersonatePage = lazy(() => import('src/pages/impersonate'));

// ----------------------------------------------------------------------

export const impersonateRoutes = [
  {
    path: 'impersonate',
    element: (
      <Suspense fallback={<SplashScreen />}>
        <ImpersonatePage />
      </Suspense>
    ),
  },
];
