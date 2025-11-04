/**
 * マウスムーブメントトラッキングモジュール
 * マウスカーソルの移動軌跡を記録（サンプリング付き）
 */

import type { MouseMoveEvent } from '../types';

/**
 * マウスムーブメントイベントを作成
 */
export function createMouseMoveEvent(event: MouseEvent): MouseMoveEvent {
  return {
    x: event.clientX,
    y: event.clientY,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    timestamp: new Date().toISOString(),
  };
}

/**
 * マウスムーブメントトラッカークラス
 */
export class MouseMoveTracker {
  private isTracking: boolean = false;
  private mouseMoveHandler: ((event: MouseEvent) => void) | null = null;
  private onMouseMoveCallback: ((mouseMoveEvent: MouseMoveEvent) => void) | null = null;
  private samplingRate: number = 0.1; // デフォルト10%サンプリング
  private throttleTimeout: number | null = null;
  private throttleDelay: number = 100; // 100ms

  /**
   * トラッキング開始
   * @param callback マウス移動イベント発生時のコールバック
   * @param samplingRate サンプリングレート（0.0〜1.0）
   * @param throttleDelay スロットリング遅延（ms）
   */
  public start(
    callback: (mouseMoveEvent: MouseMoveEvent) => void,
    samplingRate: number = 0.1,
    throttleDelay: number = 100
  ): void {
    if (this.isTracking) {
      console.warn('[MouseMoveTracker] 既にトラッキング中です');
      return;
    }

    this.onMouseMoveCallback = callback;
    this.samplingRate = Math.max(0, Math.min(1, samplingRate)); // 0〜1にクランプ
    this.throttleDelay = throttleDelay;

    // マウス移動イベントリスナーを登録（スロットリング + サンプリング）
    this.mouseMoveHandler = (event: MouseEvent) => {
      // サンプリング: 指定確率でスキップ
      if (Math.random() > this.samplingRate) {
        return;
      }

      // スロットリング: 指定時間内に1回のみ記録
      if (this.throttleTimeout) {
        return;
      }

      this.throttleTimeout = window.setTimeout(() => {
        this.throttleTimeout = null;
      }, this.throttleDelay);

      const mouseMoveEvent = createMouseMoveEvent(event);

      if (this.onMouseMoveCallback) {
        this.onMouseMoveCallback(mouseMoveEvent);
      }
    };

    document.addEventListener('mousemove', this.mouseMoveHandler, { passive: true });
    this.isTracking = true;

    console.log(`[MouseMoveTracker] トラッキング開始（サンプリングレート: ${this.samplingRate * 100}%）`);
  }

  /**
   * トラッキング停止
   */
  public stop(): void {
    if (!this.isTracking || !this.mouseMoveHandler) {
      return;
    }

    document.removeEventListener('mousemove', this.mouseMoveHandler);

    if (this.throttleTimeout) {
      clearTimeout(this.throttleTimeout);
    }

    this.mouseMoveHandler = null;
    this.onMouseMoveCallback = null;
    this.isTracking = false;

    console.log('[MouseMoveTracker] トラッキング停止');
  }

  /**
   * トラッキング状態を取得
   */
  public isActive(): boolean {
    return this.isTracking;
  }

  /**
   * サンプリングレートを変更
   */
  public setSamplingRate(rate: number): void {
    this.samplingRate = Math.max(0, Math.min(1, rate));
    console.log(`[MouseMoveTracker] サンプリングレート変更: ${this.samplingRate * 100}%`);
  }

  /**
   * スロットリング遅延を変更
   */
  public setThrottleDelay(delay: number): void {
    this.throttleDelay = Math.max(0, delay);
    console.log(`[MouseMoveTracker] スロットリング遅延変更: ${this.throttleDelay}ms`);
  }
}
