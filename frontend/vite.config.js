import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Handles your auth endpoints
      '/login': { target: 'http://localhost:8000', changeOrigin: true },
      '/register': { target: 'http://localhost:8000', changeOrigin: true },
      '/me': { target: 'http://localhost:8000', changeOrigin: true },
      
      // 🚀 Add these to fix your new errors:
      '/upload': { 
        target: 'http://localhost:8000', 
        changeOrigin: true 
      },
      '/api': { 
        target: 'http://localhost:8000', 
        changeOrigin: true 
      }
    }
  }

})