/**
 * ヒートマップ & ファネル解析ツール
 * メインエントリーポイント
 */

import type { HeatmapConfig, ClickEvent, ScrollEvent, MouseMoveEvent } from './types';
import { loadData, saveData, createInitialData } from './storage/localStorage';
import { generateUUID } from './utils/uuid';
import { getDeviceInfo } from './utils/device';
import { ClickTracker } from './tracking/clickTracker';
import { ScrollTracker } from './tracking/scrollTracker';
import { MouseMoveTracker } from './tracking/mouseMoveTracker';
import { HeatmapRenderer } from './renderer/heatmapRenderer';
import { OverlayUI, type HeatmapMode } from './ui/overlay';
import { FunnelTracker } from './funnel/funnelTracker';
import { FunnelRenderer } from './renderer/funnelRenderer';
import { calculateFunnelStats, calculateAllFunnelStats } from './funnel/funnelAnalytics';
import { getAllFunnels, createDefaultFunnels, saveFunnel } from './funnel/funnelManager';
import { WebhookClient } from './api/webhook';
import { showToast } from './ui/toast';
import { showLoading, hideLoading } from './ui/loading';
import { ApiClient } from './api/client';
import { syncFunnelsFromAPI } from './funnel/funnelManager';

/**
 * HeatmapAnalyticsクラス
 * グローバルAPIとして公開
 */
class HeatmapAnalytics {
  private config: HeatmapConfig;
  private sessionId: string;
  private anonymousId: string;
  private isInitialized: boolean = false;
  private isTracking: boolean = false;

  // トラッカー
  private clickTracker: ClickTracker;
  private scrollTracker: ScrollTracker;
  private mouseMoveTracker: MouseMoveTracker;
  private funnelTracker: FunnelTracker;

  // レンダラー
  private heatmapRenderer: HeatmapRenderer;
  private funnelRenderer: FunnelRenderer;

  // UI
  private overlayUI: OverlayUI;

  // API連携
  private apiClient: ApiClient | null = null;
  private webhookClient: WebhookClient | null = null;
  private syncIntervalId: number | null = null;

  constructor(config: HeatmapConfig = {}) {
    this.config = {
      autoStart: true,
      samplingInterval: {
        mousemove: 100, // 100ms
        scroll: 200, // 200ms
      },
      debug: false,
      overlay: {
        initialVisible: false,
        initialMode: 'click',
      },
      ...config,
    };

    // セッションID・匿名IDの初期化
    this.sessionId = generateUUID();
    this.anonymousId = this.getOrCreateAnonymousId();

    // トラッカー初期化
    this.clickTracker = new ClickTracker();
    this.scrollTracker = new ScrollTracker();
    this.mouseMoveTracker = new MouseMoveTracker();
    this.funnelTracker = new FunnelTracker(this.sessionId, this.anonymousId);

    // レンダラー初期化
    this.heatmapRenderer = new HeatmapRenderer();
    this.funnelRenderer = new FunnelRenderer();

    // API初期化（API設定がある場合）
    if (config.api?.baseUrl && config.api?.apiKey) {
      this.apiClient = new ApiClient(config.api);
      this.webhookClient = new WebhookClient(config.api);

      if (this.config.debug) {
        console.log('[Heatmap] API連携を有効化しました', {
          baseUrl: config.api.baseUrl,
          projectId: config.api.projectId,
        });
      }
    }

    // オーバーレイUI初期化
    const data = loadData();
    this.overlayUI = new OverlayUI(
      {
        onModeChange: (mode: HeatmapMode) => this.handleModeChange(mode),
        onToggleVisibility: (isVisible: boolean) => this.handleToggleVisibility(isVisible),
        onClearData: () => this.handleClearData(),
        onShowFunnel: () => this.handleShowFunnel(),
        getDataCount: () => this.getDataCount(),
      },
      data?.overlayPosition
    );

    if (this.config.debug) {
      console.log('[Heatmap] 初期化開始', {
        sessionId: this.sessionId,
        anonymousId: this.anonymousId,
        device: getDeviceInfo(),
      });
    }
  }

