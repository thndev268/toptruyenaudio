import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { copyFileSync } from 'fs';

export default defineConfig(() => {
  return {
    root: './story-platform/frontend',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'copy-404',
        closeBundle() {
          // Copy index.html to 404.html for GitHub Pages SPA routing
          const indexPath = path.resolve(__dirname, 'dist/index.html');
          const indexPath404 = path.resolve(__dirname, 'dist/404.html');
          copyFileSync(indexPath, indexPath404);
          console.log('Copied index.html to 404.html for GitHub Pages SPA routing');
        },
      },
    ],
    build: {
      outDir: path.resolve(__dirname, 'dist'),
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './story-platform/frontend/src'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      allowedHosts: [
        'localhost',
        'toptruyenaudio.onrender.com',
        'toptruyenaudio.site',
        'www.toptruyenaudio.site',
      ],
    },
  };
});
