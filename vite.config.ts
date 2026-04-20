import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'node:path';

export default defineConfig(() => ({
  plugins: [preact()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CharlieFixes',
      fileName: (format) => format === 'iife' ? 'charlie-fixes.iife.js' : 'charlie-fixes.mjs',
      formats: ['iife', 'es'],
    },
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
}));
