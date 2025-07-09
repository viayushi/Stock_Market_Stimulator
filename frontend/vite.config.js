import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['@amcharts/amcharts5', '@amcharts/amcharts5/stock', '@amcharts/amcharts5/xy'],
          icons: ['lucide-react']
        }
      }
    }
  },
  define: {
    global: 'globalThis',
  }
})
