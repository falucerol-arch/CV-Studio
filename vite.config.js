import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => ({
  // GitHub Pages hosts this project below /CV-Studio/; keep local Vite at /.
  base: mode === 'production' ? '/CV-Studio/' : '/',
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:4174' } },
}));
