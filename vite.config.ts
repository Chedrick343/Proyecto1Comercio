/**
 * @fileoverview Configuración de Vite para el desarrollo y el despliegue en GitHub Pages.
 */

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/Proyecto1Comercio',
  plugins: [react()],
})
