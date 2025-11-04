/**
 * Heatmap API Functions
 * ヒートマップデータ取得用のAPI関数
 */

import { getApiClient } from './client';
import type {
  PageListResponse,
  PageStatsListResponse,
  ClickHeatmapData,
  ScrollStats,
  MouseMoveHeatmapData,
} from '../types/api';

/**
 * ページ一覧を取得
 */
export async function fetchPages(): Promise<PageListResponse | null> {
  const client = getApiClient();
  const response = await client.get<PageListResponse>('/pages');

  if (response.error) {
    console.error('[API] ページ一覧取得エラー:', response.error);
    return null;
  }

  return response.data || null;
}

/**
 * ページ統計一覧を取得
 */
export async function fetchPageStats(): Promise<PageStatsListResponse | null> {
  const client = getApiClient();
  const response = await client.get<PageStatsListResponse>('/pages/stats');

  if (response.error) {
    console.error('[API] ページ統計取得エラー:', response.error);
    return null;
  }

  return response.data || null;
}

/**
 * クリックヒートマップデータを取得
 */
export async function fetchClickHeatmap(
  pageUrl: string
): Promise<ClickHeatmapData | null> {
  const client = getApiClient();
  const encodedUrl = encodeURIComponent(pageUrl);
  const response = await client.get<ClickHeatmapData>(
    `/heatmaps/clicks?page_url=${encodedUrl}`
  );

  if (response.error) {
    console.error('[API] クリックヒートマップ取得エラー:', response.error);
    return null;
  }

  return response.data || null;
}

/**
 * スクロール統計を取得
 */
export async function fetchScrollStats(
  pageUrl: string
): Promise<ScrollStats | null> {
  const client = getApiClient();
  const encodedUrl = encodeURIComponent(pageUrl);
  const response = await client.get<ScrollStats>(
    `/heatmaps/scrolls?page_url=${encodedUrl}`
  );

  if (response.error) {
    console.error('[API] スクロール統計取得エラー:', response.error);
    return null;
  }

  return response.data || null;
}

/**
 * マウスムーブヒートマップを取得
 */
export async function fetchMouseMoveHeatmap(
  pageUrl: string
): Promise<MouseMoveHeatmapData | null> {
  const client = getApiClient();
  const encodedUrl = encodeURIComponent(pageUrl);
  const response = await client.get<MouseMoveHeatmapData>(
    `/heatmaps/mouse-moves?page_url=${encodedUrl}`
  );

  if (response.error) {
    console.error('[API] マウスムーブヒートマップ取得エラー:', response.error);
    return null;
  }

  return response.data || null;
}
