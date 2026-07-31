import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  ...(mode === 'production' && process.env.VITE_API_URL
    ? { base: '/', define: { 'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL) } }
    : {}),
}))
