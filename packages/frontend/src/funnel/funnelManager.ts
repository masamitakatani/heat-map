/**
 * ファネル定義管理モジュール
 * ファネルの作成、取得、更新を管理
 */

import type { Funnel, FunnelStep } from '../types';
import { generateUUID } from '../utils/uuid';
import { ApiClient } from '../api/client';
import { fetchFunnels, queryClient, funnelQueryKey } from '../api/queries';

/**
 * ファネル定義を作成
 */
export function createFunnel(
  name: string,
  steps: Omit<FunnelStep, 'id'>[],
  description?: string,
  connectedOneProjectId?: string
): Funnel {
  const funnel: Funnel = {
    id: generateUUID(),
    name,
    description,
    connected_one_project_id: connectedOneProjectId,
    steps: steps.map((step, index) => ({
      id: generateUUID(),
      step_order: index,
      step_name: step.step_name,
      page_url: step.page_url,
    })),
    created_at: new Date().toISOString(),
  };

  return funnel;
}

/**
 * ファネルをLocalStorageに保存
 */
export function saveFunnel(funnel: Funnel): void {
  const funnelsJson = localStorage.getItem('heatmap_funnels');
  const funnels: Funnel[] = funnelsJson ? JSON.parse(funnelsJson) : [];

  // 既存のファネルを更新または追加
  const existingIndex = funnels.findIndex((f) => f.id === funnel.id);
  if (existingIndex >= 0) {
    funnels[existingIndex] = funnel;
  } else {
    funnels.push(funnel);
  }

  localStorage.setItem('heatmap_funnels', JSON.stringify(funnels));
}

/**
 * すべてのファネルを取得（LocalStorage優先）
 */
export function getAllFunnels(): Funnel[] {
  const funnelsJson = localStorage.getItem('heatmap_funnels');
  return funnelsJson ? JSON.parse(funnelsJson) : [];
}

/**
 * APIからファネルを取得してLocalStorageに保存
 */
export async function syncFunnelsFromAPI(
  apiClient: ApiClient,
  projectId: string
): Promise<Funnel[]> {
  try {
    // TanStack Queryを使ってファネルを取得
    const funnels = await queryClient.fetchQuery({
      queryKey: funnelQueryKey(projectId),
      queryFn: () => fetchFunnels(apiClient, projectId),
    });

    // LocalStorageに保存
    if (funnels && funnels.length > 0) {
      localStorage.setItem('heatmap_funnels', JSON.stringify(funnels));
    }

    return funnels;
  } catch (error) {
    console.error('[FunnelManager] API同期エラー:', error);
    // エラー時はLocalStorageのデータを返す
    return getAllFunnels();
  }
}

/**
 * IDでファネルを取得
 */
export function getFunnelById(funnelId: string): Funnel | null {
  const funnels = getAllFunnels();
  return funnels.find((f) => f.id === funnelId) || null;
}

/**
 * ファネルを削除
 */
export function deleteFunnel(funnelId: string): void {
  const funnels = getAllFunnels();
  const filteredFunnels = funnels.filter((f) => f.id !== funnelId);
  localStorage.setItem('heatmap_funnels', JSON.stringify(filteredFunnels));
}

/**
 * 現在のURLに一致するファネルステップを検索
 */
export function findMatchingFunnelStep(currentUrl: string): {
  funnel: Funnel;
  step: FunnelStep;
} | null {
  const funnels = getAllFunnels();

  for (const funnel of funnels) {
    for (const step of funnel.steps) {
      if (isUrlMatch(currentUrl, step.page_url)) {
        return { funnel, step };
      }
    }
  }

  return null;
}

/**
 * URLマッチング（ワイルドカード対応）
 */
function isUrlMatch(currentUrl: string, pattern: string): boolean {
  // 完全一致
  if (currentUrl === pattern) {
    return true;
  }

  // ワイルドカード対応（*）
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // 特殊文字をエスケープ
    .replace(/\*/g, '.*'); // *を.*に変換

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(currentUrl);
}

/**
 * デフォルトファネルを作成（デモ用）
 */
export function createDefaultFunnels(): Funnel[] {
  const funnel1 = createFunnel(
    '商品購入フロー',
    [
      { step_name: 'LPトップ', page_url: window.location.origin + '/demo.html', step_order: 0 },
      { step_name: '申込フォーム', page_url: window.location.origin + '/form.html', step_order: 1 },
      { step_name: 'サンクスページ', page_url: window.location.origin + '/thanks.html', step_order: 2 },
    ],
    'LP訪問から購入完了までの流れ'
  );

  const funnel2 = createFunnel(
    'メール登録フロー',
    [
      { step_name: 'トップページ', page_url: window.location.origin + '/', step_order: 0 },
      { step_name: 'メール登録', page_url: window.location.origin + '/signup.html', step_order: 1 },
    ],
    'メールアドレス登録までの流れ'
  );

  return [funnel1, funnel2];
}