  /**
   * 匿名IDを取得または生成
   */
  private getOrCreateAnonymousId(): string {
    const data = loadData();
    if (data?.anonymousId) {
      return data.anonymousId;
    }
    return generateUUID();
  }

  /**
   * 初期化
   */
  public init(): void {
    if (this.isInitialized) {
      console.warn('[Heatmap] 既に初期化済みです');
      return;
    }

    // LocalStorageからデータ読み込み
    let data = loadData();
    if (!data) {
      // 初回訪問: 初期データ作成
      data = createInitialData(this.anonymousId, this.sessionId);
      saveData(data);
    } else {
      // 2回目以降: セッションIDを更新
      data.sessionId = this.sessionId;
      saveData(data);
    }

    this.isInitialized = true;

    // ファネル初期化（デフォルトファネルを作成）
    this.initializeFunnels();

    // オーバーレイUI表示
    this.overlayUI.init();
    if (this.config.overlay?.initialVisible) {
      this.overlayUI.show();
    }

    if (this.config.debug) {
      console.log('[Heatmap] 初期化完了', data);
    }

    // 自動記録開始
    if (this.config.autoStart) {
      this.start();
    }

    // イベント同期を開始（1分間隔）
    this.setupEventSync();
  }

  /**
   * ファネルを初期化
   */
  private async initializeFunnels(): Promise<void> {
    // API連携が有効な場合、まずAPIから同期を試みる
    if (this.apiClient && this.config.api?.projectId) {
      try {
        const funnels = await syncFunnelsFromAPI(this.apiClient, this.config.api.projectId);

        if (this.config.debug) {
          console.log('[Heatmap] APIからファネル同期完了', funnels);
        }

        // 同期成功した場合はreturn
        if (funnels.length > 0) {
          return;
        }
      } catch (error) {
        console.warn('[Heatmap] ファネル同期失敗、LocalStorageにフォールバック', error);
      }
    }

    // API連携なし、またはAPI同期失敗時はLocalStorageから取得
    const funnels = getAllFunnels();

    // ファネルが存在しない場合はデフォルトファネルを作成
    if (funnels.length === 0) {
      const defaultFunnels = createDefaultFunnels();
      defaultFunnels.forEach((funnel) => saveFunnel(funnel));

      if (this.config.debug) {
        console.log('[Heatmap] デフォルトファネル作成', defaultFunnels);
      }
    }
  }

  /**
   * 記録開始
   */
  public start(): void {
    if (!this.isInitialized) {
      console.error('[Heatmap] 初期化されていません。init()を先に呼び出してください。');
      showToast({
        type: 'error',
        message: '初期化されていません',
      });
      return;
    }

    if (this.isTracking) {
      console.warn('[Heatmap] 既にトラッキング中です');
      return;
    }

    // クリックトラッキング開始
    this.clickTracker.start((clickEvent: ClickEvent) => {
      this.saveClickEvent(clickEvent);
    });

    // スクロールトラッキング開始
    this.scrollTracker.start(
      (scrollEvent: ScrollEvent) => {
        this.saveScrollEvent(scrollEvent);
      },
      this.config.samplingInterval?.scroll || 200
    );

    // マウスムーブメントトラッキング開始
    this.mouseMoveTracker.start(
      (mouseMoveEvent: MouseMoveEvent) => {
        this.saveMouseMoveEvent(mouseMoveEvent);
      },
      0.1, // 10%サンプリング
      this.config.samplingInterval?.mousemove || 100
    );

    // ファネルトラッキング開始
    this.funnelTracker.start();

    this.isTracking = true;

    if (this.config.debug) {
      console.log('[Heatmap] 記録開始');
    }

    showToast({
      type: 'success',
      message: '記録を開始しました',
      duration: 2000,
    });
  }

  /**
   * 記録停止
   */
  public stop(): void {
    if (!this.isTracking) {
      return;
    }

    this.clickTracker.stop();
    this.scrollTracker.stop();
    this.mouseMoveTracker.stop();
    this.funnelTracker.stop();

    this.isTracking = false;

    if (this.config.debug) {
      console.log('[Heatmap] 記録停止');
    }
  }

