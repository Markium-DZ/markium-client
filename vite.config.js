import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import checker from 'vite-plugin-checker';

// ----------------------------------------------------------------------

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Derive PostHog query host from the capture host
  const posthogHost = env.VITE_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';
  const posthogQueryHost = posthogHost.replace('://eu.i.', '://eu.').replace('://us.i.', '://us.');

  return {
    plugins: [
      react(),
      checker({
        overlay: {
          initialIsOpen: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '~': `${process.cwd()}/node_modules`,
        src: '/src',
      },
    },
    server: {
      port: 3031,
      proxy: {
        '/posthog-api': {
          target: posthogQueryHost,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/posthog-api/, ''),
          secure: true,
        },
      },
    },
    preview: {
      port: 3031,
    },
  };
});
