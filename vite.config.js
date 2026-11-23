/**
 * Configuración de Vite para GO Puntos.
 *
 * - Plugin oficial de Vue para los componentes .vue. Los espacios entre
 *   elementos se conservan (whitespace: 'preserve') para que el texto se vea
 *   igual que en la maqueta HTML (por ejemplo "CV Dietética 1.992 pts").
 * - Alias "@" → carpeta src (import { format } from '@/utils/format.js').
 * - El servidor de desarrollo responde index.html en cualquier ruta
 *   (necesario para el historial del router: /app/puntos, /panel/caja, etc.).
 */
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue({ template: { compilerOptions: { whitespace: 'preserve' } } })],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173, open: false },
});