  /**
   * クリックイベントを保存
   */
  private saveClickEvent(clickEvent: ClickEvent): void {
    const data = loadData();
    if (!data) return;

    data.pendingEvents.clicks.push(clickEvent);
    saveData(data);

    if (this.config.debug) {
      console.log('[Heatmap] クリックイベント記録', clickEvent);
    }
  }

  /**
   * スクロールイベントを保存
   */
  private saveScrollEvent(scrollEvent: ScrollEvent): void {
    const data = loadData();
    if (!data) return;

    data.pendingEvents.scrolls.push(scrollEvent);
    saveData(data);

    if (this.config.debug) {
      console.log('[Heatmap] スクロールイベント記録', scrollEvent);
    }
  }

  /**
   * マウスムーブメントイベントを保存
   */
  private saveMouseMoveEvent(mouseMoveEvent: MouseMoveEvent): void {
    const data = loadData();
    if (!data) return;

    data.pendingEvents.mouseMoves.push(mouseMoveEvent);
    saveData(data);

    if (this.config.debug) {
      console.log('[Heatmap] マウスムーブメントイベント記録', mouseMoveEvent);
    }
  }

  /**
   * モード変更ハンドラー
   */
  private handleModeChange(mode: HeatmapMode): void {
    // 現在のヒートマップが表示されている場合は更新
    const data = loadData();
    if (data && data.overlayState.isVisible) {
      this.renderHeatmap(mode);
    }

    // モードを保存
    if (data) {
      data.overlayState.mode = mode;
      saveData(data);
    }

    if (this.config.debug) {
      console.log('[Heatmap] モード変更:', mode);
    }
  }

  /**
   * 表示切替ハンドラー
   */
  private handleToggleVisibility(isVisible: boolean): void {
    const data = loadData();
    if (!data) return;

    data.overlayState.isVisible = isVisible;
    saveData(data);

    if (isVisible) {
      const mode = this.overlayUI.getCurrentMode();
      this.renderHeatmap(mode);
    } else {
      this.heatmapRenderer.hide();
    }

    if (this.config.debug) {
      console.log('[Heatmap] 表示切替:', isVisible);
    }
  }

  /**
   * データクリアハンドラー
   */
  private handleClearData(): void {
    showLoading('データをクリアしています...');

    setTimeout(() => {
      const data = createInitialData(this.anonymousId, this.sessionId);
      saveData(data);

      // ヒートマップをクリア
      this.heatmapRenderer.clear();

      // 統計を更新
      this.overlayUI.refreshStats();

      hideLoading();

      showToast({
        type: 'success',
        message: 'データをクリアしました',
        duration: 2000,
      });

      if (this.config.debug) {
        console.log('[Heatmap] データクリア完了');
      }
    }, 500);
  }

  /**
   * ヒートマップを描画
   */
  private renderHeatmap(mode: HeatmapMode): void {
    const data = loadData();
    if (!data) return;

    this.heatmapRenderer.show();

    switch (mode) {
      case 'click':
        this.heatmapRenderer.renderClickHeatmap(data.pendingEvents.clicks);
        break;
      case 'scroll':
        this.heatmapRenderer.renderScrollHeatmap(data.pendingEvents.scrolls);
        break;
      case 'mouse':
        this.heatmapRenderer.renderMouseMoveHeatmap(data.pendingEvents.mouseMoves);
        break;
      case 'funnel':
        this.handleShowFunnel();
        break;
    }

    if (this.config.debug) {
      console.log('[Heatmap] ヒートマップ描画:', mode);
    }
  }

