import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'node:path';

// Two build targets share the same config, switched via VITE_BUILD_TARGET env:
//   - "main" (default): single-entry IIFE + ESM drop-in bundle (self-contained).
//   - "wrappers": multi-entry ESM build for the React / Vue wrappers.
const target = process.env.VITE_BUILD_TARGET ?? 'main';

export default defineConfig(() => {
  if (target === 'wrappers') {
    return {
      plugins: [preact()],
      build: {
        lib: {
          entry: {
            react: resolve(__dirname, 'src/react.tsx'),
            vue: resolve(__dirname, 'src/vue.ts'),
          },
          formats: ['es'],
        },
        outDir: resolve(__dirname, 'dist'),
        emptyOutDir: false,
        sourcemap: true,
        rollupOptions: {
          external: ['react', 'react-dom', 'vue', 'charlie-fixes'],
          output: {
            entryFileNames: '[name].mjs',
            banner: (chunk) => (chunk.name === 'react' ? "'use client';" : ''),
          },
        },
      },
    };
  }

  return {
    plugins: [preact()],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'CharlieFixes',
        fileName: (format) => (format === 'iife' ? 'charlie-fixes.iife.js' : 'charlie-fixes.mjs'),
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
  };
});
