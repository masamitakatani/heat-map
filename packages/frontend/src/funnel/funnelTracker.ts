/**
 * ファネルトラッキングモジュール
 * ファネルの進行状況を追跡
 */

import type { Funnel, FunnelStep, FunnelEvent } from '../types';
import { findMatchingFunnelStep } from './funnelManager';

/**
 * ファネルイベントを作成
 */
export function createFunnelEvent(
  funnel: Funnel,
  step: FunnelStep,
  sessionId: string,
  userId: string,
  completed: boolean,
  droppedOff: boolean
): FunnelEvent {
  return {
    funnel_id: funnel.id,
    funnel_step_id: step.id,
    session_id: sessionId,
    user_id: userId,
    completed,
    dropped_off: droppedOff,
    timestamp: new Date().toISOString(),
  };
}

/**
 * ファネルイベントをLocalStorageに保存
 */
export function saveFunnelEvent(event: FunnelEvent): void {
  const eventsJson = localStorage.getItem('heatmap_funnel_events');
  const events: FunnelEvent[] = eventsJson ? JSON.parse(eventsJson) : [];

  events.push(event);

  localStorage.setItem('heatmap_funnel_events', JSON.stringify(events));
}

/**
 * すべてのファネルイベントを取得
 */
export function getAllFunnelEvents(): FunnelEvent[] {
  const eventsJson = localStorage.getItem('heatmap_funnel_events');
  return eventsJson ? JSON.parse(eventsJson) : [];
}

/**
 * 特定のファネルのイベントを取得
 */
export function getFunnelEvents(funnelId: string): FunnelEvent[] {
  const events = getAllFunnelEvents();
  return events.filter((e) => e.funnel_id === funnelId);
}

/**
 * ファネルトラッカークラス
 */
export class FunnelTracker {
  private sessionId: string;
  private userId: string;
  private currentFunnel: Funnel | null = null;
  private currentStep: FunnelStep | null = null;
  private isTracking: boolean = false;

  constructor(sessionId: string, userId: string) {
    this.sessionId = sessionId;
    this.userId = userId;
  }

  /**
   * トラッキング開始
   */
  public start(): void {
    if (this.isTracking) {
      console.warn('[FunnelTracker] 既にトラッキング中です');
      return;
    }

    // 現在のURLに一致するファネルを検索
    this.checkCurrentPage();

    this.isTracking = true;
    console.log('[FunnelTracker] トラッキング開始');
  }

  /**
   * トラッキング停止
   */
  public stop(): void {
    if (!this.isTracking) {
      return;
    }

    // 離脱イベントを記録
    if (this.currentFunnel && this.currentStep) {
      const event = createFunnelEvent(
        this.currentFunnel,
        this.currentStep,
        this.sessionId,
        this.userId,
        false,
        true // 離脱
      );
      saveFunnelEvent(event);
      console.log('[FunnelTracker] 離脱イベント記録', event);
    }

    this.isTracking = false;
    console.log('[FunnelTracker] トラッキング停止');
  }

  /**
   * 現在のページをチェック
   */
  public checkCurrentPage(): void {
    const currentUrl = window.location.href;
    const match = findMatchingFunnelStep(currentUrl);

    if (!match) {
      // 一致するファネルステップが見つからない
      if (this.currentFunnel && this.currentStep) {
        // 前のステップから離脱
        const event = createFunnelEvent(
          this.currentFunnel,
          this.currentStep,
          this.sessionId,
          this.userId,
          false,
          true // 離脱
        );
        saveFunnelEvent(event);
        console.log('[FunnelTracker] 離脱イベント記録', event);
      }

      this.currentFunnel = null;
      this.currentStep = null;
      return;
    }

    const { funnel, step } = match;

    // 新しいファネルに入った
    if (!this.currentFunnel || this.currentFunnel.id !== funnel.id) {
      this.currentFunnel = funnel;
      this.currentStep = step;

      // ステップ完了イベント記録
      const event = createFunnelEvent(
        funnel,
        step,
        this.sessionId,
        this.userId,
        true, // 完了
        false
      );
      saveFunnelEvent(event);
      console.log('[FunnelTracker] ステップ完了イベント記録', event);
      return;
    }

    // 同じファネル内で別のステップに進んだ
    if (this.currentStep && this.currentStep.id !== step.id) {
      // 前のステップ完了
      const prevEvent = createFunnelEvent(
        this.currentFunnel,
        this.currentStep,
        this.sessionId,
        this.userId,
        true, // 完了
        false
      );
      saveFunnelEvent(prevEvent);

      // 新しいステップ開始
      this.currentStep = step;
      const event = createFunnelEvent(
        funnel,
        step,
        this.sessionId,
        this.userId,
        true, // 完了
        false
      );
      saveFunnelEvent(event);
      console.log('[FunnelTracker] ステップ遷移イベント記録', event);
    }
  }

  /**
   * 手動でステップ完了を記録
   */
  public completeStep(funnelId: string, stepId: string): void {
    // ファネルとステップを検索（実装は簡略化）
    console.log(`[FunnelTracker] ステップ完了: ${funnelId} / ${stepId}`);
  }

  /**
   * 現在のファネルを取得
   */
  public getCurrentFunnel(): Funnel | null {
    return this.currentFunnel;
  }

  /**
   * 現在のステップを取得
   */
  public getCurrentStep(): FunnelStep | null {
    return this.currentStep;
  }

  /**
   * トラッキング状態を取得
   */
  public isActive(): boolean {
    return this.isTracking;
  }
}
