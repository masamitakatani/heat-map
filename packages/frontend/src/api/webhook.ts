/**
 * Webhook送信モジュール
 * コネクティッドワンへのイベント送信
 */

import type { ApiConfig } from '../types';

/**
 * Webhookペイロード型
 */
export interface WebhookPayload {
  event_type: string;
  project_id?: string;
  [key: string]: unknown;
}

/**
 * Webhook送信キュー
 */
interface WebhookQueue {
  payload: WebhookPayload;
  timestamp: number;
  retryCount: number;
}

/**
 * Webhookクライアントクラス
 */
export class WebhookClient {
  private apiConfig: ApiConfig;
  private queue: WebhookQueue[] = [];
  private isOnline: boolean = navigator.onLine;
  private maxRetries: number = 3;

  constructor(apiConfig: ApiConfig) {
    this.apiConfig = apiConfig;

    // オンライン/オフライン監視
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // キューを復元
    this.loadQueue();
  }

  /**
   * Webhookを送信
   */
  public async send(payload: WebhookPayload): Promise<boolean> {
    if (!this.apiConfig.baseUrl || !this.apiConfig.apiKey) {
      console.warn('[Webhook] API設定が不完全です');
      return false;
    }

    // プロジェクトIDを追加
    if (this.apiConfig.projectId) {
      payload.project_id = this.apiConfig.projectId;
    }

    // オフラインの場合はキューに追加
    if (!this.isOnline) {
      this.queueWebhook(payload);
      return false;
    }

    try {
      const url = `${this.apiConfig.baseUrl}/webhooks/heatmap-events`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiConfig.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook送信失敗: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Webhook] 送信成功', data);
      return true;
    } catch (error) {
      console.error('[Webhook] 送信エラー', error);
      // エラー時はキューに追加
      this.queueWebhook(payload);
      return false;
    }
  }

  /**
   * Webhookをキューに追加
   */
  private queueWebhook(payload: WebhookPayload): void {
    this.queue.push({
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    });

    this.saveQueue();
    console.log('[Webhook] キューに追加', payload);
  }

  /**
   * キューを処理
   */
  public async flushQueue(): Promise<void> {
    if (!this.isOnline || this.queue.length === 0) {
      return;
    }

    console.log(`[Webhook] キュー処理開始: ${this.queue.length}件`);

    const failedQueue: WebhookQueue[] = [];

    for (const item of this.queue) {
      const success = await this.send(item.payload);

      if (!success) {
        item.retryCount++;

        if (item.retryCount < this.maxRetries) {
          failedQueue.push(item);
        } else {
          console.warn('[Webhook] 最大リトライ回数を超えました', item);
        }
      }
    }

    this.queue = failedQueue;
    this.saveQueue();

    console.log('[Webhook] キュー処理完了');
  }

  /**
   * キューをLocalStorageに保存
   */
  private saveQueue(): void {
    try {
      localStorage.setItem('heatmap_webhook_queue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('[Webhook] キュー保存エラー', error);
    }
  }

  /**
   * キューをLocalStorageから読み込み
   */
  private loadQueue(): void {
    try {
      const queueJson = localStorage.getItem('heatmap_webhook_queue');
      if (queueJson) {
        this.queue = JSON.parse(queueJson);
        console.log(`[Webhook] キュー復元: ${this.queue.length}件`);
      }
    } catch (error) {
      console.error('[Webhook] キュー読み込みエラー', error);
      this.queue = [];
    }
  }

  /**
   * キューをクリア
   */
  public clearQueue(): void {
    this.queue = [];
    this.saveQueue();
    console.log('[Webhook] キュークリア完了');
  }

  /**
   * キューの件数を取得
   */
  public getQueueSize(): number {
    return this.queue.length;
  }
}

/**
 * ファネル完了Webhook送信
 */
export function sendFunnelCompletedWebhook(
  client: WebhookClient,
  funnelId: string,
  funnelName: string,
  sessionId: string,
  userId: string,
  durationSeconds: number
): void {
  const payload: WebhookPayload = {
    event_type: 'funnel.completed',
    funnel_id: funnelId,
    funnel_name: funnelName,
    user: {
      anonymous_id: userId,
      session_id: sessionId,
    },
    duration_seconds: durationSeconds,
    timestamp: new Date().toISOString(),
  };

  client.send(payload);
}

/**
 * ファネル離脱Webhook送信
 */
export function sendFunnelDroppedOffWebhook(
  client: WebhookClient,
  funnelId: string,
  funnelName: string,
  sessionId: string,
  userId: string,
  dropoffStepIndex: number,
  dropoffStepName: string
): void {
  const payload: WebhookPayload = {
    event_type: 'funnel.dropped_off',
    funnel_id: funnelId,
    funnel_name: funnelName,
    user: {
      anonymous_id: userId,
      session_id: sessionId,
    },
    dropoff_step: dropoffStepIndex,
    dropoff_step_name: dropoffStepName,
    timestamp: new Date().toISOString(),
  };

  client.send(payload);
}
