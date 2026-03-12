import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // ✅ autoUpdate: Service Worker se actualiza automáticamente
        registerType: 'autoUpdate',
        // ✅ Configuración del manifest
        manifest: {
          name: 'IAhorra CERTUS 2.0',
          short_name: 'IAhorra',
          description: 'Solución EdFinTech con Inteligencia Artificial Generativa para educación financiera',
          theme_color: '#0D1B4B',
          background_color: '#EEF2FB',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait-primary',
          // ✅ Iconos - IMPORTANTE: Asegúrate de que /logo.png exista en /public
          icons: [
            {
              src: '/logo.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/logo-maskable.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/logo-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          categories: ['finance', 'education'],
          screenshots: [
            {
              src: '/screenshot-1.png',
              sizes: '540x720',
              type: 'image/png',
              form_factor: 'narrow'
            }
          ],
          shortcuts: [
            {
              name: 'Chat IA',
              short_name: 'Chat',
              description: 'Abre el asistente financiero de IA',
              url: '/chat',
              icons: [
                {
                  src: '/logo.png',
                  sizes: '192x192',
                  type: 'image/png'
                }
              ]
            },
            {
              name: 'Mis Metas',
              short_name: 'Metas',
              description: 'Accede a tus metas financieras',
              url: '/metas',
              icons: [
                {
                  src: '/logo.png',
                  sizes: '192x192',
                  type: 'image/png'
                }
              ]
            }
          ]
        },
        // ✅ Configuración de Workbox (caché de recursos)
        workbox: {
          // ✅ Estrategia: Network first, fallback to cache
          runtimeCaching: [
            {
              // Cache de la API de Gemini
              urlPattern: /^https:\/\/generativelanguage\.googleapis\.com/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'gemini-api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 24 * 60 * 60 // 24 horas
                }
              }
            },
            {
              // Cache de Firebase
              urlPattern: /^https:\/\/(firestore\.googleapis\.com|firebase.*\.com)/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firebase-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 12 * 60 * 60 // 12 horas
                }
              }
            },
            {
              // Cache de recursos estáticos (CSS, JS, imágenes)
              urlPattern: /^https:\/\/.*\.(js|css|png|jpg|jpeg|svg|woff|woff2)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'static-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 30 * 24 * 60 * 60 // 30 días
                }
              }
            }
          ],
          // ✅ Archivos que SIEMPRE se cachean en la instalación
          cleanupOutdatedCaches: true,
          skipWaiting: true
        },
        // ✅ Configuración del cliente
        client: {
          installPrompt: true,
          // ✅ Notificar cuando hay una nueva versión
          periodicSyncForUpdates: 24 * 60 * 60 * 1000 // Cada 24 horas
        },
        // ✅ Archivos que se generan
        outDir: 'dist'
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
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
