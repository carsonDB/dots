import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/openrouter\.ai\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Dots',
        short_name: 'Dots',
        description: 'AI-powered search with expandable text segments for deep topic exploration',
        theme_color: '#4F46E5',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/?utm_source=pwa',
        scope: '/',
        display_override: ['window-controls-overlay', 'standalone'],
        launch_handler: {
          client_mode: 'navigate-existing'
        },
        shortcuts: [
          {
            name: 'New Search',
            short_name: 'Search',
            description: 'Start a new AI search',
            url: '/?action=search',
            icons: [
              {
                src: 'dots_logo.png',
                sizes: 'any',
                type: 'image/png'
              }
            ]
          }
        ],
        icons: [
          {
            src: 'dots_logo.png',
            sizes: 'any',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'dots_logo.png',
            sizes: '16x16',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['react-icons']
        }
      }
    }
  }
})