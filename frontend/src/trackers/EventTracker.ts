/**
 * イベントトラッカー
 * ユーザーのクリック・スクロール・マウスムーブを記録
 */

import type { ClickEvent, ScrollEvent, MouseMoveEvent } from '../types';
import { sendClickEvents, sendScrollEvents, sendMouseMoveEvents } from '../api/events';
import { loadData, saveData } from '../storage/localStorage';

/**
 * イベントトラッカークラス
 */
export class EventTracker {
  private sessionId: string;
  private isTracking: boolean = false;
  private clickBuffer: ClickEvent[] = [];
  private scrollBuffer: ScrollEvent[] = [];
  private mouseMoveBuffer: MouseMoveEvent[] = [];
  private flushInterval: number | null = null;
  private lastScrollTime: number = 0;
  private lastMouseMoveTime: number = 0;
  private mouseMoveInterval: number = 100; // 100ms
  private scrollInterval: number = 200; // 200ms

  constructor(sessionId: string, config?: {
    mouseMoveInterval?: number;
    scrollInterval?: number;
  }) {
    this.sessionId = sessionId;
    if (config?.mouseMoveInterval) {
      this.mouseMoveInterval = config.mouseMoveInterval;
    }
    if (config?.scrollInterval) {
      this.scrollInterval = config.scrollInterval;
    }
  }

  /**
   * トラッキング開始
   */
  public start(): void {
    if (this.isTracking) {
      console.warn('[EventTracker] 既にトラッキング中です');
      return;
    }

    this.isTracking = true;

    // イベントリスナー登録
    document.addEventListener('click', this.handleClick);
    window.addEventListener('scroll', this.handleScroll);
    document.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('beforeunload', this.handleBeforeUnload);

    // 定期的にバッファをフラッシュ(5秒ごと)
    this.flushInterval = window.setInterval(() => {
      this.flush();
    }, 5000);

    console.log('[EventTracker] トラッキング開始');
  }

  /**
   * トラッキング停止
   */
  public stop(): void {
    if (!this.isTracking) {
      return;
    }

    this.isTracking = false;

    // イベントリスナー解除
    document.removeEventListener('click', this.handleClick);
    window.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);

    // フラッシュ間隔をクリア
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // 残りのバッファをフラッシュ
    this.flush();

    console.log('[EventTracker] トラッキング停止');
  }

  /**
   * クリックイベントハンドラ
   */
  private handleClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;

    const clickEvent: ClickEvent = {
      x: event.clientX,
      y: event.clientY,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      element: {
        tag: target.tagName,
        id: target.id || undefined,
        class: target.className || undefined,
        text: target.textContent?.substring(0, 50) || undefined,
      },
      timestamp: new Date().toISOString(),
    };

    this.clickBuffer.push(clickEvent);

    // LocalStorageにも保存(オフライン対応)
    this.saveToLocalStorage('clicks', clickEvent);

    // バッファが100件溜まったらフラッシュ
    if (this.clickBuffer.length >= 100) {
      this.flush();
    }
  };

  /**
   * スクロールイベントハンドラ(Throttle処理)
   */
  private handleScroll = (): void => {
    const now = Date.now();
    if (now - this.lastScrollTime < this.scrollInterval) {
      return;
    }
    this.lastScrollTime = now;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const pageHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    const maxScrollY = pageHeight - viewportHeight;
    const depthPercent = maxScrollY > 0 ? Math.round((scrollTop / maxScrollY) * 100) : 0;

    const scrollEvent: ScrollEvent = {
      depth_percent: Math.min(depthPercent, 100),
      max_scroll_y: scrollTop,
      page_height: pageHeight,
      timestamp: new Date().toISOString(),
    };

    this.scrollBuffer.push(scrollEvent);

    // LocalStorageにも保存
    this.saveToLocalStorage('scrolls', scrollEvent);

    // バッファが100件溜まったらフラッシュ
    if (this.scrollBuffer.length >= 100) {
      this.flush();
    }
  };

  /**
   * マウスムーブイベントハンドラ(Throttle処理)
   */
  private handleMouseMove = (event: MouseEvent): void => {
    const now = Date.now();
    if (now - this.lastMouseMoveTime < this.mouseMoveInterval) {
      return;
    }
    this.lastMouseMoveTime = now;

    const mouseMoveEvent: MouseMoveEvent = {
      x: event.clientX,
      y: event.clientY,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      timestamp: new Date().toISOString(),
    };

    this.mouseMoveBuffer.push(mouseMoveEvent);

    // LocalStorageにも保存
    this.saveToLocalStorage('mouseMoves', mouseMoveEvent);

    // バッファが100件溜まったらフラッシュ
    if (this.mouseMoveBuffer.length >= 100) {
      this.flush();
    }
  };

  /**
   * ページ離脱時ハンドラ
   */
  private handleBeforeUnload = (): void => {
    this.flush();
  };

  /**
   * LocalStorageに保存
   */
  private saveToLocalStorage(
    type: 'clicks' | 'scrolls' | 'mouseMoves',
    event: ClickEvent | ScrollEvent | MouseMoveEvent
  ): void {
    try {
      const data = loadData();
      if (!data) return;

      // イベントを追加(最新50件のみ保持)
      // 型安全性のため、条件分岐で明示的に型を指定
      if (type === 'clicks') {
        data.pendingEvents.clicks.push(event as ClickEvent);
        data.pendingEvents.clicks = data.pendingEvents.clicks.slice(-50);
      } else if (type === 'scrolls') {
        data.pendingEvents.scrolls.push(event as ScrollEvent);
        data.pendingEvents.scrolls = data.pendingEvents.scrolls.slice(-50);
      } else {
        data.pendingEvents.mouseMoves.push(event as MouseMoveEvent);
        data.pendingEvents.mouseMoves = data.pendingEvents.mouseMoves.slice(-50);
      }

      saveData(data);
    } catch (error) {
      console.error('[EventTracker] LocalStorage保存エラー:', error);
    }
  }

  /**
   * バッファをAPIに送信
   */
  private async flush(): Promise<void> {
    const pageUrl = window.location.href;

    // クリックイベント送信
    if (this.clickBuffer.length > 0) {
      const events = [...this.clickBuffer];
      this.clickBuffer = [];
      await sendClickEvents(this.sessionId, pageUrl, events);
    }

    // スクロールイベント送信
    if (this.scrollBuffer.length > 0) {
      const events = [...this.scrollBuffer];
      this.scrollBuffer = [];
      await sendScrollEvents(this.sessionId, pageUrl, events);
    }

    // マウスムーブイベント送信
    if (this.mouseMoveBuffer.length > 0) {
      const events = [...this.mouseMoveBuffer];
      this.mouseMoveBuffer = [];
      await sendMouseMoveEvents(this.sessionId, pageUrl, events);
    }
  }
}
