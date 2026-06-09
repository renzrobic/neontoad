import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    cssMinify: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          return `assets/[name]-[hash].[ext]`;
        },
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Split heavy libraries into their own chunks for better caching
            if (id.includes('framer-motion')) return 'framer-motion';
            if (id.includes('react-player')) return 'player-vendor';
            if (id.includes('firebase')) return 'firebase-vendor';
            if (id.includes('date-fns')) return 'date-fns';
            if (id.includes('react-router')) return 'router-vendor';
            if (id.includes('react')) return 'react-vendor';
            return 'vendor';
          }
        }
      }
    }
  }
})
