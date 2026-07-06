import { Navigate, useRoutes } from 'react-router-dom';

import { paths } from 'src/routes/paths';
import { authRoutes } from './auth';
import { mainRoutes } from './main';
import { dashboardRoutes } from './dashboard';
import { onboardingRoutes } from './onboarding';
import { impersonateRoutes } from './impersonate';

// ----------------------------------------------------------------------

export default function Router() {
  return useRoutes([
    // Redirect root to login page
    {
      path: '/',
      element: <Navigate to={paths.auth.jwt.login} replace />,
    },

    // Main routes
    ...mainRoutes,
    // Auth routes
    ...authRoutes,

    // Impersonation landing (public, no auth-guard)
    ...impersonateRoutes,

    // Onboarding routes
    ...onboardingRoutes,

    // Dashboard routes
    ...dashboardRoutes,

    // No match 404
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}
