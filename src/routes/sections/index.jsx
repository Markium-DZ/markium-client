import { Navigate, useRoutes } from 'react-router-dom';

import MainLayout from 'src/layouts/main';

import { paths } from 'src/routes/paths';
import { authRoutes } from './auth';
import { authDemoRoutes } from './auth-demo';
import { HomePage, mainRoutes } from './main';
import { dashboardRoutes } from './dashboard';
import { componentsRoutes } from './components';

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
    ...authDemoRoutes,

    // Dashboard routes
    ...dashboardRoutes,



    // Components routes
    ...componentsRoutes,

    // No match 404
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}
