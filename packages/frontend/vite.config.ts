import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      // エントリーポイント
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'HeatmapAnalytics',
      // UMD形式で出力（ブラウザのscriptタグで読み込める）
      formats: ['umd', 'es'],
      fileName: (format) => `heatmap-analytics.${format}.js`,
    },
    rollupOptions: {
      // 外部依存を指定（バンドルに含めない）
      external: [],
      output: {
        // グローバル変数名
        globals: {},
        // チャンク分割を無効化（単一ファイル出力）
        manualChunks: undefined,
      },
    },
    // ソースマップ生成（デバッグ用）
    sourcemap: true,
    // 最小化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // console.log削除
        drop_debugger: true,
      },
    },
  },
  // 開発サーバー設定
  server: {
    port: 3000,
    open: true,
  },
});
