import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'ChateChat',
      fileName: () => 'chatechat.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        extend: true,
        inlineDynamicImports: true,
      },
    },
    minify: 'terser',
  },
  server: {
    port: 5173,
    cors: true,
  },
});
