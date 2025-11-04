/**
 * TanStack Query Integration
 * APIクエリとミューテーション定義
 */

import { QueryClient } from '@tanstack/query-core';
import { ApiClient } from './client';
import type { Funnel } from '../types';
import type { ApiResponse } from './client';

/**
 * QueryClientインスタンス
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分間はキャッシュを新鮮とみなす
      gcTime: 10 * 60 * 1000, // 10分間キャッシュを保持（旧cacheTime）
      retry: 2, // 失敗時に2回リトライ
      refetchOnWindowFocus: false, // ウィンドウフォーカス時の自動再取得を無効化
    },
  },
});

/**
 * ファネル情報レスポンス型
 */
export interface FunnelsResponse {
  project_id: string;
  funnels: Funnel[];
}

/**
 * ファネル取得クエリ
 */
export async function fetchFunnels(
  apiClient: ApiClient,
  projectId: string
): Promise<Funnel[]> {
  const response: ApiResponse<FunnelsResponse> = await apiClient.get(
    `/api/v1/connected-one/funnels/${projectId}`
  );

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data?.funnels || [];
}

/**
 * イベント送信ペイロード型
 */
export interface EventPayload {
  event_type: string;
  project_id?: string;
  funnel_id?: string;
  user?: {
    anonymous_id: string;
    session_id: string;
  };
  funnel_data?: unknown;
  device?: unknown;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * イベント送信レスポンス型
 */
export interface EventResponse {
  status: string;
  event_id: string;
}

/**
 * イベント送信ミューテーション
 */
export async function sendEvent(
  apiClient: ApiClient,
  payload: EventPayload
): Promise<EventResponse> {
  const response: ApiResponse<EventResponse> = await apiClient.post(
    '/api/v1/connected-one/webhooks/heatmap-events',
    payload
  );

  if (response.error) {
    throw new Error(response.error.message);
  }

  if (!response.data) {
    throw new Error('イベント送信に失敗しました');
  }

  return response.data;
}

/**
 * ファネル取得用のクエリキー生成
 */
export function funnelQueryKey(projectId: string): string[] {
  return ['funnels', projectId];
}

/**
 * ファネルデータをプリフェッチ
 */
export async function prefetchFunnels(
  apiClient: ApiClient,
  projectId: string
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: funnelQueryKey(projectId),
    queryFn: () => fetchFunnels(apiClient, projectId),
  });
}

/**
 * キャッシュされたファネルデータを取得
 */
export function getCachedFunnels(projectId: string): Funnel[] | undefined {
  return queryClient.getQueryData<Funnel[]>(funnelQueryKey(projectId));
}

/**
 * ファネルキャッシュを無効化
 */
export function invalidateFunnels(projectId: string): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: funnelQueryKey(projectId),
  });
}
