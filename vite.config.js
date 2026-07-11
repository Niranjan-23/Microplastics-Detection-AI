import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-roboflow': {
        target: 'https://serverless.roboflow.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-roboflow/, ''),
      },
    },
  },
  preview: {
    proxy: {
      '/api-roboflow': {
        target: 'https://serverless.roboflow.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-roboflow/, ''),
      },
    },
  },
})
