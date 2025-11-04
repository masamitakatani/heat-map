/**
 * オーバーレイUIコンポーネント
 * ドラッグ移動可能なコントロールパネル
 */

import type { Position } from '../types';

export type HeatmapMode = 'click' | 'scroll' | 'mouse' | 'funnel';

export interface OverlayCallbacks {
  onModeChange: (mode: HeatmapMode) => void;
  onToggleVisibility: (isVisible: boolean) => void;
  onClearData: () => void;
  onShowFunnel?: () => void;
  getDataCount?: () => { clicks: number; scrolls: number; mouseMoves: number };
}

/**
 * オーバーレイUIクラス
 */
export class OverlayUI {
  private container: HTMLDivElement | null = null;
  private isDragging: boolean = false;
  private dragOffset: Position = { x: 0, y: 0 };
  private position: Position = { x: 20, y: 20 };
  private currentMode: HeatmapMode = 'click';
  private isHeatmapVisible: boolean = false;
  private callbacks: OverlayCallbacks;

  constructor(callbacks: OverlayCallbacks, initialPosition?: Position) {
    this.callbacks = callbacks;

    if (initialPosition) {
      this.position = initialPosition;
    }
  }

  /**
   * UIを初期化
   */
  public init(): void {
    if (this.container) {
      return; // 既に初期化済み
    }

    this.createUI();
    this.attachEventListeners();
  }

