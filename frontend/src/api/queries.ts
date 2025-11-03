/**
 * TanStack Query Wrapper
 * Vanilla JS環境でのTanStack Query統合
 */

import { QueryClient, QueryObserver } from '@tanstack/query-core';
import { fetchFunnels, fetchProjectSettings, type ProjectSettings } from './connectedOne';
import type { Funnel } from '../types';

/**
 * グローバルQueryClientインスタンス
 */
let queryClient: QueryClient | null = null;

/**
 * QueryClientを初期化
 */
export function initQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5分
          gcTime: 1000 * 60 * 30, // 30分（旧cacheTime）
          retry: 3,
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
      },
    });
  }
  return queryClient;
}

/**
 * QueryClientを取得
 */
export function getQueryClient(): QueryClient {
  if (!queryClient) {
    throw new Error('QueryClientが初期化されていません。initQueryClient()を先に呼び出してください。');
  }
  return queryClient;
}

/**
 * クエリキーの定義
 */
export const queryKeys = {
  funnels: (projectId: string) => ['funnels', projectId] as const,
  projectSettings: (projectId: string) => ['projectSettings', projectId] as const,
};

/**
 * ファネル情報取得クエリのオプション
 */
export interface UseFunnelsOptions {
  projectId: string;
  enabled?: boolean;
  onSuccess?: (data: Funnel[]) => void;
  onError?: (error: Error) => void;
}

/**
 * ファネル情報取得フック（Vanilla JS版）
 */
export function useFunnels(options: UseFunnelsOptions) {
  const client = getQueryClient();

  const observer = new QueryObserver<Funnel[], Error>(client, {
    queryKey: queryKeys.funnels(options.projectId),
    queryFn: async () => {
      const response = await fetchFunnels(options.projectId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data!;
    },
    enabled: options.enabled ?? true,
  });

  // サブスクライブ
  const unsubscribe = observer.subscribe((result) => {
    if (result.isSuccess && options.onSuccess) {
      options.onSuccess(result.data);
    }
    if (result.isError && options.onError) {
      options.onError(result.error);
    }
  });

  return {
    data: observer.getCurrentResult().data,
    isLoading: observer.getCurrentResult().isLoading,
    isError: observer.getCurrentResult().isError,
    error: observer.getCurrentResult().error,
    refetch: () => observer.refetch(),
    unsubscribe,
  };
}

/**
 * プロジェクト設定取得クエリのオプション
 */
export interface UseProjectSettingsOptions {
  projectId: string;
  enabled?: boolean;
  onSuccess?: (data: ProjectSettings) => void;
  onError?: (error: Error) => void;
}

/**
 * プロジェクト設定取得フック（Vanilla JS版）
 */
export function useProjectSettings(options: UseProjectSettingsOptions) {
  const client = getQueryClient();

  const observer = new QueryObserver<ProjectSettings, Error>(client, {
    queryKey: queryKeys.projectSettings(options.projectId),
    queryFn: async () => {
      const response = await fetchProjectSettings(options.projectId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data!;
    },
    enabled: options.enabled ?? true,
  });

  // サブスクライブ
  const unsubscribe = observer.subscribe((result) => {
    if (result.isSuccess && options.onSuccess) {
      options.onSuccess(result.data);
    }
    if (result.isError && options.onError) {
      options.onError(result.error);
    }
  });

  return {
    data: observer.getCurrentResult().data,
    isLoading: observer.getCurrentResult().isLoading,
    isError: observer.getCurrentResult().isError,
    error: observer.getCurrentResult().error,
    refetch: () => observer.refetch(),
    unsubscribe,
  };
}

/**
 * キャッシュを手動で無効化
 */
export function invalidateQueries(queryKey: readonly unknown[]): Promise<void> {
  const client = getQueryClient();
  return client.invalidateQueries({ queryKey });
}

/**
 * キャッシュをクリア
 */
export function clearCache(): void {
  const client = getQueryClient();
  client.clear();
}
