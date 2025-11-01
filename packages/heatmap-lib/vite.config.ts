import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'HeatmapLib',
      fileName: (format) => `heatmap-lib.${format}.js`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      output: {
        // Minimize bundle size
        compact: true,
        // Remove comments
        banner: '/* Heatmap & Funnel Analysis Library */',
      },
    },
    // Target size: 50KB or less
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
