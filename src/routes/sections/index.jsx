import { Navigate, useRoutes } from 'react-router-dom';

import { paths } from 'src/routes/paths';
import { authRoutes } from './auth';
import { mainRoutes } from './main';
import { dashboardRoutes } from './dashboard';

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

    // Dashboard routes
    ...dashboardRoutes,

    // No match 404
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}
