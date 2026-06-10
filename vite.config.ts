import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),

    // Self-signed HTTPS for LAN dev — lets mobile browsers allow camera
    basicSsl(),

    // ── PWA ──────────────────────────────────────────────────────────────────
    VitePWA({
      registerType: 'autoUpdate',      // silently updates SW in the background
      injectRegister: 'auto',          // injects the registration script automatically
      includeAssets: [
        'icons/icon.svg',
        'icons/*.png',
      ],

      // Web App Manifest
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

      // Workbox config — what gets cached and how
      workbox: {
        // Pre-cache the built JS/CSS/HTML shell
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],

        // Runtime caching rules
        runtimeCaching: [
          {
            // API calls → network-only (always fresh, never cached)
            urlPattern: /^https?:\/\/.*\/api\//,
            handler: 'NetworkOnly',
          },
          {
            // Google Fonts and CDN assets → stale-while-revalidate
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // Unsplash images → cache for 7 days
            urlPattern: /^https:\/\/images\.unsplash\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        // SPA fallback — serve index.html for all navigation requests
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },

      // Dev options — enable SW in development so you can test it
      devOptions: {
        enabled: false, // set to true to test SW locally (slows HMR)
        type: 'module',
      },
    }),
  ],

  server: {
    host:  true,    // bind to 0.0.0.0 — LAN devices can reach the dev server
    port:  5181,
    https: true,    // required for getUserMedia (camera) on mobile
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
