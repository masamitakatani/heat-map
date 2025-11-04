/**
 * イベント送信API
 * バックエンドAPIにイベントデータを送信
 */

import type { ClickEvent, ScrollEvent, MouseMoveEvent } from '../types';
import { getApiClient } from './client';

/**
 * イベントバッチ送信レスポンス
 */
interface EventBatchResponse {
  inserted: number;
  message: string;
}

/**
 * クリックイベントバッチ
 */
interface ClickEventBatch {
  session_id: string;
  page_url: string;
  events: ClickEvent[];
}

/**
 * スクロールイベントバッチ
 */
interface ScrollEventBatch {
  session_id: string;
  page_url: string;
  events: ScrollEvent[];
}

/**
 * マウスムーブイベントバッチ
 */
interface MouseMoveEventBatch {
  session_id: string;
  page_url: string;
  events: MouseMoveEvent[];
}

/**
 * クリックイベントを送信
 */
export async function sendClickEvents(
  sessionId: string,
  pageUrl: string,
  events: ClickEvent[]
): Promise<boolean> {
  if (events.length === 0) {
    return true;
  }

  const client = getApiClient();

  const batch: ClickEventBatch = {
    session_id: sessionId,
    page_url: pageUrl,
    events,
  };

  const response = await client.post<EventBatchResponse>('/events/clicks', batch);

  if (response.error) {
    console.error('[Heatmap] クリックイベント送信エラー:', response.error);
    return false;
  }

  console.log(`[Heatmap] クリックイベント送信成功: ${response.data?.inserted}件`);
  return true;
}

/**
 * スクロールイベントを送信
 */
export async function sendScrollEvents(
  sessionId: string,
  pageUrl: string,
  events: ScrollEvent[]
): Promise<boolean> {
  if (events.length === 0) {
    return true;
  }

  const client = getApiClient();

  const batch: ScrollEventBatch = {
    session_id: sessionId,
    page_url: pageUrl,
    events,
  };

  const response = await client.post<EventBatchResponse>('/events/scrolls', batch);

  if (response.error) {
    console.error('[Heatmap] スクロールイベント送信エラー:', response.error);
    return false;
  }

  console.log(`[Heatmap] スクロールイベント送信成功: ${response.data?.inserted}件`);
  return true;
}

/**
 * マウスムーブイベントを送信
 */
export async function sendMouseMoveEvents(
  sessionId: string,
  pageUrl: string,
  events: MouseMoveEvent[]
): Promise<boolean> {
  if (events.length === 0) {
    return true;
  }

  const client = getApiClient();

  const batch: MouseMoveEventBatch = {
    session_id: sessionId,
    page_url: pageUrl,
    events,
  };

  const response = await client.post<EventBatchResponse>('/events/mouse-moves', batch);

  if (response.error) {
    console.error('[Heatmap] マウスムーブイベント送信エラー:', response.error);
    return false;
  }

  console.log(`[Heatmap] マウスムーブイベント送信成功: ${response.data?.inserted}件`);
  return true;
}
