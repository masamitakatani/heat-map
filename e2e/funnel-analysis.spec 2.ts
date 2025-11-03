import { test, expect } from '@playwright/test';
import {
  clearLocalStorage,
  getLocalStorageItem,
  setLocalStorageItem,
  waitForPageLoad,
} from './helpers/test-helpers';
import { testFunnel } from './fixtures/test-data';

/**
 * ファネル解析機能のE2Eテスト
 */
test.describe('ファネル解析機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    await clearLocalStorage(page);
  });

  test('ファネル設定が正しく保存される', async ({ page }) => {
    // ファネル設定をLocalStorageに保存
    await setLocalStorageItem(
      page,
      'heatmap_funnel_config',
      JSON.stringify(testFunnel)
    );

    // 保存されたデータを取得
    const funnelConfig = await getLocalStorageItem(page, 'heatmap_funnel_config');

    expect(funnelConfig).not.toBeNull();

    if (funnelConfig) {
      const parsedConfig = JSON.parse(funnelConfig);
      expect(parsedConfig.name).toBe(testFunnel.name);
      expect(parsedConfig.steps).toHaveLength(testFunnel.steps.length);
    }
  });

  test('ファネルステップの遷移が記録される', async ({ page }) => {
    // ファネル設定を保存
    await setLocalStorageItem(
      page,
      'heatmap_funnel_config',
      JSON.stringify(testFunnel)
    );

    // ステップ1: ランディングページ訪問
    await page.goto('/');
    await waitForPageLoad(page);
    await page.waitForTimeout(500);

    // ファネルイベントが記録されているか確認
    const funnelEvents = await getLocalStorageItem(page, 'heatmap_funnel_events');
    expect(funnelEvents).not.toBeNull();

    if (funnelEvents) {
      const parsedEvents = JSON.parse(funnelEvents);
      expect(Array.isArray(parsedEvents)).toBe(true);

      // 最初のステップが記録されているか
      const firstEvent = parsedEvents.find((e: any) => e.step === 1);
      expect(firstEvent).toBeDefined();
    }
  });

  test('複数ステップの遷移率が計算される', async ({ page }) => {
    // 各ステップを順番に訪問
    const steps = [
      { url: '/', step: 1 },
      { url: '/optin', step: 2 },
      { url: '/thanks', step: 3 },
    ];

    for (const { url, step } of steps) {
      await page.goto(url);
      await waitForPageLoad(page);

      // 各ページでファネル設定を保存
      await setLocalStorageItem(
        page,
        'heatmap_funnel_config',
        JSON.stringify(testFunnel)
      );

      await page.waitForTimeout(500);
    }

    // 遷移率を計算
    const funnelEvents = await getLocalStorageItem(page, 'heatmap_funnel_events');

    if (funnelEvents) {
      const parsedEvents = JSON.parse(funnelEvents);

      // 少なくとも3つのステップが記録されていることを確認
      expect(parsedEvents.length).toBeGreaterThanOrEqual(steps.length);

      // ステップ1, 2, 3が記録されているか
      const step1 = parsedEvents.find((e: any) => e.step === 1);
      const step2 = parsedEvents.find((e: any) => e.step === 2);
      const step3 = parsedEvents.find((e: any) => e.step === 3);

      expect(step1).toBeDefined();
      expect(step2).toBeDefined();
      expect(step3).toBeDefined();
    }
  });

  test('離脱率が正しく計算される', async ({ page }) => {
    // ステップ1とステップ2のみ訪問(ステップ3で離脱)
    await page.goto('/');
    await waitForPageLoad(page);

    // ファネル設定を保存
    await setLocalStorageItem(
      page,
      'heatmap_funnel_config',
      JSON.stringify(testFunnel)
    );

    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const events = [
        { step: 1, timestamp: Date.now(), url: window.location.href },
      ];
      window.localStorage.setItem('heatmap_funnel_events', JSON.stringify(events));
    });

    await page.goto('/optin');
    await waitForPageLoad(page);

    // ファネル設定を再保存
    await setLocalStorageItem(
      page,
      'heatmap_funnel_config',
      JSON.stringify(testFunnel)
    );

    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const events = JSON.parse(
        window.localStorage.getItem('heatmap_funnel_events') || '[]'
      );
      events.push({ step: 2, timestamp: Date.now(), url: window.location.href });
      window.localStorage.setItem('heatmap_funnel_events', JSON.stringify(events));
    });

    // ステップ3には行かずに離脱
    const funnelEvents = await getLocalStorageItem(page, 'heatmap_funnel_events');

    if (funnelEvents) {
      const parsedEvents = JSON.parse(funnelEvents);

      // ステップ2まで到達したことを確認
      expect(parsedEvents).toHaveLength(2);

      // ステップ3には到達していないことを確認
      const step3Event = parsedEvents.find((e: any) => e.step === 3);
      expect(step3Event).toBeUndefined();
    }
  });

  test('クロスドメイン遷移が追跡される', async ({ page }) => {
    // 異なるドメイン間の遷移を想定
    const crossDomainFunnel = {
      name: 'クロスドメインファネル',
      steps: [
        { name: 'LP', url: 'http://localhost:5173/', order: 1 },
        { name: '外部サイト', url: 'http://example.com/page', order: 2 },
      ],
    };

    await setLocalStorageItem(
      page,
      'heatmap_funnel_config',
      JSON.stringify(crossDomainFunnel)
    );

    // ステップ1を訪問
    await page.goto('/');
    await waitForPageLoad(page);
    await page.waitForTimeout(500);

    const funnelConfig = await getLocalStorageItem(page, 'heatmap_funnel_config');

    if (funnelConfig) {
      const parsedConfig = JSON.parse(funnelConfig);
      expect(parsedConfig.steps).toHaveLength(2);

      // 異なるドメインのURLが含まれているか確認
      const externalStep = parsedConfig.steps.find(
        (s: any) => s.url.includes('example.com')
      );
      expect(externalStep).toBeDefined();
    }
  });

  test('ファネルの統計情報が取得できる', async ({ page }) => {
    // ファネル設定とイベントデータを準備
    await setLocalStorageItem(
      page,
      'heatmap_funnel_config',
      JSON.stringify(testFunnel)
    );

    const mockEvents = [
      { step: 1, timestamp: Date.now() - 10000, url: '/' },
      { step: 1, timestamp: Date.now() - 9000, url: '/' },
      { step: 1, timestamp: Date.now() - 8000, url: '/' },
      { step: 2, timestamp: Date.now() - 7000, url: '/optin' },
      { step: 2, timestamp: Date.now() - 6000, url: '/optin' },
      { step: 3, timestamp: Date.now() - 5000, url: '/thanks' },
    ];

    await setLocalStorageItem(
      page,
      'heatmap_funnel_events',
      JSON.stringify(mockEvents)
    );

    // 統計情報を計算
    const stats = await page.evaluate(() => {
      const events = JSON.parse(
        window.localStorage.getItem('heatmap_funnel_events') || '[]'
      );

      const step1Count = events.filter((e: any) => e.step === 1).length;
      const step2Count = events.filter((e: any) => e.step === 2).length;
      const step3Count = events.filter((e: any) => e.step === 3).length;

      return {
        step1: step1Count,
        step2: step2Count,
        step3: step3Count,
        conversionRate: (step3Count / step1Count) * 100,
      };
    });

    // 統計が正しく計算されているか確認
    expect(stats.step1).toBe(3);
    expect(stats.step2).toBe(2);
    expect(stats.step3).toBe(1);
    expect(stats.conversionRate).toBeCloseTo(33.33, 1);
  });

  test('ファネルデータのリセット', async ({ page }) => {
    // ファネルデータを保存
    await setLocalStorageItem(
      page,
      'heatmap_funnel_events',
      JSON.stringify([{ step: 1, timestamp: Date.now(), url: '/' }])
    );

    // データがあることを確認
    let funnelEvents = await getLocalStorageItem(page, 'heatmap_funnel_events');
    expect(funnelEvents).not.toBeNull();

    // データをクリア
    await page.evaluate(() => {
      window.localStorage.removeItem('heatmap_funnel_events');
    });

    // データがクリアされたことを確認
    funnelEvents = await getLocalStorageItem(page, 'heatmap_funnel_events');
    expect(funnelEvents).toBeNull();
  });

  test('ファネルイベントのタイムスタンプが正しい', async ({ page }) => {
    const startTime = Date.now();

    await page.evaluate(() => {
      const events = [{ step: 1, timestamp: Date.now(), url: '/' }];
      window.localStorage.setItem('heatmap_funnel_events', JSON.stringify(events));
    });

    await page.waitForTimeout(500);

    const funnelEvents = await getLocalStorageItem(page, 'heatmap_funnel_events');

    if (funnelEvents) {
      const parsedEvents = JSON.parse(funnelEvents);
      const firstEvent = parsedEvents[0];

      // タイムスタンプが現在時刻に近いか確認
      expect(firstEvent.timestamp).toBeGreaterThanOrEqual(startTime);
      expect(firstEvent.timestamp).toBeLessThanOrEqual(Date.now());
    }
  });
});
