import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  // GitHub Pages hosts this project below /CV-Studio/; keep local Vite at /.
  base: mode === 'production' ? '/CV-Studio/' : '/',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(projectRoot, 'src') } },
  server: { proxy: { '/api': 'http://localhost:4174' } },
}));
