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
          icons: [
            {
              src: '/01_Brand_Core/isotipo/iahorra-isotipo-dark.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any'
            },
            {
              src: '/02_Digital_App_PWA/pwa_icons/pwa-72x72.png',
              sizes: '72x72',
              type: 'image/png'
            },
            {
              src: '/02_Digital_App_PWA/pwa_icons/pwa-96x96.png',
              sizes: '96x96',
              type: 'image/png'
            },
            {
              src: '/02_Digital_App_PWA/pwa_icons/pwa-128x128.png',
              sizes: '128x128',
              type: 'image/png'
            },
            {
              src: '/02_Digital_App_PWA/pwa_icons/pwa-144x144.png',
              sizes: '144x144',
              type: 'image/png'
            },
            {
              src: '/02_Digital_App_PWA/pwa_icons/pwa-152x152.png',
              sizes: '152x152',
              type: 'image/png'
            },
            {
              src: '/02_Digital_App_PWA/pwa_icons/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/02_Digital_App_PWA/pwa_icons/pwa-384x384.png',
              sizes: '384x384',
              type: 'image/png'
            },
            {
              src: '/02_Digital_App_PWA/pwa_icons/pwa-512x512.png',
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
