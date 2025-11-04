/**
 * トーストメッセージシステム
 * ユーザーフィードバック用の通知表示
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type: ToastType;
  message: string;
  duration?: number; // ミリ秒（0で自動非表示なし）
}

/**
 * トーストマネージャークラス
 */
export class ToastManager {
  private container: HTMLDivElement | null = null;
  private toasts: Map<string, HTMLDivElement> = new Map();

  constructor() {
    this.initContainer();
  }

  /**
   * コンテナを初期化
   */
  private initContainer(): void {
    if (this.container) {
      return;
    }

    this.container = document.createElement('div');
    this.container.id = 'heatmap-toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000002;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    `;

    document.body.appendChild(this.container);
  }

  /**
   * トーストを表示
   */
  public show(options: ToastOptions): string {
    const toastId = `toast-${Date.now()}-${Math.random()}`;
    const toast = this.createToast(options);

    this.toasts.set(toastId, toast);

    if (this.container) {
      this.container.appendChild(toast);
    }

    // アニメーション開始
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });

    // 自動非表示
    if (options.duration !== 0) {
      const duration = options.duration || 3000;
      setTimeout(() => {
        this.hide(toastId);
      }, duration);
    }

    return toastId;
  }

  /**
   * トーストを作成
   */
  private createToast(options: ToastOptions): HTMLDivElement {
    const toast = document.createElement('div');
    toast.style.cssText = `
      min-width: 300px;
      max-width: 400px;
      padding: 16px 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      opacity: 0;
      transform: translateX(100px);
      transition: all 0.3s ease;
      pointer-events: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      color: #333;
      border-left: 4px solid ${this.getColor(options.type)};
    `;

    // アイコン
    const icon = document.createElement('div');
    icon.textContent = this.getIcon(options.type);
    icon.style.cssText = `
      font-size: 20px;
      flex-shrink: 0;
    `;

    // メッセージ
    const message = document.createElement('div');
    message.textContent = options.message;
    message.style.cssText = `
      flex: 1;
      line-height: 1.5;
    `;

    // 閉じるボタン
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: #999;
      font-size: 20px;
      cursor: pointer;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.2s;
    `;

    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.background = '#f0f0f0';
    });

    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.background = 'transparent';
    });

    closeButton.addEventListener('click', () => {
      const toastId = Array.from(this.toasts.entries()).find(([_, t]) => t === toast)?.[0];
      if (toastId) {
        this.hide(toastId);
      }
    });

    toast.appendChild(icon);
    toast.appendChild(message);
    toast.appendChild(closeButton);

    return toast;
  }

  /**
   * トーストを非表示
   */
  public hide(toastId: string): void {
    const toast = this.toasts.get(toastId);
    if (!toast) {
      return;
    }

    // アニメーション終了
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts.delete(toastId);
    }, 300);
  }

  /**
   * すべてのトーストをクリア
   */
  public clear(): void {
    this.toasts.forEach((_, id) => this.hide(id));
  }

  /**
   * タイプに応じた色を取得
   */
  private getColor(type: ToastType): string {
    switch (type) {
      case 'success':
        return '#48bb78';
      case 'error':
        return '#f56565';
      case 'warning':
        return '#ed8936';
      case 'info':
        return '#4299e1';
      default:
        return '#4299e1';
    }
  }

  /**
   * タイプに応じたアイコンを取得
   */
  private getIcon(type: ToastType): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  }

  /**
   * クリーンアップ
   */
  public destroy(): void {
    this.clear();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }
}

/**
 * グローバルトーストマネージャーインスタンス
 */
let globalToastManager: ToastManager | null = null;

/**
 * トーストを表示するヘルパー関数（オプションオブジェクト版）
 */
export function showToast(options: ToastOptions): string;
/**
 * トーストを表示するヘルパー関数（個別引数版）
 */
export function showToast(message: string, type?: ToastType, duration?: number): string;
/**
 * トーストを表示するヘルパー関数（実装）
 */
export function showToast(
  optionsOrMessage: ToastOptions | string,
  type: ToastType = 'info',
  duration?: number
): string {
  if (!globalToastManager) {
    globalToastManager = new ToastManager();
  }

  if (typeof optionsOrMessage === 'string') {
    return globalToastManager.show({ message: optionsOrMessage, type, duration });
  } else {
    return globalToastManager.show(optionsOrMessage);
  }
}

/**
 * 成功トーストを表示
 */
export function showSuccessToast(message: string, duration?: number): string {
  return showToast(message, 'success', duration);
}

/**
 * エラートーストを表示
 */
export function showErrorToast(message: string, duration?: number): string {
  return showToast(message, 'error', duration);
}

/**
 * 警告トーストを表示
 */
export function showWarningToast(message: string, duration?: number): string {
  return showToast(message, 'warning', duration);
}

/**
 * 情報トーストを表示
 */
export function showInfoToast(message: string, duration?: number): string {
  return showToast(message, 'info', duration);
}
