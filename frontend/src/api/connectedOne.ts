/**
 * Connected One API Integration
 * コネクティッドワンAPIとの連携機能
 */

import { getApiClient } from './client';
import type { Funnel, ApiResponse } from '../types';

/**
 * プロジェクト設定のレスポンス型
 */
export interface ProjectSettings {
  project_id: string;
  project_name: string;
  heatmap_enabled: boolean;
  tracking_domains: string[];
  settings: {
    color_scheme: {
      high: string;
      medium: string;
      low: string;
    };
    opacity: {
      min: number;
      max: number;
    };
    sampling_rate: {
      clicks: number;
      scrolls: number;
      mousemoves: number;
    };
  };
}

/**
 * ファネル情報取得APIのレスポンス型
 */
export interface FunnelsResponse {
  project_id: string;
  funnels: Array<{
    funnel_id: string;
    funnel_name: string;
    description?: string;
    steps: Array<{
      step_index: number;
      step_name: string;
      page_url: string;
    }>;
    created_at: string;
  }>;
}

/**
 * ファネル情報を取得
 * @param projectId プロジェクトID
 */
export async function fetchFunnels(projectId: string): Promise<ApiResponse<Funnel[]>> {
  const client = getApiClient();
  const response = await client.get<FunnelsResponse>(`/funnels/${projectId}`);

  if (response.error) {
    return { error: response.error };
  }

  // レスポンスを内部型に変換
  const funnels: Funnel[] = response.data!.funnels.map((funnel) => ({
    id: funnel.funnel_id,
    name: funnel.funnel_name,
    description: funnel.description,
    steps: funnel.steps.map((step) => ({
      id: `${funnel.funnel_id}_step_${step.step_index}`,
      step_order: step.step_index,
      step_name: step.step_name,
      page_url: step.page_url,
    })),
    created_at: funnel.created_at,
  }));

  return { data: funnels };
}

/**
 * プロジェクト設定を取得
 * @param projectId プロジェクトID
 */
export async function fetchProjectSettings(
  projectId: string
): Promise<ApiResponse<ProjectSettings>> {
  const client = getApiClient();
  return client.get<ProjectSettings>(`/projects/${projectId}/settings`);
}
