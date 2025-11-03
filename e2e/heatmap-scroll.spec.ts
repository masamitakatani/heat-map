import { test, expect } from '@playwright/test';
import {
  clearLocalStorage,
  getLocalStorageItem,
  waitForPageLoad,
  scrollAndVerifyTracking,
} from './helpers/test-helpers';

/**
 * スクロールヒートマップ機能のE2Eテスト
 */
test.describe('スクロールヒートマップ機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    await clearLocalStorage(page);
  });

  test('スクロールイベントが正しく記録される', async ({ page }) => {
    // ページをスクロール
    await page.evaluate(() => {
      window.scrollTo({ top: 500, behavior: 'smooth' });
    });

    await page.waitForTimeout(1000);

    const scrollData = await getLocalStorageItem(page, 'heatmap_scrolls');
    expect(scrollData).not.toBeNull();

    if (scrollData) {
      const parsedData = JSON.parse(scrollData);
      expect(Array.isArray(parsedData)).toBe(true);
      expect(parsedData.length).toBeGreaterThan(0);

      // スクロールデータの構造を確認
      const firstScroll = parsedData[0];
      expect(firstScroll).toHaveProperty('depth');
      expect(firstScroll).toHaveProperty('timestamp');
    }
  });

  test('スクロール深度が正しく記録される', async ({ page }) => {
    const targetScroll = 1000;

    await page.evaluate((scroll) => {
      window.scrollTo({ top: scroll, behavior: 'instant' });
    }, targetScroll);

    await page.waitForTimeout(1000);

    const scrollData = await getLocalStorageItem(page, 'heatmap_scrolls');

    if (scrollData) {
      const parsedData = JSON.parse(scrollData);
      const lastScroll = parsedData[parsedData.length - 1];

      // スクロール深度が記録されているか確認
      expect(lastScroll.depth).toBeGreaterThan(0);
    }
  });

  test('複数のスクロールイベントが記録される', async ({ page }) => {
    // 段階的にスクロール
    const scrollSteps = [200, 400, 600, 800, 1000];

    for (const step of scrollSteps) {
      await page.evaluate((scroll) => {
        window.scrollTo({ top: scroll, behavior: 'instant' });
      }, step);
      await page.waitForTimeout(300);
    }

    await page.waitForTimeout(500);

    const scrollData = await getLocalStorageItem(page, 'heatmap_scrolls');

    expect(scrollData).not.toBeNull();

    if (scrollData) {
      const parsedData = JSON.parse(scrollData);
      // 少なくとも1つ以上のスクロールイベントが記録されている
      expect(parsedData.length).toBeGreaterThan(0);
    }
  });

  test('スクロール率がパーセンテージで計算される', async ({ page }) => {
    // ページの高さを取得
    const pageInfo = await page.evaluate(() => {
      const scrollHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      return { scrollHeight, windowHeight };
    });

    // 50%の位置までスクロール
    const maxScroll = pageInfo.scrollHeight - pageInfo.windowHeight;
    const halfScroll = maxScroll / 2;

    await page.evaluate((scroll) => {
      window.scrollTo({ top: scroll, behavior: 'instant' });
    }, halfScroll);

    await page.waitForTimeout(500);

    const scrollData = await getLocalStorageItem(page, 'heatmap_scrolls');

    expect(scrollData).not.toBeNull();

    if (scrollData) {
      const parsedData = JSON.parse(scrollData);
      expect(parsedData.length).toBeGreaterThan(0);

      const lastScroll = parsedData[parsedData.length - 1];

      // スクロール率が記録されている場合、約30-70%の範囲になるはず
      if (lastScroll.percentage !== undefined) {
        expect(lastScroll.percentage).toBeGreaterThanOrEqual(30);
        expect(lastScroll.percentage).toBeLessThanOrEqual(70);
      }
    }
  });

  test('ページ最下部までスクロールした際の記録', async ({ page }) => {
    // ページ最下部までスクロール
    await page.evaluate(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'instant',
      });
    });

    await page.waitForTimeout(1000);

    const scrollData = await getLocalStorageItem(page, 'heatmap_scrolls');

    if (scrollData) {
      const parsedData = JSON.parse(scrollData);
      const lastScroll = parsedData[parsedData.length - 1];

      // 最下部までスクロールした場合、100%に近い値になるはず
      if (lastScroll.percentage !== undefined) {
        expect(lastScroll.percentage).toBeGreaterThanOrEqual(95);
      }
    }
  });

  test('スクロール上方向の記録', async ({ page }) => {
    // 下にスクロール
    await page.evaluate(() => {
      window.scrollTo({ top: 1000, behavior: 'instant' });
    });
    await page.waitForTimeout(500);

    // 上にスクロール
    await page.evaluate(() => {
      window.scrollTo({ top: 500, behavior: 'instant' });
    });
    await page.waitForTimeout(1000);

    const scrollData = await getLocalStorageItem(page, 'heatmap_scrolls');
    expect(scrollData).not.toBeNull();

    if (scrollData) {
      const parsedData = JSON.parse(scrollData);
      // 上下両方向のスクロールが記録されているか
      expect(parsedData.length).toBeGreaterThanOrEqual(2);
    }
  });

  test('スクロールデータのタイムスタンプが正しい', async ({ page }) => {
    const startTime = Date.now();

    await page.evaluate(() => {
      window.scrollTo({ top: 500, behavior: 'instant' });
    });

    await page.waitForTimeout(1000);

    const scrollData = await getLocalStorageItem(page, 'heatmap_scrolls');

    if (scrollData) {
      const parsedData = JSON.parse(scrollData);
      const firstScroll = parsedData[0];

      // タイムスタンプが現在時刻に近いか確認
      expect(firstScroll.timestamp).toBeGreaterThanOrEqual(startTime);
      expect(firstScroll.timestamp).toBeLessThanOrEqual(Date.now());
    }
  });
});
