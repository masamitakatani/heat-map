import { Page, expect } from '@playwright/test';

/**
 * LocalStorageのデータをクリアするヘルパー関数
 */
export async function clearLocalStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.localStorage.clear();
  });
}

/**
 * LocalStorageのデータを取得するヘルパー関数
 */
export async function getLocalStorageItem(page: Page, key: string): Promise<string | null> {
  return await page.evaluate((k) => {
    return window.localStorage.getItem(k);
  }, key);
}

/**
 * LocalStorageにデータを保存するヘルパー関数
 */
export async function setLocalStorageItem(page: Page, key: string, value: string): Promise<void> {
  await page.evaluate(({ k, v }) => {
    window.localStorage.setItem(k, v);
  }, { k: key, v: value });
}

/**
 * ページが完全に読み込まれるまで待機
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}

/**
 * 指定した要素が表示されるまで待機
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * ヒートマップライブラリが初期化されたか確認
 */
export async function isHeatmapLibInitialized(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return !!(window as any).HeatmapAnalytics;
  });
}

/**
 * クリックイベントを発火して記録を確認
 */
export async function clickAndVerifyTracking(page: Page, selector: string): Promise<void> {
  const element = page.locator(selector);
  await element.click();

  // クリックイベントが記録されているか確認
  const clickData = await getLocalStorageItem(page, 'heatmap_clicks');
  expect(clickData).not.toBeNull();
}

/**
 * スクロールして記録を確認
 */
export async function scrollAndVerifyTracking(page: Page, scrollY: number): Promise<void> {
  await page.evaluate((y) => {
    window.scrollTo({ top: y, behavior: 'smooth' });
  }, scrollY);

  // スクロールイベントが記録されているか確認
  await page.waitForTimeout(500); // スクロールの完了を待つ
  const scrollData = await getLocalStorageItem(page, 'heatmap_scrolls');
  expect(scrollData).not.toBeNull();
}

/**
 * マウス移動を記録して確認
 */
export async function moveMouseAndVerifyTracking(page: Page, x: number, y: number): Promise<void> {
  await page.mouse.move(x, y);
  await page.waitForTimeout(100);

  const mouseMoveData = await getLocalStorageItem(page, 'heatmap_mouse_moves');
  expect(mouseMoveData).not.toBeNull();
}

/**
 * オーバーレイUIが表示されているか確認
 */
export async function verifyOverlayVisible(page: Page): Promise<boolean> {
  const overlay = page.locator('[data-testid="heatmap-overlay"]');
  return await overlay.isVisible();
}

/**
 * ヒートマップの表示モードを切り替え
 */
export async function switchHeatmapMode(page: Page, mode: 'click' | 'scroll' | 'mousemove' | 'funnel'): Promise<void> {
  const modeButton = page.locator(`[data-testid="mode-${mode}"]`);
  await modeButton.click();
  await page.waitForTimeout(300);
}

/**
 * データリセット機能をテスト
 */
export async function resetHeatmapData(page: Page): Promise<void> {
  const resetButton = page.locator('[data-testid="reset-data"]');
  await resetButton.click();

  // 確認ダイアログで「OK」をクリック
  page.on('dialog', async dialog => {
    await dialog.accept();
  });

  await page.waitForTimeout(300);
}

/**
 * ViewportサイズでレスポンシブUIを確認
 */
export async function testResponsiveUI(page: Page, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(500);
}
