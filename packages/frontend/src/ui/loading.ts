/**
 * ローディングスピナーシステム
 * 非同期処理中の視覚的フィードバック
 */

/**
 * ローディングマネージャークラス
 */
export class LoadingManager {
  private overlay: HTMLDivElement | null = null;
  private spinner: HTMLDivElement | null = null;
  private isVisible: boolean = false;

  /**
   * ローディングを表示
   */
  public show(message?: string): void {
    if (this.isVisible) {
      return;
    }

    this.createOverlay(message);
    this.isVisible = true;
  }

  /**
   * オーバーレイを作成
   */
  private createOverlay(message?: string): void {
    // オーバーレイ背景
    this.overlay = document.createElement('div');
    this.overlay.id = 'heatmap-loading-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000003;
      opacity: 0;
      transition: opacity 0.3s;
    `;

    // スピナーコンテナ
    const spinnerContainer = document.createElement('div');
    spinnerContainer.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 32px 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    `;

    // スピナー
    this.spinner = document.createElement('div');
    this.spinner.style.cssText = `
      width: 48px;
      height: 48px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;

    // アニメーション定義
    if (!document.getElementById('heatmap-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'heatmap-spinner-style';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    // メッセージ
    if (message) {
      const messageElement = document.createElement('div');
      messageElement.textContent = message;
      messageElement.style.cssText = `
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 16px;
        color: #333;
        font-weight: 500;
      `;
      spinnerContainer.appendChild(this.spinner);
      spinnerContainer.appendChild(messageElement);
    } else {
      spinnerContainer.appendChild(this.spinner);
    }

    this.overlay.appendChild(spinnerContainer);
    document.body.appendChild(this.overlay);

    // フェードイン
    requestAnimationFrame(() => {
      if (this.overlay) {
        this.overlay.style.opacity = '1';
      }
    });
  }

  /**
   * ローディングを非表示
   */
  public hide(): void {
    if (!this.isVisible || !this.overlay) {
      return;
    }

    // フェードアウト
    this.overlay.style.opacity = '0';

    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      this.overlay = null;
      this.spinner = null;
      this.isVisible = false;
    }, 300);
  }

  /**
   * 表示状態を取得
   */
  public isShowing(): boolean {
    return this.isVisible;
  }

  /**
   * クリーンアップ
   */
  public destroy(): void {
    this.hide();
  }
}

/**
 * グローバルローディングマネージャーインスタンス
 */
let globalLoadingManager: LoadingManager | null = null;

/**
 * ローディングを表示するヘルパー関数
 */
export function showLoading(message?: string): void {
  if (!globalLoadingManager) {
    globalLoadingManager = new LoadingManager();
  }

  globalLoadingManager.show(message);
}

/**
 * ローディングを非表示にするヘルパー関数
 */
export function hideLoading(): void {
  if (globalLoadingManager) {
    globalLoadingManager.hide();
  }
}

/**
 * 非同期処理をローディング付きで実行
 */
export async function withLoading<T>(
  fn: () => Promise<T>,
  message?: string
): Promise<T> {
  showLoading(message);

  try {
    const result = await fn();
    return result;
  } finally {
    hideLoading();
  }
}
