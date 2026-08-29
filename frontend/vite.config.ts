import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' -> assets com caminho relativo, pro pywebview carregar do disco
export default defineConfig({
  base: './',
  plugins: [react()],
})
