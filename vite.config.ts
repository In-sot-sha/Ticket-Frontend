import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),

    // ── PWA ──────────────────────────────────────────────────────────────────
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/icon.svg'],

      manifest: {
        name:             'Eventify',
        short_name:       'Eventify',
        description:      'Discover and book tickets for events near you',
        start_url:        '/',
        scope:            '/',
        display:          'standalone',
        orientation:      'portrait',
        background_color: '#ffffff',
        theme_color:      '#f43f5e',
        categories:       ['entertainment', 'lifestyle'],
        icons: [
          {
            src:     '/icons/icon.svg',
            sizes:   'any',
            type:    'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name:        'Browse Events',
            short_name:  'Events',
            description: 'Browse upcoming events near you',
            url:         '/events',
            icons: [{ src: '/icons/icon.svg', sizes: 'any' }],
          },
          {
            name:        'My Tickets',
            short_name:  'Tickets',
            description: 'View your purchased tickets',
            url:         '/user/tickets',
            icons: [{ src: '/icons/icon.svg', sizes: 'any' }],
          },
          {
            name:        'Gate Scanner',
            short_name:  'Scanner',
            description: 'Scan attendee tickets at the gate',
            url:         '/scan-gate',
            icons: [{ src: '/icons/icon.svg', sizes: 'any' }],
          },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            // API — never cache, always fresh
            urlPattern: /^https?:\/\/.*\/api\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },

      devOptions: {
        enabled: false, // flip to true to test SW locally
        type: 'module',
      },
    }),
  ],

  server: {
    host:  true,   // 0.0.0.0 — LAN devices can reach the dev server
    port:  5181,
    // Vite 4 built-in self-signed cert — no plugin needed.
    // Mobile browsers need HTTPS for camera (getUserMedia).
    // On first visit your phone shows an "untrusted cert" warning;
    // tap Advanced → Proceed to accept it once.
    // https: true,
    proxy: {
      '/api': {
        target:       'http://localhost:33312',
        changeOrigin: true,
        secure:       false,
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
