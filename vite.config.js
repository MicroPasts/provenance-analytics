import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: 'demo',
  plugins: [tailwindcss()],
  server: {
    port: 5174,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    lib: {
      entry: '../src/index.js',
      name: 'ProvenanceAnalytics',
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
      formats: ['es', 'cjs'],
    },
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css' || assetInfo.name?.endsWith('.css')) {
            return 'index.css';
          }
          return assetInfo.name || '[name][extname]';
        },
      },
    },
  },
});