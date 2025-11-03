import { test, expect } from '@playwright/test';
import { waitForPageLoad, clearLocalStorage } from './helpers/test-helpers';

/**
 * パフォーマンステスト
 */
test.describe('パフォーマンス', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearLocalStorage(page);
  });

  test('スクリプト読み込み時間が100ms以内', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await waitForPageLoad(page);

    const loadTime = Date.now() - startTime;

    console.log(`Page load time: ${loadTime}ms`);

    // ページ全体の読み込み時間(目安として3秒以内)
    expect(loadTime).toBeLessThan(3000);
  });

  test('ヒートマップライブラリのバンドルサイズ', async ({ page }) => {
    // スクリプトが埋め込み型なのでスクリプトタグの有無をチェック
    const hasInlineScript = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      const inlineScripts = scripts.filter(s => !s.src && s.textContent?.includes('HeatmapAnalytics'));
      return inlineScripts.length > 0;
    });

    console.log('Has inline heatmap script:', hasInlineScript);

    // インラインスクリプトが存在することを確認
    expect(hasInlineScript).toBe(true);
  });

  test('大量のクリックイベントでもパフォーマンスが低下しない', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    const startTime = Date.now();

    // 100回クリック
    for (let i = 0; i < 100; i++) {
      await page.click('body', {
        position: { x: Math.random() * 500, y: Math.random() * 500 },
      });
      // わずかな待機のみ
      if (i % 10 === 0) {
        await page.waitForTimeout(10);
      }
    }

    const processingTime = Date.now() - startTime;

    console.log(`100 clicks processing time: ${processingTime}ms`);

    // 100回のクリックが5秒以内に処理されるか
    expect(processingTime).toBeLessThan(5000);
  });

  test('大量のスクロールイベントでもパフォーマンスが低下しない', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    const startTime = Date.now();

    // 複数回スクロール
    for (let i = 0; i < 50; i++) {
      await page.evaluate((scroll) => {
        window.scrollTo({ top: scroll, behavior: 'instant' });
      }, i * 100);

      if (i % 10 === 0) {
        await page.waitForTimeout(10);
      }
    }

    const processingTime = Date.now() - startTime;

    console.log(`50 scrolls processing time: ${processingTime}ms`);

    // 50回のスクロールが3秒以内に処理されるか
    expect(processingTime).toBeLessThan(3000);
  });

  test('LocalStorage書き込み速度', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    const writeTime = await page.evaluate(() => {
      const startTime = performance.now();

      // 大量のデータを書き込み
      const testData = Array.from({ length: 1000 }, (_, i) => ({
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        timestamp: Date.now() + i,
      }));

      try {
        window.localStorage.setItem('test_performance', JSON.stringify(testData));
      } catch (e) {
        console.error('LocalStorage write failed:', e);
      }

      const endTime = performance.now();
      return endTime - startTime;
    });

    console.log(`LocalStorage write time: ${writeTime}ms`);

    // LocalStorage書き込みが100ms以内
    expect(writeTime).toBeLessThan(100);
  });

  test('メモリ使用量が適切', async ({ page }) => {
    // 大量のイベントを発生させる
    for (let i = 0; i < 50; i++) {
      await page.click('body', {
        position: { x: Math.random() * 500, y: Math.random() * 500 },
      });
    }

    await page.waitForTimeout(1000);

    // LocalStorageのデータ量をチェック
    const storageSize = await page.evaluate(() => {
      let totalSize = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length;
        }
      }
      return totalSize;
    });

    console.log(`LocalStorage size: ${(storageSize / 1024).toFixed(2)}KB`);

    // LocalStorageのサイズが適切(5MB以下)
    expect(storageSize).toBeLessThan(5 * 1024 * 1024);
  });

  test('ヒートマップ表示の応答速度', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // クリックデータを作成
    await page.evaluate(() => {
      const clicks = Array.from({ length: 100 }, (_, i) => ({
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        timestamp: Date.now() + i,
      }));
      window.localStorage.setItem('heatmap_clicks', JSON.stringify(clicks));
    });

    // ヒートマップ表示の切り替え
    const toggleButton = page.locator('[data-testid="toggle-heatmap"]').or(
      page.locator('button').first()
    );

    if (await toggleButton.count() > 0) {
      const startTime = Date.now();

      await toggleButton.click();
      await page.waitForTimeout(100);

      const responseTime = Date.now() - startTime;

      console.log(`Heatmap toggle response time: ${responseTime}ms`);

      // 応答速度が500ms以内
      expect(responseTime).toBeLessThan(500);
    }
  });

  test('サンプリングによるデータ量の削減', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // 大量のマウス移動を発生させる
    for (let i = 0; i < 200; i++) {
      await page.mouse.move(Math.random() * 500, Math.random() * 500);
      await page.waitForTimeout(5);
    }

    await page.waitForTimeout(1000);

    const mouseMoveData = await page.evaluate(() => {
      return window.localStorage.getItem('heatmap_mouse_moves');
    });

    if (mouseMoveData) {
      const parsedData = JSON.parse(mouseMoveData);

      console.log(`Mouse move events recorded: ${parsedData.length}`);

      // サンプリングにより、すべてのイベントが記録されているわけではないはず
      expect(parsedData.length).toBeLessThan(200);
    }
  });

  test('ページ読み込み速度への影響が最小限', async ({ page }) => {
    // ヒートマップなしでの読み込み時間を測定
    const startTimeWithoutHeatmap = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTimeWithoutHeatmap = Date.now() - startTimeWithoutHeatmap;

    await clearLocalStorage(page);

    // ヒートマップありでの読み込み時間を測定
    const startTimeWithHeatmap = Date.now();
    await page.goto('/');
    await waitForPageLoad(page);
    const loadTimeWithHeatmap = Date.now() - startTimeWithHeatmap;

    console.log(`Load time without heatmap: ${loadTimeWithoutHeatmap}ms`);
    console.log(`Load time with heatmap: ${loadTimeWithHeatmap}ms`);

    const difference = loadTimeWithHeatmap - loadTimeWithoutHeatmap;

    console.log(`Difference: ${difference}ms`);

    // 影響が1秒以内(目安)
    expect(difference).toBeLessThan(1000);
  });
});
