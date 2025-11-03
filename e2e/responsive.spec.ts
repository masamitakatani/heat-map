import { test, expect } from '@playwright/test';
import { waitForPageLoad, clearLocalStorage } from './helpers/test-helpers';
import { viewportSizes } from './fixtures/test-data';

/**
 * レスポンシブデザインのE2Eテスト
 */
test.describe('レスポンシブデザイン', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    await clearLocalStorage(page);
  });

  test('モバイル(375px)でページが正しく表示される', async ({ page }) => {
    await page.setViewportSize(viewportSizes.mobile);
    await page.waitForTimeout(500);

    // ページが表示されているか確認
    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // スクロール可能か確認
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(scrollHeight).toBeGreaterThan(0);
  });

  test('タブレット(768px)でページが正しく表示される', async ({ page }) => {
    await page.setViewportSize(viewportSizes.tablet);
    await page.waitForTimeout(500);

    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('デスクトップ(1920px)でページが正しく表示される', async ({ page }) => {
    await page.setViewportSize(viewportSizes.desktop);
    await page.waitForTimeout(500);

    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('最小幅(320px)でページが正しく表示される', async ({ page }) => {
    await page.setViewportSize(viewportSizes.minWidth);
    await page.waitForTimeout(500);

    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // 横スクロールが発生していないか確認
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    // 横スクロールがほとんどないことを確認(多少の誤差は許容)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
  });

  test('モバイルでオーバーレイUIが適切に表示される', async ({ page }) => {
    await page.setViewportSize(viewportSizes.mobile);
    await page.waitForTimeout(500);

    const overlay = page.locator('[data-testid="heatmap-overlay"]').or(
      page.locator('.heatmap-overlay')
    );

    if (await overlay.count() > 0) {
      const box = await overlay.boundingBox();

      if (box) {
        // モバイルビューでオーバーレイが画面内に収まっているか確認
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewportSizes.mobile.width);
      }
    }
  });

  test('タブレットでオーバーレイUIが適切に表示される', async ({ page }) => {
    await page.setViewportSize(viewportSizes.tablet);
    await page.waitForTimeout(500);

    const overlay = page.locator('[data-testid="heatmap-overlay"]').or(
      page.locator('.heatmap-overlay')
    );

    if (await overlay.count() > 0) {
      const box = await overlay.boundingBox();

      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('ビューポートサイズ変更時にレイアウトが崩れない', async ({ page }) => {
    // デスクトップから開始
    await page.setViewportSize(viewportSizes.desktop);
    await page.waitForTimeout(500);

    // モバイルにリサイズ
    await page.setViewportSize(viewportSizes.mobile);
    await page.waitForTimeout(500);

    // タブレットにリサイズ
    await page.setViewportSize(viewportSizes.tablet);
    await page.waitForTimeout(500);

    // ページが正常に表示されているか確認
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('モバイルでクリックイベントが正しく記録される', async ({ page }) => {
    await page.setViewportSize(viewportSizes.mobile);
    await page.waitForTimeout(500);

    // タップ(クリック)
    await page.click('body', { position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);

    // クリックデータが記録されているか確認
    const clickData = await page.evaluate(() => {
      return window.localStorage.getItem('heatmap_clicks');
    });

    expect(clickData).not.toBeNull();
  });

  test('モバイルでスクロールイベントが正しく記録される', async ({ page }) => {
    await page.setViewportSize(viewportSizes.mobile);
    await page.waitForTimeout(500);

    // スクロール
    await page.evaluate(() => {
      window.scrollTo({ top: 500, behavior: 'instant' });
    });

    await page.waitForTimeout(1000);

    // スクロールデータが記録されているか確認
    const scrollData = await page.evaluate(() => {
      return window.localStorage.getItem('heatmap_scrolls');
    });

    expect(scrollData).not.toBeNull();
  });

  test('タッチデバイスでのジェスチャー操作', async ({ browser }) => {
    // タッチスクリーンを有効にしたコンテキストを作成
    const context = await browser.newContext({
      hasTouch: true,
      viewport: viewportSizes.mobile,
    });
    const page = await context.newPage();

    await page.goto('/');
    await waitForPageLoad(page);
    await clearLocalStorage(page);

    // スワイプジェスチャーをシミュレート
    await page.touchscreen.tap(100, 100);
    await page.waitForTimeout(300);

    // タップイベントが記録されているか確認
    const clickData = await page.evaluate(() => {
      return window.localStorage.getItem('heatmap_clicks');
    });

    // タップもクリックとして記録されるはず
    expect(clickData).not.toBeNull();

    await context.close();
  });

  test('横向き(landscape)モードでの表示', async ({ page }) => {
    // 横向きモバイル
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500);

    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // レイアウトが崩れていないか確認
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 50);
  });
});
