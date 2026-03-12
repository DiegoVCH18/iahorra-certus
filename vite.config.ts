import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'IAhorra CERTUS',
          short_name: 'IAhorra',
          description: 'Educación Financiera del Futuro',
          theme_color: '#0D1B4B',
          background_color: '#EEF2FB',
          display: 'standalone',
          version: '1.0.0-20260312',
          icons: [
            {
              src: '/01_Brand_Core/isotipo/iahorra-isotipo-principal.png?t=20260312',
              sizes: '72x72',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/01_Brand_Core/isotipo/iahorra-isotipo-principal.png?t=20260312',
              sizes: '96x96',
              type: 'image/png'
            },
            {
              src: '/01_Brand_Core/isotipo/iahorra-isotipo-principal.png?t=20260312',
              sizes: '128x128',
              type: 'image/png'
            },
            {
              src: '/01_Brand_Core/isotipo/iahorra-isotipo-principal.png?t=20260312',
              sizes: '144x144',
              type: 'image/png'
            },
            {
              src: '/01_Brand_Core/isotipo/iahorra-isotipo-principal.png?t=20260312',
              sizes: '152x152',
              type: 'image/png'
            },
            {
              src: '/01_Brand_Core/isotipo/iahorra-isotipo-principal.png?t=20260312',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/01_Brand_Core/isotipo/iahorra-isotipo-principal.png?t=20260312',
              sizes: '384x384',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/01_Brand_Core/isotipo/iahorra-isotipo-principal.png?t=20260312',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/01_Brand_Core/isotipo/iahorra-isotipo-principal.png?t=20260312',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': 'process.env.GEMINI_API_KEY',
      'process.env.API_KEY': 'process.env.API_KEY',
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
