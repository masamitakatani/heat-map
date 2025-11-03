import { test, expect } from './fixtures/base';
import {
  waitForHeatmapLoaded,
  initializeHeatmap,
  checkSuccessMessage,
  waitForPageLoad,
} from './helpers/test-helpers';

/**
 * シナリオ1: スクリプト読み込み → ヒートマップ表示
 *
 * テスト内容:
 * 1. ページ読み込み時にHeatmapAnalyticsライブラリが正しく読み込まれるか
 * 2. 初期化処理が正常に実行されるか
 * 3. 初期化後にSessionIDとAnonymousIDが生成されるか
 */
test.describe('シナリオ1: スクリプト読み込み → ヒートマップ表示', () => {
  test('ページ読み込み時にHeatmapAnalyticsライブラリが読み込まれる', async ({ cleanPage }) => {
    // ページが正しく読み込まれているか確認
    await expect(cleanPage).toHaveTitle(/Heatmap Analytics/);

    // HeatmapAnalyticsライブラリが読み込まれているか確認
    await waitForHeatmapLoaded(cleanPage);

    const isLoaded = await cleanPage.evaluate(() => {
      return typeof (window as any).HeatmapAnalytics !== 'undefined';
    });

    expect(isLoaded).toBe(true);
  });

  test('初期化処理が正常に実行される', async ({ cleanPage }) => {
    // HeatmapAnalyticsライブラリの読み込み待機
    await waitForHeatmapLoaded(cleanPage);

    // 初期化を実行
    await initializeHeatmap(cleanPage);

    // 成功メッセージが表示されるか確認
    const hasSuccessMessage = await checkSuccessMessage(cleanPage, '初期化成功');
    expect(hasSuccessMessage).toBe(true);
  });

  test('初期化後にSessionIDとAnonymousIDが生成される', async ({ cleanPage }) => {
    // HeatmapAnalyticsライブラリの読み込み待機
    await waitForHeatmapLoaded(cleanPage);

    // 初期化を実行
    await initializeHeatmap(cleanPage);

    // 初期化状態を確認
    await cleanPage.click('button:has-text("初期化状態を確認")');
    await cleanPage.waitForTimeout(300);

    // SessionIDとAnonymousIDが出力に表示されるか確認
    const outputText = await cleanPage.locator('#output').textContent();

    expect(outputText).toContain('初期化済み');
    expect(outputText).toContain('SessionID:');
    expect(outputText).toContain('AnonymousID:');
  });

  test('APIキーとプロジェクトIDが正しく設定される', async ({ cleanPage }) => {
    // HeatmapAnalyticsライブラリの読み込み待機
    await waitForHeatmapLoaded(cleanPage);

    // カスタムパラメータで初期化
    const testApiKey = 'custom-api-key-456';
    const testProjectId = 'proj_custom_002';

    await initializeHeatmap(cleanPage, {
      apiKey: testApiKey,
      projectId: testProjectId,
    });

    // 初期化成功を確認
    const hasSuccessMessage = await checkSuccessMessage(cleanPage, '初期化成功');
    expect(hasSuccessMessage).toBe(true);

    // 設定値が正しく保存されているか確認（LocalStorageをチェック）
    const storedConfig = await cleanPage.evaluate(() => {
      const configStr = localStorage.getItem('heatmap_config');
      return configStr ? JSON.parse(configStr) : null;
    });

    if (storedConfig) {
      expect(storedConfig.api?.apiKey).toBe(testApiKey);
      expect(storedConfig.api?.projectId).toBe(testProjectId);
    }
  });

  test('初期化なしでエラーが表示される', async ({ cleanPage }) => {
    // HeatmapAnalyticsライブラリの読み込み待機
    await waitForHeatmapLoaded(cleanPage);

    // 初期化せずにAPIを呼び出す
    await cleanPage.click('button:has-text("ファネル情報を取得")');
    await cleanPage.waitForTimeout(500);

    // エラーまたは例外メッセージが表示されるか確認
    const outputText = await cleanPage.locator('#output').textContent();
    expect(outputText).toMatch(/(エラー|例外)/);
  });

  test('ページリロード後もライブラリが再読み込みされる', async ({ cleanPage }) => {
    // 初回読み込み
    await waitForHeatmapLoaded(cleanPage);

    // ページをリロード
    await cleanPage.reload();
    await waitForPageLoad(cleanPage);

    // 再度読み込まれているか確認
    await waitForHeatmapLoaded(cleanPage);

    const isLoaded = await cleanPage.evaluate(() => {
      return typeof (window as any).HeatmapAnalytics !== 'undefined';
    });

    expect(isLoaded).toBe(true);
  });

  test('複数デバイスサイズでライブラリが正しく読み込まれる', async ({ cleanPage }) => {
    // デスクトップサイズ
    await cleanPage.setViewportSize({ width: 1920, height: 1080 });
    await waitForHeatmapLoaded(cleanPage);

    let isLoaded = await cleanPage.evaluate(() => {
      return typeof (window as any).HeatmapAnalytics !== 'undefined';
    });
    expect(isLoaded).toBe(true);

    // タブレットサイズ
    await cleanPage.setViewportSize({ width: 768, height: 1024 });
    await cleanPage.reload();
    await waitForPageLoad(cleanPage);
    await waitForHeatmapLoaded(cleanPage);

    isLoaded = await cleanPage.evaluate(() => {
      return typeof (window as any).HeatmapAnalytics !== 'undefined';
    });
    expect(isLoaded).toBe(true);

    // モバイルサイズ
    await cleanPage.setViewportSize({ width: 375, height: 667 });
    await cleanPage.reload();
    await waitForPageLoad(cleanPage);
    await waitForHeatmapLoaded(cleanPage);

    isLoaded = await cleanPage.evaluate(() => {
      return typeof (window as any).HeatmapAnalytics !== 'undefined';
    });
    expect(isLoaded).toBe(true);
  });
});
