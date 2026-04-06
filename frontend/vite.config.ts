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
        name: 'ARFF Enterprise Command',
        short_name: 'ARFF Ops',
        description: 'Dashboard Operasional Pertolongan Kecelakaan Penerbangan dan Pemadam Kebakaran',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000
  }
})
