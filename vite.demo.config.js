import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: 'demo',
  base: './',
  plugins: [tailwindcss()],
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
});