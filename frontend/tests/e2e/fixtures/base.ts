import { test as base, Page } from '@playwright/test';
import { clearLocalStorage, waitForPageLoad } from '../helpers/test-helpers';

/**
 * E2Eテスト用のフィクスチャー
 */
type HeatmapFixtures = {
  cleanPage: Page;
};

/**
 * カスタムフィクスチャーを定義
 * - cleanPage: LocalStorageをクリアした状態のページ
 */
export const test = base.extend<HeatmapFixtures>({
  cleanPage: async ({ page }, use) => {
    // テスト開始前: LocalStorageをクリア
    await page.goto('/');
    await waitForPageLoad(page);
    await clearLocalStorage(page);
    await page.reload();
    await waitForPageLoad(page);

    // テストを実行
    await use(page);

    // テスト終了後: クリーンアップ
    await clearLocalStorage(page);
  },
});

export { expect } from '@playwright/test';
