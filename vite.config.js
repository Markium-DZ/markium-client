import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import checker from 'vite-plugin-checker';

import { readFileSync, writeFileSync, unlinkSync } from 'fs';

// Inline small CSS into HTML to eliminate render-blocking stylesheet requests
function inlineCssPlugin() {
  let outDir;
  return {
    name: 'inline-css',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const htmlPath = path.resolve(outDir, 'index.html');
      let html = readFileSync(htmlPath, 'utf-8');
      const cssLinkRegex = /<link[^>]*href="\/?(assets\/[^"]+\.css)"[^>]*>/g;
      let match;
      while ((match = cssLinkRegex.exec(html)) !== null) {
        const cssRelPath = match[1];
        const cssPath = path.resolve(outDir, cssRelPath);
        try {
          const css = readFileSync(cssPath, 'utf-8');
          if (css.length < 60000) {
            html = html.replace(match[0], `<style>${css}</style>`);
            unlinkSync(cssPath);
          }
        } catch { /* skip if file not found */ }
      }
      writeFileSync(htmlPath, html);
    },
  };
}

// ----------------------------------------------------------------------

export default defineConfig(() => ({
    plugins: [
      react(),
      checker({
        overlay: {
          initialIsOpen: false,
        },
      }),
      inlineCssPlugin(),
    ],
    build: {
      target: 'esnext',
      modulePreload: { polyfill: false },
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-mui': ['@mui/material', '@mui/system'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '~': `${process.cwd()}/node_modules`,
        src: '/src',
      },
    },
    server: {
      port: 3031,
    },
    preview: {
      port: 3031,
    },
  }));
