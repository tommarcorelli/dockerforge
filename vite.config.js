import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Config Vite pour DockerForge
// base: '/dockerforge/' à adapter avec le nom de ton repo GitHub
// si tu déploies sur GitHub Pages (sinon laisse '/')
export default defineConfig({
  plugins: [react()],
  base: './',
})
