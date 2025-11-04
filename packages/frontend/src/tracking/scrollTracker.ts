/**
 * スクロールトラッキングモジュール
 * ユーザーのスクロール深度を記録
 */

import type { ScrollEvent } from '../types';

/**
 * スクロール深度を計算
 */
export function calculateScrollDepth(): {
  depthPercent: number;
  maxScrollY: number;
  pageHeight: number;
} {
  const windowHeight = window.innerHeight;
  const documentHeight = Math.max(
    document.body.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.clientHeight,
    document.documentElement.scrollHeight,
    document.documentElement.offsetHeight
  );

  const scrollY = window.scrollY || window.pageYOffset;
  const maxScrollY = documentHeight - windowHeight;
  const depthPercent = maxScrollY > 0 ? Math.round((scrollY / maxScrollY) * 100) : 100;

  return {
    depthPercent: Math.min(depthPercent, 100), // 100%を超えないように
    maxScrollY: scrollY,
    pageHeight: documentHeight,
  };
}

/**
 * スクロールイベントを作成
 */
export function createScrollEvent(): ScrollEvent {
  const { depthPercent, maxScrollY, pageHeight } = calculateScrollDepth();

  return {
    depth_percent: depthPercent,
    max_scroll_y: maxScrollY,
    page_height: pageHeight,
    timestamp: new Date().toISOString(),
  };
}

/**
 * スクロールトラッカークラス
 */
export class ScrollTracker {
  private isTracking: boolean = false;
  private scrollHandler: (() => void) | null = null;
  private onScrollCallback: ((scrollEvent: ScrollEvent) => void) | null = null;
  private debounceTimeout: number | null = null;
  private debounceDelay: number = 200; // 200ms
  private maxScrollDepth: number = 0; // 最大スクロール深度を記録

  /**
   * トラッキング開始
   */
  public start(callback: (scrollEvent: ScrollEvent) => void, debounceDelay: number = 200): void {
    if (this.isTracking) {
      console.warn('[ScrollTracker] 既にトラッキング中です');
      return;
    }

    this.onScrollCallback = callback;
    this.debounceDelay = debounceDelay;
    this.maxScrollDepth = 0;

    // スクロールイベントリスナーを登録（デバウンス処理付き）
    this.scrollHandler = () => {
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }

      this.debounceTimeout = window.setTimeout(() => {
        const scrollEvent = createScrollEvent();

        // 最大スクロール深度を更新
        if (scrollEvent.depth_percent > this.maxScrollDepth) {
          this.maxScrollDepth = scrollEvent.depth_percent;

          if (this.onScrollCallback) {
            this.onScrollCallback(scrollEvent);
          }
        }
      }, this.debounceDelay);
    };

    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    this.isTracking = true;

    console.log('[ScrollTracker] トラッキング開始');
  }

  /**
   * トラッキング停止
   */
  public stop(): void {
    if (!this.isTracking || !this.scrollHandler) {
      return;
    }

    window.removeEventListener('scroll', this.scrollHandler);

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.scrollHandler = null;
    this.onScrollCallback = null;
    this.isTracking = false;
    this.maxScrollDepth = 0;

    console.log('[ScrollTracker] トラッキング停止');
  }

  /**
   * トラッキング状態を取得
   */
  public isActive(): boolean {
    return this.isTracking;
  }

  /**
   * 現在のスクロール深度を取得
   */
  public getCurrentDepth(): number {
    const { depthPercent } = calculateScrollDepth();
    return depthPercent;
  }

  /**
   * 最大スクロール深度を取得
   */
  public getMaxDepth(): number {
    return this.maxScrollDepth;
  }
}
