import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2Eテスト設定
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // テストディレクトリ
  testDir: './tests/e2e',

  // テストファイルのパターン
  testMatch: '**/*.spec.ts',

  // 並列実行の設定
  fullyParallel: true,

  // CI環境でのみfailOnFlaky設定を有効化
  forbidOnly: !!process.env.CI,

  // リトライ回数（CI: 2回, ローカル: 0回）
  retries: process.env.CI ? 2 : 0,

  // 並列ワーカー数（CI: 1, ローカル: CPU数の半分）
  workers: process.env.CI ? 1 : undefined,

  // レポート形式
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  // 共通設定
  use: {
    // ベースURL（開発サーバー）
    baseURL: 'http://localhost:3000',

    // トレース設定（失敗時のみ記録）
    trace: 'on-first-retry',

    // スクリーンショット（失敗時のみ）
    screenshot: 'only-on-failure',

    // ビデオ録画（失敗時のみ）
    video: 'retain-on-failure',

    // ページ読み込みタイムアウト
    navigationTimeout: 30000,

    // アクションタイムアウト
    actionTimeout: 10000,
  },

  // ブラウザ設定（要件定義 10.3節に基づく）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // モバイル対応テスト
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    // タブレット対応テスト
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
  ],

  // 開発サーバー設定
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
