import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        // Strips the /api prefix before forwarding to Express.
        // So  /api/auth/login  →  /auth/login  on your backend.
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
