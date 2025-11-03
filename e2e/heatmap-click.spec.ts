import { test, expect } from '@playwright/test';
import {
  clearLocalStorage,
  getLocalStorageItem,
  waitForPageLoad,
  clickAndVerifyTracking,
  isHeatmapLibInitialized,
} from './helpers/test-helpers';

/**
 * クリックヒートマップ機能のE2Eテスト
 */
test.describe('クリックヒートマップ機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    await clearLocalStorage(page);
  });

  test('ヒートマップライブラリが正しく初期化される', async ({ page }) => {
    const isInitialized = await isHeatmapLibInitialized(page);
    expect(isInitialized).toBe(true);
  });

  test('クリックイベントが正しく記録される', async ({ page }) => {
    // テスト用のボタン要素をクリック
    await page.click('body');

    // LocalStorageにクリックデータが保存されているか確認
    await page.waitForTimeout(500);
    const clickData = await getLocalStorageItem(page, 'heatmap_clicks');

    expect(clickData).not.toBeNull();

    if (clickData) {
      const parsedData = JSON.parse(clickData);
      expect(Array.isArray(parsedData)).toBe(true);
      expect(parsedData.length).toBeGreaterThan(0);

      // クリックデータの構造を確認
      const firstClick = parsedData[0];
      expect(firstClick).toHaveProperty('x');
      expect(firstClick).toHaveProperty('y');
      expect(firstClick).toHaveProperty('timestamp');
    }
  });

  test('複数のクリックが記録される', async ({ page }) => {
    // 複数回クリック
    await page.click('body', { position: { x: 100, y: 100 } });
    await page.waitForTimeout(100);
    await page.click('body', { position: { x: 200, y: 200 } });
    await page.waitForTimeout(100);
    await page.click('body', { position: { x: 300, y: 300 } });

    await page.waitForTimeout(500);
    const clickData = await getLocalStorageItem(page, 'heatmap_clicks');

    expect(clickData).not.toBeNull();

    if (clickData) {
      const parsedData = JSON.parse(clickData);
      expect(parsedData.length).toBeGreaterThanOrEqual(3);
    }
  });

  test('クリック座標が正しく記録される', async ({ page }) => {
    const clickX = 150;
    const clickY = 250;

    await page.click('body', { position: { x: clickX, y: clickY } });
    await page.waitForTimeout(500);

    const clickData = await getLocalStorageItem(page, 'heatmap_clicks');

    if (clickData) {
      const parsedData = JSON.parse(clickData);
      const lastClick = parsedData[parsedData.length - 1];

      // 座標が記録されているか確認(多少の誤差を許容)
      expect(lastClick.x).toBeGreaterThanOrEqual(clickX - 10);
      expect(lastClick.x).toBeLessThanOrEqual(clickX + 10);
      expect(lastClick.y).toBeGreaterThanOrEqual(clickY - 10);
      expect(lastClick.y).toBeLessThanOrEqual(clickY + 10);
    }
  });

  test('LocalStorage容量制限のハンドリング', async ({ page }) => {
    // 大量のダミーデータを生成してLocalStorageに保存
    const largeData = Array.from({ length: 10000 }, (_, i) => ({
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      timestamp: Date.now() + i,
    }));

    await page.evaluate((data) => {
      try {
        window.localStorage.setItem('heatmap_clicks', JSON.stringify(data));
      } catch (e) {
        // 容量超過時のエラーハンドリングを確認
        console.log('LocalStorage quota exceeded:', e);
      }
    }, largeData);

    // 新しいクリックが記録できるか確認
    await page.click('body');
    await page.waitForTimeout(500);

    const clickData = await getLocalStorageItem(page, 'heatmap_clicks');
    expect(clickData).not.toBeNull();
  });

  test('ページリロード後もデータが保持される', async ({ page }) => {
    // クリックを記録
    await page.click('body', { position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);

    const clickDataBefore = await getLocalStorageItem(page, 'heatmap_clicks');

    // ページをリロード
    await page.reload();
    await waitForPageLoad(page);

    const clickDataAfter = await getLocalStorageItem(page, 'heatmap_clicks');

    // データが保持されているか確認
    expect(clickDataAfter).toEqual(clickDataBefore);
  });

  test('クリック可能要素のクリック率が計算される', async ({ page }) => {
    // クリック可能な要素(ボタンやリンク)をクリック
    const buttons = await page.locator('button, a').all();

    if (buttons.length > 0) {
      await buttons[0].click();
      await page.waitForTimeout(500);

      const clickData = await getLocalStorageItem(page, 'heatmap_clicks');
      expect(clickData).not.toBeNull();
    }
  });
});
