/**
 * クリックトラッキングモジュール
 * ユーザーのクリックイベントを記録
 */

import type { ClickEvent, ElementInfo } from '../types';

/**
 * クリック座標を正規化（ビューポート基準）
 */
export function normalizeClickCoordinates(
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number
): { x: number; y: number } {
  return {
    x: Math.round((x / viewportWidth) * 1000) / 1000, // 0.001精度で正規化
    y: Math.round((y / viewportHeight) * 1000) / 1000,
  };
}

/**
 * クリックされた要素の情報を取得
 */
export function getElementInfo(target: EventTarget | null): ElementInfo {
  if (!(target instanceof HTMLElement)) {
    return {
      tag: 'unknown',
    };
  }

  const element = target as HTMLElement;

  // テキスト内容を取得（最大50文字）
  let text = element.textContent?.trim().slice(0, 50) || '';

  // XSS対策: HTMLエンティティをエスケープ
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return {
    tag: element.tagName.toLowerCase(),
    id: element.id || undefined,
    class: element.className || undefined,
    text: text || undefined,
  };
}

/**
 * クリックイベントを作成
 */
export function createClickEvent(event: MouseEvent): ClickEvent {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  return {
    x: event.clientX,
    y: event.clientY,
    viewport_width: viewportWidth,
    viewport_height: viewportHeight,
    element: getElementInfo(event.target),
    timestamp: new Date().toISOString(),
  };
}

/**
 * クリックトラッカークラス
 */
export class ClickTracker {
  private isTracking: boolean = false;
  private clickHandler: ((event: MouseEvent) => void) | null = null;
  private onClickCallback: ((clickEvent: ClickEvent) => void) | null = null;

  /**
   * トラッキング開始
   */
  public start(callback: (clickEvent: ClickEvent) => void): void {
    if (this.isTracking) {
      console.warn('[ClickTracker] 既にトラッキング中です');
      return;
    }

    this.onClickCallback = callback;

    // クリックイベントリスナーを登録
    this.clickHandler = (event: MouseEvent) => {
      const clickEvent = createClickEvent(event);

      if (this.onClickCallback) {
        this.onClickCallback(clickEvent);
      }
    };

    document.addEventListener('click', this.clickHandler, true); // キャプチャフェーズで記録
    this.isTracking = true;

    console.log('[ClickTracker] トラッキング開始');
  }

  /**
   * トラッキング停止
   */
  public stop(): void {
    if (!this.isTracking || !this.clickHandler) {
      return;
    }

    document.removeEventListener('click', this.clickHandler, true);
    this.clickHandler = null;
    this.onClickCallback = null;
    this.isTracking = false;

    console.log('[ClickTracker] トラッキング停止');
  }

  /**
   * トラッキング状態を取得
   */
  public isActive(): boolean {
    return this.isTracking;
  }
}
