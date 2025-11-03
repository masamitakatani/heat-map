import { Page, expect } from '@playwright/test';

/**
 * LocalStorageをクリアするヘルパー
 */
export async function clearLocalStorage(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.clear());
}

/**
 * LocalStorageの内容を取得するヘルパー
 */
export async function getLocalStorageItem(page: Page, key: string): Promise<string | null> {
  return await page.evaluate((k) => localStorage.getItem(k), key);
}

/**
 * LocalStorageに値を設定するヘルパー
 */
export async function setLocalStorageItem(page: Page, key: string, value: string): Promise<void> {
  await page.evaluate(
    ({ k, v }) => localStorage.setItem(k, v),
    { k: key, v: value }
  );
}

/**
 * ヒートマップライブラリが読み込まれているか確認
 */
export async function waitForHeatmapLoaded(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    return typeof (window as any).HeatmapAnalytics !== 'undefined';
  }, { timeout: 10000 });
}

/**
 * オーバーレイUIが表示されているか確認
 */
export async function isOverlayVisible(page: Page): Promise<boolean> {
  const overlay = page.locator('[data-testid="heatmap-overlay"]').first();
  return await overlay.isVisible().catch(() => false);
}

/**
 * ヒートマップの初期化を実行
 */
export async function initializeHeatmap(
  page: Page,
  options: {
    apiKey?: string;
    projectId?: string;
    baseUrl?: string;
  } = {}
): Promise<void> {
  const {
    apiKey = 'test-key-123',
    projectId = 'proj_test_001',
    baseUrl = 'https://api.connected-one.com/v1',
  } = options;

  // フォームに値を入力
  await page.fill('#apiKey', apiKey);
  await page.fill('#projectId', projectId);
  await page.fill('#baseUrl', baseUrl);

  // 初期化ボタンをクリック
  await page.click('button:has-text("初期化")');

  // 初期化完了を待つ
  await page.waitForTimeout(500);
}

/**
 * 出力ログに特定のメッセージが含まれているか確認
 */
export async function checkOutputLog(page: Page, message: string): Promise<boolean> {
  const outputText = await page.locator('#output').textContent();
  return outputText?.includes(message) ?? false;
}

/**
 * 出力ログをクリア
 */
export async function clearOutputLog(page: Page): Promise<void> {
  await page.click('button:has-text("出力をクリア")');
}

/**
 * クリックイベントをシミュレート
 */
export async function simulateClick(page: Page, selector: string): Promise<void> {
  await page.click(selector);
  await page.waitForTimeout(100);
}

/**
 * スクロールをシミュレート
 */
export async function simulateScroll(page: Page, y: number): Promise<void> {
  await page.evaluate((scrollY) => {
    window.scrollTo({ top: scrollY, behavior: 'smooth' });
  }, y);
  await page.waitForTimeout(300);
}

/**
 * マウスムーブメントをシミュレート
 */
export async function simulateMouseMove(page: Page, x: number, y: number): Promise<void> {
  await page.mouse.move(x, y);
  await page.waitForTimeout(50);
}

/**
 * ヒートマップデータがLocalStorageに保存されているか確認
 */
export async function checkHeatmapDataInStorage(page: Page): Promise<boolean> {
  const clickData = await getLocalStorageItem(page, 'heatmap_clicks');
  const scrollData = await getLocalStorageItem(page, 'heatmap_scrolls');
  const mouseData = await getLocalStorageItem(page, 'heatmap_mousemoves');

  return !!(clickData || scrollData || mouseData);
}

/**
 * デバイス情報を取得
 */
export async function getDeviceInfo(page: Page): Promise<{
  width: number;
  height: number;
  userAgent: string;
}> {
  return await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    userAgent: navigator.userAgent,
  }));
}

/**
 * ページの読み込み完了を待つ
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

/**
 * エラーメッセージが表示されているか確認
 */
export async function checkErrorMessage(page: Page, message: string): Promise<boolean> {
  const errorElements = page.locator('.output-error');
  const count = await errorElements.count();

  for (let i = 0; i < count; i++) {
    const text = await errorElements.nth(i).textContent();
    if (text?.includes(message)) {
      return true;
    }
  }

  return false;
}

/**
 * 成功メッセージが表示されているか確認
 */
export async function checkSuccessMessage(page: Page, message: string): Promise<boolean> {
  const successElements = page.locator('.output-success');
  const count = await successElements.count();

  for (let i = 0; i < count; i++) {
    const text = await successElements.nth(i).textContent();
    if (text?.includes(message)) {
      return true;
    }
  }

  return false;
}
