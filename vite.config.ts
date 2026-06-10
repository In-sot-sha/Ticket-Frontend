import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Generates a self-signed cert so mobile browsers allow camera access.
    // On first visit your phone will show a "certificate not trusted" warning —
    // tap Advanced → Proceed (Android) or Show Details → visit anyway (iOS).
    basicSsl(),
  ],
  server: {
    host: true,    // bind to 0.0.0.0 — LAN devices can reach the dev server
    port: 5181,
    https: true,   // required for getUserMedia (camera) on mobile browsers
    proxy: {
      '/api': {
        target: 'http://localhost:33312',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
