import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [cssInjectedByJsPlugin()],
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    lib: {
      entry: 'src/main.js',
      name: 'SancoWidget',
      fileName: 'widget',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        extend: true,
      }
    }
  }
});
