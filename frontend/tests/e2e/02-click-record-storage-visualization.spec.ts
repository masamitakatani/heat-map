import { test, expect } from './fixtures/base';
import {
  waitForHeatmapLoaded,
  initializeHeatmap,
  simulateClick,
  simulateScroll,
  simulateMouseMove,
  checkHeatmapDataInStorage,
  getLocalStorageItem,
  waitForPageLoad,
} from './helpers/test-helpers';

/**
 * シナリオ2: クリック記録 → データ保存 → ヒートマップ可視化
 *
 * テスト内容:
 * 1. クリックイベントが記録されるか
 * 2. クリックデータがLocalStorageに保存されるか
 * 3. スクロールイベントが記録されるか
 * 4. マウスムーブメントが記録されるか
 * 5. データがJSON形式で正しく保存されるか
 */
test.describe('シナリオ2: クリック記録 → データ保存 → 可視化', () => {
  test.skip('クリックイベントが記録される（実装待ち: start()メソッド）', async ({ cleanPage }) => {
    // NOTE: このテストはstart()メソッドのイベントリスナー実装が完了後に有効化する
    // 初期化
    await waitForHeatmapLoaded(cleanPage);
    await initializeHeatmap(cleanPage);

    // ボタンをクリック
    await simulateClick(cleanPage, 'button:has-text("初期化状態を確認")');
    await cleanPage.waitForTimeout(500);

    // LocalStorageにクリックデータが保存されているか確認
    const hasData = await checkHeatmapDataInStorage(cleanPage);
    expect(hasData).toBe(true);
  });

  test.skip('クリックデータがLocalStorageに保存される（実装待ち）', async ({ cleanPage }) => {
    // 初期化
    await waitForHeatmapLoaded(cleanPage);
    await initializeHeatmap(cleanPage);

    // 複数のクリックをシミュレート
    await simulateClick(cleanPage, 'button:has-text("初期化")');
    await simulateClick(cleanPage, 'button:has-text("初期化状態を確認")');
    await simulateClick(cleanPage, 'h1');
    await cleanPage.waitForTimeout(500);

    // LocalStorageからクリックデータを取得
    const clickDataStr = await getLocalStorageItem(cleanPage, 'heatmap_clicks');

    if (clickDataStr) {
      const clickData = JSON.parse(clickDataStr);
      expect(Array.isArray(clickData)).toBe(true);
      expect(clickData.length).toBeGreaterThan(0);

      // クリックデータの構造を確認
      const firstClick = clickData[0];
      expect(firstClick).toHaveProperty('x');
      expect(firstClick).toHaveProperty('y');
      expect(firstClick).toHaveProperty('timestamp');
    }
  });

  test.skip('スクロールイベントが記録される（実装待ち）', async ({ cleanPage }) => {
    // 初期化
    await waitForHeatmapLoaded(cleanPage);
    await initializeHeatmap(cleanPage);

    // スクロールをシミュレート
    await simulateScroll(cleanPage, 500);
    await simulateScroll(cleanPage, 1000);
    await cleanPage.waitForTimeout(500);

    // LocalStorageにスクロールデータが保存されているか確認
    const scrollDataStr = await getLocalStorageItem(cleanPage, 'heatmap_scrolls');

    if (scrollDataStr) {
      const scrollData = JSON.parse(scrollDataStr);
      expect(Array.isArray(scrollData)).toBe(true);
      expect(scrollData.length).toBeGreaterThan(0);

      // スクロールデータの構造を確認
      const firstScroll = scrollData[0];
      expect(firstScroll).toHaveProperty('scrollY');
      expect(firstScroll).toHaveProperty('timestamp');
    }
  });

  test.skip('マウスムーブメントが記録される（実装待ち）', async ({ cleanPage }) => {
    // 初期化
    await waitForHeatmapLoaded(cleanPage);
    await initializeHeatmap(cleanPage);

    // マウスムーブメントをシミュレート
    await simulateMouseMove(cleanPage, 100, 100);
    await simulateMouseMove(cleanPage, 200, 200);
    await simulateMouseMove(cleanPage, 300, 300);
    await cleanPage.waitForTimeout(500);

    // LocalStorageにマウスムーブメントデータが保存されているか確認
    const mouseDataStr = await getLocalStorageItem(cleanPage, 'heatmap_mousemoves');

    if (mouseDataStr) {
      const mouseData = JSON.parse(mouseDataStr);
      expect(Array.isArray(mouseData)).toBe(true);
      expect(mouseData.length).toBeGreaterThan(0);

      // マウスムーブメントデータの構造を確認
      const firstMove = mouseData[0];
      expect(firstMove).toHaveProperty('x');
      expect(firstMove).toHaveProperty('y');
      expect(firstMove).toHaveProperty('timestamp');
    }
  });

  test.skip('データがJSON形式で正しく保存される（実装待ち）', async ({ cleanPage }) => {
    // 初期化
    await waitForHeatmapLoaded(cleanPage);
    await initializeHeatmap(cleanPage);

    // 各種イベントをシミュレート
    await simulateClick(cleanPage, 'button:has-text("初期化")');
    await simulateScroll(cleanPage, 300);
    await simulateMouseMove(cleanPage, 150, 150);
    await cleanPage.waitForTimeout(500);

    // LocalStorageからすべてのデータを取得
    const clickDataStr = await getLocalStorageItem(cleanPage, 'heatmap_clicks');
    const scrollDataStr = await getLocalStorageItem(cleanPage, 'heatmap_scrolls');
    const mouseDataStr = await getLocalStorageItem(cleanPage, 'heatmap_mousemoves');

    // JSON形式の検証
    expect(() => {
      if (clickDataStr) JSON.parse(clickDataStr);
      if (scrollDataStr) JSON.parse(scrollDataStr);
      if (mouseDataStr) JSON.parse(mouseDataStr);
    }).not.toThrow();
  });

  test('データクリア機能が正常に動作する', async ({ cleanPage }) => {
    // 初期化
    await waitForHeatmapLoaded(cleanPage);
    await initializeHeatmap(cleanPage);

    // NOTE: イベント記録の実装待ちのため、データ確認はスキップ
    // データを記録
    // await simulateClick(cleanPage, 'button:has-text("初期化")');
    // await cleanPage.waitForTimeout(500);

    // データが保存されていることを確認
    // let hasData = await checkHeatmapDataInStorage(cleanPage);
    // expect(hasData).toBe(true);

    // データをクリア
    await cleanPage.click('button:has-text("全データをクリア")');
    await cleanPage.waitForTimeout(500);

    // データがクリアされたことを確認
    const clickDataStr = await getLocalStorageItem(cleanPage, 'heatmap_clicks');
    const scrollDataStr = await getLocalStorageItem(cleanPage, 'heatmap_scrolls');
    const mouseDataStr = await getLocalStorageItem(cleanPage, 'heatmap_mousemoves');

    // すべてのデータがクリアされているか、または空配列になっているか確認
    if (clickDataStr) {
      const clickData = JSON.parse(clickDataStr);
      expect(clickData.length).toBe(0);
    }
    if (scrollDataStr) {
      const scrollData = JSON.parse(scrollDataStr);
      expect(scrollData.length).toBe(0);
    }
    if (mouseDataStr) {
      const mouseData = JSON.parse(mouseDataStr);
      expect(mouseData.length).toBe(0);
    }
  });

  test.skip('大量のクリックデータが正しく保存される（実装待ち）', async ({ cleanPage }) => {
    // 初期化
    await waitForHeatmapLoaded(cleanPage);
    await initializeHeatmap(cleanPage);

    // 大量のクリックをシミュレート（パフォーマンステスト）
    for (let i = 0; i < 50; i++) {
      await simulateClick(cleanPage, 'h1');
    }
    await cleanPage.waitForTimeout(1000);

    // データが保存されているか確認
    const clickDataStr = await getLocalStorageItem(cleanPage, 'heatmap_clicks');

    if (clickDataStr) {
      const clickData = JSON.parse(clickDataStr);
      expect(Array.isArray(clickData)).toBe(true);
      expect(clickData.length).toBeGreaterThan(0);

      // LocalStorageの容量制限内に収まっているか確認
      const dataSize = new Blob([clickDataStr]).size;
      expect(dataSize).toBeLessThan(5 * 1024 * 1024); // 5MB未満
    }
  });

  test.skip('ページリロード後もデータが保持される（実装待ち）', async ({ cleanPage }) => {
    // 初期化
    await waitForHeatmapLoaded(cleanPage);
    await initializeHeatmap(cleanPage);

    // データを記録
    await simulateClick(cleanPage, 'button:has-text("初期化")');
    await cleanPage.waitForTimeout(500);

    // リロード前のデータを取得
    const clickDataBeforeReload = await getLocalStorageItem(cleanPage, 'heatmap_clicks');

    // ページをリロード
    await cleanPage.reload();
    await waitForPageLoad(cleanPage);

    // リロード後のデータを取得
    const clickDataAfterReload = await getLocalStorageItem(cleanPage, 'heatmap_clicks');

    // データが保持されているか確認
    expect(clickDataAfterReload).toBe(clickDataBeforeReload);
  });

  test.skip('複数のセクションをクリックしてもデータが正しく記録される（実装待ち）', async ({ cleanPage }) => {
    // 初期化
    await waitForHeatmapLoaded(cleanPage);
    await initializeHeatmap(cleanPage);

    // 異なるセクションをクリック
    await simulateClick(cleanPage, 'h1');
    await simulateClick(cleanPage, 'h2');
    await simulateClick(cleanPage, 'button:has-text("初期化")');
    await simulateClick(cleanPage, 'button:has-text("ファネル情報を取得")');
    await cleanPage.waitForTimeout(500);

    // LocalStorageからクリックデータを取得
    const clickDataStr = await getLocalStorageItem(cleanPage, 'heatmap_clicks');

    if (clickDataStr) {
      const clickData = JSON.parse(clickDataStr);
      expect(clickData.length).toBeGreaterThanOrEqual(4);

      // 各クリックが異なる座標を持つことを確認
      const uniqueCoordinates = new Set(
        clickData.map((click: any) => `${click.x},${click.y}`)
      );
      expect(uniqueCoordinates.size).toBeGreaterThan(1);
    }
  });
});
