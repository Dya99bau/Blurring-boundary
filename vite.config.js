import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Change '/protocol-city-sim/' to match your GitHub repo name when deploying
export default defineConfig({
  plugins: [react()],
  base: '/Blurring-boundary/',
})
