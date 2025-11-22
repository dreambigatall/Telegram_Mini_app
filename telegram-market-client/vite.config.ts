import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // This allows Ngrok (and any other tunnel) to access your PC
    allowedHosts: true, 
    // (Optional) Ensure it listens on all network interfaces
    host: true 
  }
})
