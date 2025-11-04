/**
 * ファネル統計計算モジュール
 * ファネルの遷移率・離脱率を計算
 */

import type { Funnel, FunnelStats, FunnelStepStats, FunnelEvent } from '../types';
import { getFunnelById } from './funnelManager';
import { getFunnelEvents } from './funnelTracker';

/**
 * ファネル統計を計算
 */
export function calculateFunnelStats(funnelId: string): FunnelStats | null {
  const funnel = getFunnelById(funnelId);
  if (!funnel) {
    return null;
  }

  const events = getFunnelEvents(funnelId);

  // ステップごとの統計を計算
  const stepStats: FunnelStepStats[] = funnel.steps.map((step) => {
    // このステップに到達したユーザー数
    const usersEntered = countUniqueUsers(
      events.filter((e) => e.funnel_step_id === step.id)
    );

    // このステップを完了したユーザー数
    const usersCompleted = countUniqueUsers(
      events.filter((e) => e.funnel_step_id === step.id && e.completed)
    );

    // 完了率
    const completionRate = usersEntered > 0 ? (usersCompleted / usersEntered) * 100 : 0;

    // 離脱率
    const dropOffRate = 100 - completionRate;

    return {
      step_order: step.step_order,
      step_name: step.step_name,
      users_entered: usersEntered,
      users_completed: usersCompleted,
      completion_rate: Math.round(completionRate * 100) / 100,
      drop_off_rate: Math.round(dropOffRate * 100) / 100,
    };
  });

  // 全体のコンバージョン率（最初のステップから最後のステップまで）
  const firstStepUsers = stepStats[0]?.users_entered || 0;
  const lastStepUsers = stepStats[stepStats.length - 1]?.users_completed || 0;
  const overallConversionRate =
    firstStepUsers > 0 ? (lastStepUsers / firstStepUsers) * 100 : 0;

  // 日付範囲
  const timestamps = events.map((e) => new Date(e.timestamp).getTime());
  const minTimestamp = timestamps.length > 0 ? Math.min(...timestamps) : Date.now();
  const maxTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();

  return {
    funnel: {
      id: funnel.id,
      name: funnel.name,
    },
    stats: stepStats,
    overall_conversion_rate: Math.round(overallConversionRate * 100) / 100,
    date_range: {
      start: new Date(minTimestamp).toISOString(),
      end: new Date(maxTimestamp).toISOString(),
    },
  };
}

/**
 * ユニークユーザー数をカウント
 */
function countUniqueUsers(events: FunnelEvent[]): number {
  const uniqueUsers = new Set(events.map((e) => e.user_id));
  return uniqueUsers.size;
}

/**
 * すべてのファネルの統計を計算
 */
export function calculateAllFunnelStats(): FunnelStats[] {
  const funnelsJson = localStorage.getItem('heatmap_funnels');
  if (!funnelsJson) {
    return [];
  }

  const funnels: Funnel[] = JSON.parse(funnelsJson);
  return funnels
    .map((funnel) => calculateFunnelStats(funnel.id))
    .filter((stats): stats is FunnelStats => stats !== null);
}

/**
 * ボトルネックステップを特定（離脱率が最も高いステップ）
 */
export function findBottleneckStep(funnelId: string): FunnelStepStats | null {
  const stats = calculateFunnelStats(funnelId);
  if (!stats || stats.stats.length === 0) {
    return null;
  }

  // 離脱率が最も高いステップを見つける
  let maxDropOffRate = -1;
  let bottleneckStep: FunnelStepStats | null = null;

  stats.stats.forEach((step) => {
    if (step.drop_off_rate > maxDropOffRate) {
      maxDropOffRate = step.drop_off_rate;
      bottleneckStep = step;
    }
  });

  return bottleneckStep;
}

