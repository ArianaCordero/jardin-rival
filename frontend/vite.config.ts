import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo, Vite corre en el puerto 5173 y redirige /api hacia Express (puerto 4000).
// En producción, Express sirve el build de este proyecto (carpeta dist) desde su propio
// puerto, por lo que frontend y backend terminan bajo el mismo dominio y puerto.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
