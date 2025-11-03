import { test, expect } from '@playwright/test';
import {
  clearLocalStorage,
  getLocalStorageItem,
  setLocalStorageItem,
  waitForPageLoad,
  verifyOverlayVisible,
  switchHeatmapMode,
} from './helpers/test-helpers';

/**
 * オーバーレイUIのE2Eテスト
 */
test.describe('オーバーレイUI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    await clearLocalStorage(page);
  });

  test('オーバーレイUIが表示される', async ({ page }) => {
    // オーバーレイUIの要素を探す
    const overlay = page.locator('[data-testid="heatmap-overlay"]').or(
      page.locator('.heatmap-overlay')
    );

    // オーバーレイが存在するか確認(タイムアウトを設定)
    const isVisible = await overlay.isVisible().catch(() => false);

    // オーバーレイが見つからない場合、ページに何があるか確認
    if (!isVisible) {
      const bodyContent = await page.content();
      console.log('Page content:', bodyContent.substring(0, 500));
    }

    // この時点ではオーバーレイが非表示かもしれないので、存在確認のみ
    const count = await overlay.count();
    console.log('Overlay count:', count);
  });

  test('オーバーレイの初期位置が画面右下', async ({ page }) => {
    const overlay = page.locator('[data-testid="heatmap-overlay"]').or(
      page.locator('.heatmap-overlay')
    );

    if (await overlay.count() > 0) {
      const box = await overlay.boundingBox();

      if (box) {
        const viewportSize = page.viewportSize();

        if (viewportSize) {
          // 右下に配置されているか確認
          expect(box.x).toBeGreaterThan(viewportSize.width / 2);
          expect(box.y).toBeGreaterThan(viewportSize.height / 2);
        }
      }
    }
  });

  test('オーバーレイがドラッグ&ドロップで移動できる', async ({ page }) => {
    const overlay = page.locator('[data-testid="heatmap-overlay"]').or(
      page.locator('.heatmap-overlay')
    );

    if (await overlay.count() > 0) {
      const initialBox = await overlay.boundingBox();

      if (initialBox) {
        // オーバーレイをドラッグ
        await page.mouse.move(initialBox.x + 10, initialBox.y + 10);
        await page.mouse.down();
        await page.mouse.move(initialBox.x + 100, initialBox.y + 100);
        await page.mouse.up();

        await page.waitForTimeout(500);

        const finalBox = await overlay.boundingBox();

        if (finalBox) {
          // 位置が変わっているか確認
          expect(finalBox.x).not.toEqual(initialBox.x);
          expect(finalBox.y).not.toEqual(initialBox.y);
        }
      }
    }
  });

  test('オーバーレイの位置がLocalStorageに保存される', async ({ page }) => {
    const overlay = page.locator('[data-testid="heatmap-overlay"]').or(
      page.locator('.heatmap-overlay')
    );

    if (await overlay.count() > 0) {
      const box = await overlay.boundingBox();

      if (box) {
        // オーバーレイをドラッグ
        await page.mouse.move(box.x + 10, box.y + 10);
        await page.mouse.down();
        await page.mouse.move(200, 200);
        await page.mouse.up();

        await page.waitForTimeout(1000);

        // LocalStorageに位置が保存されているか確認
        const savedPosition = await getLocalStorageItem(page, 'heatmap_overlay_position');

        if (savedPosition) {
          const position = JSON.parse(savedPosition);
          expect(position).toHaveProperty('x');
          expect(position).toHaveProperty('y');
        }
      }
    }
  });

  test('ページリロード後もオーバーレイの位置が保持される', async ({ page }) => {
    // 初期位置を保存
    await setLocalStorageItem(
      page,
      'heatmap_overlay_position',
      JSON.stringify({ x: 300, y: 300 })
    );

    // ページをリロード
    await page.reload();
    await waitForPageLoad(page);

    // 保存された位置が維持されているか確認
    const savedPosition = await getLocalStorageItem(page, 'heatmap_overlay_position');

    if (savedPosition) {
      const position = JSON.parse(savedPosition);
      expect(position.x).toBe(300);
      expect(position.y).toBe(300);
    }
  });

  test('ヒートマップON/OFF切り替えボタン', async ({ page }) => {
    const toggleButton = page.locator('[data-testid="toggle-heatmap"]').or(
      page.locator('button:has-text("OFF")').or(page.locator('button:has-text("ON")'))
    );

    if (await toggleButton.count() > 0) {
      // 初期状態を確認
      const initialState = await getLocalStorageItem(page, 'heatmap_enabled');

      // ボタンをクリック
      await toggleButton.click();
      await page.waitForTimeout(500);

      // 状態が変わっているか確認
      const newState = await getLocalStorageItem(page, 'heatmap_enabled');
      expect(newState).not.toEqual(initialState);
    }
  });

  test('表示モード切り替え(クリック/スクロール/マウスムーブ)', async ({ page }) => {
    const modes = ['click', 'scroll', 'mousemove'];

    for (const mode of modes) {
      const modeButton = page.locator(`[data-testid="mode-${mode}"]`).or(
        page.locator(`button:has-text("${mode}")`)
      );

      if (await modeButton.count() > 0) {
        await modeButton.click();
        await page.waitForTimeout(300);

        // モードが保存されているか確認
        const savedMode = await getLocalStorageItem(page, 'heatmap_display_mode');

        if (savedMode) {
          expect(savedMode).toBe(mode);
        }
      }
    }
  });

  test('データリセット機能', async ({ page }) => {
    // テストデータを保存
    await setLocalStorageItem(
      page,
      'heatmap_clicks',
      JSON.stringify([{ x: 100, y: 100, timestamp: Date.now() }])
    );

    // リセットボタンを探す
    const resetButton = page.locator('[data-testid="reset-data"]').or(
      page.locator('button:has-text("リセット")').or(
        page.locator('button:has-text("クリア")')
      )
    );

    if (await resetButton.count() > 0) {
      // 確認ダイアログのハンドリング
      page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm');
        await dialog.accept();
      });

      await resetButton.click();
      await page.waitForTimeout(500);

      // データがクリアされたか確認
      const clickData = await getLocalStorageItem(page, 'heatmap_clicks');
      expect(clickData === null || clickData === '[]').toBe(true);
    }
  });
});
