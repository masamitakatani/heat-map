/**
 * Webhook API
 * コネクティッドワンへのイベント送信
 */

import { getApiClient } from './client';
import type { ApiResponse, DeviceType } from '../types';

/**
 * Webhookイベントタイプ
 */
export type WebhookEventType =
  | 'funnel.completed'
  | 'funnel.dropped_off'
  | 'click.high_frequency'
  | 'scroll.low_engagement';

/**
 * 基本Webhookペイロード
 */
interface BaseWebhookPayload {
  event_type: WebhookEventType;
  project_id: string;
  timestamp: string;
}

/**
 * ファネル完了イベント
 */
export interface FunnelCompletedPayload extends BaseWebhookPayload {
  event_type: 'funnel.completed';
  funnel_id: string;
  user: {
    anonymous_id: string;
    session_id: string;
  };
  funnel_data: {
    funnel_name: string;
    total_steps: number;
    completed_steps: number[];
    started_at: string;
    completed_at: string;
    duration_seconds: number;
  };
  device: {
    type: DeviceType;
    viewport_width: number;
    viewport_height: number;
  };
}

/**
 * ファネル離脱イベント
 */
export interface FunnelDroppedOffPayload extends BaseWebhookPayload {
  event_type: 'funnel.dropped_off';
  funnel_id: string;
  user: {
    anonymous_id: string;
    session_id: string;
  };
  funnel_data: {
    funnel_name: string;
    total_steps: number;
    completed_steps: number[];
    dropoff_step: number;
    dropoff_step_name: string;
    started_at: string;
    dropped_at: string;
    duration_seconds: number;
  };
  device: {
    type: DeviceType;
    viewport_width: number;
    viewport_height: number;
  };
}

/**
 * 高頻度クリックイベント
 */
export interface HighFrequencyClickPayload extends BaseWebhookPayload {
  event_type: 'click.high_frequency';
  page_url: string;
  element: {
    tag_name: string;
    id?: string;
    class_name?: string;
    text?: string;
  };
  click_data: {
    total_clicks: number;
    unique_sessions: number;
    time_window_minutes: number;
  };
}

/**
 * 低スクロール率アラート
 */
export interface LowScrollEngagementPayload extends BaseWebhookPayload {
  event_type: 'scroll.low_engagement';
  page_url: string;
  scroll_data: {
    average_depth_percent: number;
    bounce_rate: number;
    total_sessions: number;
    time_window_hours: number;
  };
}

/**
 * Webhookペイロード型の統合
 */
export type WebhookPayload =
  | FunnelCompletedPayload
  | FunnelDroppedOffPayload
  | HighFrequencyClickPayload
  | LowScrollEngagementPayload;

/**
 * Webhook送信レスポンス
 */
interface WebhookResponse {
  status: string;
  event_id: string;
}

/**
 * LocalStorageキュー用のアイテム
 */
interface QueuedWebhook {
  id: string;
  payload: WebhookPayload;
  retryCount: number;
  queuedAt: string;
}

/**
 * Webhookキューのキー
 */
const WEBHOOK_QUEUE_KEY = 'heatmap_webhook_queue';

/**
 * 最大リトライ回数
 */
const MAX_RETRY_COUNT = 3;

/**
 * HMAC-SHA256署名を生成
 */
async function generateWebhookSignature(
  payload: WebhookPayload,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const keyData = encoder.encode(secret);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, data);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Webhookを送信
 */
export async function sendWebhook(payload: WebhookPayload): Promise<ApiResponse<WebhookResponse>> {
  const client = getApiClient();

  try {
    // 署名生成（実際の実装では、APIキーやWebhookシークレットを使用）
    const config = client.getConfig();
    const signature = await generateWebhookSignature(payload, config.apiKey || '');

    // Webhookエンドポイントに送信
    const response = await fetch(`${config.baseUrl}/webhooks/heatmap-events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Webhook-Signature': signature,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: {
          code: errorData.error?.code || 'WEBHOOK_ERROR',
          message: errorData.error?.message || `Webhook送信失敗: ${response.status}`,
        },
      };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    // エラー時はキューに追加
    queueWebhook(payload);

    return {
      error: {
        code: 'NETWORK_ERROR',
        message: 'Webhookをキューに追加しました。オンライン復帰時に再送信されます。',
      },
    };
  }
}

/**
 * Webhookをキューに追加
 */
export function queueWebhook(payload: WebhookPayload): void {
  try {
    const queue = getWebhookQueue();
    const queuedWebhook: QueuedWebhook = {
      id: crypto.randomUUID(),
      payload,
      retryCount: 0,
      queuedAt: new Date().toISOString(),
    };
    queue.push(queuedWebhook);
    localStorage.setItem(WEBHOOK_QUEUE_KEY, JSON.stringify(queue));
    console.log('[Webhook] キューに追加しました:', queuedWebhook.id);
  } catch (error) {
    console.error('[Webhook] キューへの追加に失敗:', error);
  }
}

/**
 * Webhookキューを取得
 */
function getWebhookQueue(): QueuedWebhook[] {
  try {
    const data = localStorage.getItem(WEBHOOK_QUEUE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('[Webhook] キューの読み込みに失敗:', error);
    return [];
  }
}

/**
 * キューからWebhookを削除
 */
function removeFromQueue(id: string): void {
  try {
    const queue = getWebhookQueue();
    const filtered = queue.filter((item) => item.id !== id);
    localStorage.setItem(WEBHOOK_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[Webhook] キューからの削除に失敗:', error);
  }
}

/**
 * Webhookキューをフラッシュ（全て送信）
 */
export async function flushWebhookQueue(): Promise<void> {
  const queue = getWebhookQueue();

  if (queue.length === 0) {
    console.log('[Webhook] キューは空です');
    return;
  }

  console.log(`[Webhook] ${queue.length}件のキューを処理中...`);

  for (const item of queue) {
    // リトライ回数チェック
    if (item.retryCount >= MAX_RETRY_COUNT) {
      console.warn('[Webhook] 最大リトライ回数に達しました。スキップします:', item.id);
      removeFromQueue(item.id);
      continue;
    }

    // 再送信
    const response = await sendWebhook(item.payload);

    if (response.error) {
      // 失敗時はリトライカウントを増やす
      item.retryCount++;
      console.warn(`[Webhook] 送信失敗 (retry: ${item.retryCount}/${MAX_RETRY_COUNT}):`, item.id);
    } else {
      // 成功時はキューから削除
      console.log('[Webhook] 送信成功:', item.id);
      removeFromQueue(item.id);
    }
  }

  console.log('[Webhook] キュー処理完了');
}

/**
 * オンライン復帰時のリスナーを登録
 */
export function registerOnlineListener(): void {
  window.addEventListener('online', () => {
    console.log('[Webhook] ネットワーク復帰を検知。キューをフラッシュします。');
    flushWebhookQueue();
  });
}
