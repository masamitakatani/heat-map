/**
 * ヒートマップ & ファネル解析ツール
 * メインエントリーポイント
 */

import type { HeatmapConfig } from './types';
import { loadData, saveData, createInitialData } from './storage/localStorage';
import { generateUUID } from './utils/uuid';
import { getDeviceInfo } from './utils/device';

/**
 * HeatmapAnalyticsクラス
 * グローバルAPIとして公開
 */
class HeatmapAnalytics {
  private config: HeatmapConfig;
  private sessionId: string;
  private anonymousId: string;
  private isInitialized: boolean = false;

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

    if (this.config.debug) {
      console.log('[Heatmap] 初期化完了', data);
    }

    // 自動記録開始
    if (this.config.autoStart) {
      this.start();
    }
  }

  /**
   * 記録開始
   */
  public start(): void {
    if (!this.isInitialized) {
      console.error('[Heatmap] 初期化されていません。init()を先に呼び出してください。');
      return;
    }

    if (this.config.debug) {
      console.log('[Heatmap] 記録開始');
    }

    // Phase 4で実装予定:
    // - イベントリスナー登録
    // - オーバーレイUI表示
  }

  /**
   * 記録停止
   */
  public stop(): void {
    if (this.config.debug) {
      console.log('[Heatmap] 記録停止');
    }

    // Phase 4で実装予定:
    // - イベントリスナー解除
  }

  /**
   * データクリア
   */
  public clearData(): void {
    const confirmed = confirm('記録したデータを削除しますか？この操作は元に戻せません。');
    if (confirmed) {
      const data = createInitialData(this.anonymousId, this.sessionId);
      saveData(data);
      console.log('[Heatmap] データをクリアしました');
    }
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
}

// グローバルに公開
if (typeof window !== 'undefined') {
  (window as any).HeatmapAnalytics = HeatmapAnalytics;
}

export default HeatmapAnalytics;
