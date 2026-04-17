import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'HAIS - Hang Nadim ARFF Integrated System',
        short_name: 'HAIS',
        description: 'Hang Nadim ARFF Integrated System - Operational & Reporting',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        icons: [
          {
            src: '/theme/logo-arff.jpg',
            sizes: 'any',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('leaflet')) {
              return 'leaflet';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})