  /**
   * UIを作成
   */
  private createUI(): void {
    // レスポンシブ対応: 画面幅に応じて幅を調整
    const isMobile = window.innerWidth < 768;
    const width = isMobile ? 'calc(100vw - 40px)' : '280px';
    const maxWidth = isMobile ? '400px' : '280px';

    // コンテナ作成
    this.container = document.createElement('div');
    this.container.id = 'heatmap-overlay-ui';
    this.container.style.cssText = `
      position: fixed;
      top: ${this.position.y}px;
      left: ${this.position.x}px;
      width: ${width};
      max-width: ${maxWidth};
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border: 2px solid #333;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      z-index: 1000000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      cursor: move;
      user-select: none;
      opacity: 0;
      transform: scale(0.9);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    // ヘッダー部分
    const header = document.createElement('div');
    header.style.cssText = `
      background: #333;
      color: white;
      padding: 12px;
      border-radius: 6px 6px 0 0;
      font-weight: bold;
      cursor: move;
    `;
    header.textContent = 'ヒートマップ分析';

    // コンテンツ部分
    const content = document.createElement('div');
    content.style.cssText = 'padding: 12px;';

    // モード選択ボタン
    const modeSection = this.createModeSection();
    content.appendChild(modeSection);

    // 表示切替ボタン
    const toggleSection = this.createToggleSection();
    content.appendChild(toggleSection);

    // データクリアボタン
    const clearSection = this.createClearSection();
    content.appendChild(clearSection);

    // データ統計セクション
    const statsSection = this.createStatsSection();
    content.appendChild(statsSection);

    this.container.appendChild(header);
    this.container.appendChild(content);

    document.body.appendChild(this.container);

    // アニメーション開始
    requestAnimationFrame(() => {
      if (this.container) {
        this.container.style.opacity = '1';
        this.container.style.transform = 'scale(1)';
      }
    });

    // リサイズ対応
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  /**
   * モード選択セクション作成
   */
  private createModeSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom: 12px;';

    const label = document.createElement('div');
    label.textContent = '表示モード:';
    label.style.cssText = 'margin-bottom: 6px; font-weight: 500; color: #333;';
    section.appendChild(label);

    const modes: { id: HeatmapMode; label: string; tooltip: string }[] = [
      { id: 'click', label: 'クリック', tooltip: 'ユーザーのクリック位置を可視化' },
      { id: 'scroll', label: 'スクロール', tooltip: 'スクロール深度を可視化' },
      { id: 'mouse', label: 'マウス移動', tooltip: 'マウスの移動軌跡を可視化' },
      { id: 'funnel', label: 'ファネル', tooltip: 'コンバージョンファネルを分析' },
    ];

    modes.forEach((mode) => {
      const button = document.createElement('button');
      button.id = `heatmap-mode-${mode.id}`;
      button.textContent = mode.label;
      button.title = mode.tooltip; // ネイティブツールチップ
      button.style.cssText = `
        margin-right: 6px;
        margin-bottom: 6px;
        padding: 6px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: ${this.currentMode === mode.id ? '#007bff' : 'white'};
        color: ${this.currentMode === mode.id ? 'white' : '#333'};
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      `;

      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setMode(mode.id);
      });

      // ホバーエフェクト
      button.addEventListener('mouseenter', () => {
        if (this.currentMode !== mode.id) {
          button.style.background = '#f0f0f0';
        }
      });

      button.addEventListener('mouseleave', () => {
        if (this.currentMode !== mode.id) {
          button.style.background = 'white';
        }
      });

      section.appendChild(button);
    });

    return section;
  }

  /**
   * 表示切替セクション作成
   */
  private createToggleSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom: 12px;';

    const button = document.createElement('button');
    button.id = 'heatmap-toggle-visibility';
    button.textContent = this.isHeatmapVisible ? 'ヒートマップを非表示' : 'ヒートマップを表示';
    button.title = this.isHeatmapVisible
      ? 'ヒートマップを非表示にします'
      : 'ヒートマップを表示します';
    button.style.cssText = `
      width: 100%;
      padding: 10px;
      border: none;
      border-radius: 4px;
      background: ${this.isHeatmapVisible ? '#dc3545' : '#28a745'};
      color: white;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    `;

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleVisibility();
    });

    // ホバーエフェクト
    button.addEventListener('mouseenter', () => {
      button.style.opacity = '0.9';
      button.style.transform = 'scale(1.02)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.opacity = '1';
      button.style.transform = 'scale(1)';
    });

    section.appendChild(button);

    return section;
  }

  /**
   * データクリアセクション作成
   */
  private createClearSection(): HTMLDivElement {
    const section = document.createElement('div');

    const button = document.createElement('button');
    button.id = 'heatmap-clear-data';
    button.textContent = 'データをクリア';
    button.title = '記録したすべてのデータを削除します（元に戻せません）';
    button.style.cssText = `
      width: 100%;
      padding: 8px;
      border: 1px solid #dc3545;
      border-radius: 4px;
      background: white;
      color: #dc3545;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    `;

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearData();
    });

    // ホバーエフェクト
    button.addEventListener('mouseenter', () => {
      button.style.background = '#dc3545';
      button.style.color = 'white';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'white';
      button.style.color = '#dc3545';
    });

    section.appendChild(button);

    return section;
  }

  /**
   * データ統計セクション作成
   */
  private createStatsSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.id = 'heatmap-stats-section';
    section.style.cssText = `
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e0e0e0;
    `;

    const title = document.createElement('div');
    title.textContent = '記録データ:';
    title.style.cssText = `
      font-size: 12px;
      font-weight: 500;
      color: #666;
      margin-bottom: 6px;
    `;
    section.appendChild(title);

    const statsContainer = document.createElement('div');
    statsContainer.id = 'heatmap-stats-container';
    statsContainer.style.cssText = `
      font-size: 11px;
      color: #888;
      line-height: 1.6;
    `;

    // 初期統計を表示
    this.updateStats(statsContainer);

    section.appendChild(statsContainer);

    return section;
  }

  /**
   * 統計情報を更新
   */
  private updateStats(container?: HTMLElement): void {
    const statsContainer =
      container || document.getElementById('heatmap-stats-container');
    if (!statsContainer) return;

    if (this.callbacks.getDataCount) {
      const counts = this.callbacks.getDataCount();
      statsContainer.innerHTML = `
        クリック: <strong>${counts.clicks}</strong>件<br>
        スクロール: <strong>${counts.scrolls}</strong>件<br>
        マウス移動: <strong>${counts.mouseMoves}</strong>件
      `;
    } else {
      statsContainer.textContent = 'データなし';
    }
  }

  /**
   * イベントリスナーをアタッチ
   */
  private attachEventListeners(): void {
    if (!this.container) return;

    // ドラッグ開始
    this.container.addEventListener('mousedown', (e) => {
      // ボタンクリック時はドラッグしない
      if ((e.target as HTMLElement).tagName === 'BUTTON') {
        return;
      }

      this.isDragging = true;
      this.dragOffset = {
        x: e.clientX - this.position.x,
        y: e.clientY - this.position.y,
      };
    });

    // ドラッグ中
    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging || !this.container) return;

      this.position = {
        x: e.clientX - this.dragOffset.x,
        y: e.clientY - this.dragOffset.y,
      };

      this.updatePosition();
    });

    // ドラッグ終了
    document.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
  }

  /**
   * 位置を更新
   */
  private updatePosition(): void {
    if (!this.container) return;

    this.container.style.left = `${this.position.x}px`;
    this.container.style.top = `${this.position.y}px`;
  }

  /**
   * モードを設定
   */
  public setMode(mode: HeatmapMode): void {
    this.currentMode = mode;

    // ボタンのスタイルを更新
    const modes: HeatmapMode[] = ['click', 'scroll', 'mouse', 'funnel'];
    modes.forEach((m) => {
      const button = document.getElementById(`heatmap-mode-${m}`);
      if (button) {
        button.style.background = m === mode ? '#007bff' : 'white';
        button.style.color = m === mode ? 'white' : '#333';
      }
    });

    this.callbacks.onModeChange(mode);
  }

  /**
   * ヒートマップ表示を切り替え
   */
  public toggleVisibility(): void {
    this.isHeatmapVisible = !this.isHeatmapVisible;

    const button = document.getElementById('heatmap-toggle-visibility');
    if (button) {
      button.textContent = this.isHeatmapVisible ? 'ヒートマップを非表示' : 'ヒートマップを表示';
      button.title = this.isHeatmapVisible
        ? 'ヒートマップを非表示にします'
        : 'ヒートマップを表示します';
      button.style.background = this.isHeatmapVisible ? '#dc3545' : '#28a745';
    }

    this.callbacks.onToggleVisibility(this.isHeatmapVisible);
  }

  /**
   * データをクリア
   */
  private clearData(): void {
    if (confirm('記録したデータを削除しますか？この操作は元に戻せません。')) {
      this.callbacks.onClearData();
    }
  }

  /**
   * UIを表示
   */
  public show(): void {
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  /**
   * UIを非表示
   */
  public hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * 現在のモードを取得
   */
  public getCurrentMode(): HeatmapMode {
    return this.currentMode;
  }

  /**
   * 現在の位置を取得
   */
  public getPosition(): Position {
    return { ...this.position };
  }

  /**
   * リサイズハンドラー
   */
  private handleResize(): void {
    if (!this.container) return;

    const isMobile = window.innerWidth < 768;
    const width = isMobile ? 'calc(100vw - 40px)' : '280px';
    const maxWidth = isMobile ? '400px' : '280px';

    this.container.style.width = width;
    this.container.style.maxWidth = maxWidth;

    // 画面外にはみ出さないように調整
    const rect = this.container.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (rect.right > viewportWidth) {
      this.position.x = viewportWidth - rect.width - 20;
    }
    if (rect.bottom > viewportHeight) {
      this.position.y = viewportHeight - rect.height - 20;
    }
    if (this.position.x < 20) {
      this.position.x = 20;
    }
    if (this.position.y < 20) {
      this.position.y = 20;
    }

    this.updatePosition();
  }

  /**
   * 統計情報を更新（外部から呼び出し可能）
   */
  public refreshStats(): void {
    this.updateStats();
  }

  /**
   * クリーンアップ
   */
  public destroy(): void {
    if (this.container) {
      // フェードアウトアニメーション
      this.container.style.opacity = '0';
      this.container.style.transform = 'scale(0.9)';

      setTimeout(() => {
        if (this.container && this.container.parentNode) {
          this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
      }, 300);
    }
  }
}
