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

// Fix esbuild __esm init ordering bug in pre-bundled MUI chunks.
// esbuild splits MUI into chunks where createTheme_default is imported
// but init_createTheme() is never called, leaving it undefined.
// This plugin patches the pre-bundled output to add the missing init call.
function fixMuiEsbuildInit() {
  return {
    name: 'fix-mui-esbuild-init',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('.vite/deps/chunk-')) return;
      if (!code.includes('createTheme_default') || code.includes('init_createTheme')) return;

      // Add init_createTheme to the import that has createTheme_default
      let patched = code.replace(
        /import\s*\{([^}]*\bcreateTheme_default\b[^}]*)\}\s*from\s*"([^"]+)"/,
        (match, imports, source) => {
          if (imports.includes('init_createTheme')) return match;
          return `import {${imports},\n  init_createTheme\n} from "${source}"`;
        }
      );

      if (patched === code) return; // no import found to patch

      // Insert init_createTheme() call before the first use of createTheme_default
      patched = patched.replace(
        /^(.*?)(var \w+ = createTheme_default\(\))/m,
        '$1init_createTheme();\n$2'
      );

      return patched;
    },
  };
}

// ----------------------------------------------------------------------

export default defineConfig(() => ({
    plugins: [
      fixMuiEsbuildInit(),
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
            'vendor-motion': ['framer-motion'],
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