  /**
   * ファネル表示ハンドラー
   */
  private handleShowFunnel(): void {
    const funnels = getAllFunnels();

    if (funnels.length === 0) {
      showToast({
        type: 'warning',
        message: 'ファネルが定義されていません',
      });
      return;
    }

    showLoading('ファネルデータを読み込んでいます...');

    setTimeout(() => {
      // 最初のファネルの統計を表示
      const funnelId = funnels[0].id;
      const stats = calculateFunnelStats(funnelId);

      hideLoading();

      if (stats && stats.stats.length > 0 && stats.stats.some(s => s.users_entered > 0)) {
        this.funnelRenderer.render(stats);

        showToast({
          type: 'info',
          message: 'ファネルを表示しました',
          duration: 2000,
        });

        if (this.config.debug) {
          console.log('[Heatmap] ファネル表示', stats);
        }
      } else {
        showToast({
          type: 'warning',
          message: 'ファネルデータがまだありません。ページを遷移してデータを蓄積してください。',
          duration: 3000,
        });
      }
    }, 800);
  }

  /**
   * データ件数を取得
   */
  private getDataCount(): { clicks: number; scrolls: number; mouseMoves: number } {
    const data = loadData();
    if (!data) {
      return { clicks: 0, scrolls: 0, mouseMoves: 0 };
    }

    return {
      clicks: data.pendingEvents.clicks.length,
      scrolls: data.pendingEvents.scrolls.length,
      mouseMoves: data.pendingEvents.mouseMoves.length,
    };
  }

  /**
   * データクリア
   */
  public clearData(): void {
    this.handleClearData();
  }

  /**
   * 設定取得
   */
  public getConfig(): HeatmapConfig {
    return { ...this.config };
  }

  /**
   * セッションID取得
   */
  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * 匿名ID取得
   */
  public getAnonymousId(): string {
    return this.anonymousId;
  }

  /**
   * イベント同期セットアップ（1分間隔でバックエンドに送信）
   */
  private setupEventSync(): void {
    if (!this.webhookClient) {
      return;
    }

    // 1分ごとに未送信イベントをバックエンドに送信
    this.syncIntervalId = window.setInterval(() => {
      this.syncEventsToBackend();
    }, 60000); // 60秒間隔

    if (this.config.debug) {
      console.log('[Heatmap] イベント同期開始（60秒間隔）');
    }
  }

  /**
   * イベントをバックエンドに同期
   */
  private async syncEventsToBackend(): Promise<void> {
    if (!this.webhookClient) {
      return;
    }

    const data = loadData();
    if (!data || !data.pendingEvents) {
      return;
    }

    const { clicks, scrolls, mouseMoves } = data.pendingEvents;

    // イベントが存在する場合のみ送信
    if (clicks.length === 0 && scrolls.length === 0 && mouseMoves.length === 0) {
      return;
    }

    try {
      // バッチでイベント送信
      const success = await this.webhookClient.send({
        event_type: 'analytics.batch',
        project_id: this.config.api?.projectId,
        user: {
          anonymous_id: this.anonymousId,
          session_id: this.sessionId,
        },
        events: {
          clicks: clicks.length,
          scrolls: scrolls.length,
          mouseMoves: mouseMoves.length,
        },
        timestamp: new Date().toISOString(),
      });

      if (success && this.config.debug) {
        console.log('[Heatmap] イベント送信成功', {
          clicks: clicks.length,
          scrolls: scrolls.length,
          mouseMoves: mouseMoves.length,
        });
      }
    } catch (error) {
      console.error('[Heatmap] イベント送信エラー', error);
    }
  }

  /**
   * クリーンアップ
   */
  public destroy(): void {
    this.stop();
    this.heatmapRenderer.destroy();
    this.funnelRenderer.destroy();
    this.overlayUI.destroy();

    // イベント同期を停止
    if (this.syncIntervalId !== null) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  /**
   * ファネル一覧を取得
   */
  public getFunnels() {
    return getAllFunnels();
  }

  /**
   * ファネル統計を取得
   */
  public getFunnelStats(funnelId: string) {
    return calculateFunnelStats(funnelId);
  }

  /**
   * すべてのファネル統計を取得
   */
  public getAllFunnelStats() {
    return calculateAllFunnelStats();
  }

  /**
   * オーバーレイUIの統計を更新
   */
  public refreshOverlayStats(): void {
    this.overlayUI.refreshStats();
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  (window as any).HeatmapAnalytics = HeatmapAnalytics;
}

export default HeatmapAnalytics;
