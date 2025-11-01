/**
 * Overlay UI Controller
 * Manages the heatmap overlay UI state and interactions
 */

import type { DisplayMode, OverlayState } from '../types';
import { StorageManager } from '../storage';

export class OverlayController {
  private state: OverlayState;
  private container: HTMLElement | null = null;
  private onStateChange?: (state: OverlayState) => void;

  constructor() {
    // Load saved state or use defaults
    const savedState = StorageManager.loadOverlayState();
    this.state = savedState || {
      isVisible: false,
      mode: 'click',
    };
  }

  /**
   * Initialize the overlay UI
   */
  initialize(onStateChange?: (state: OverlayState) => void): void {
    this.onStateChange = onStateChange;
    this.createOverlayContainer();
    this.render();
  }

  /**
   * Create the overlay container element
   */
  private createOverlayContainer(): void {
    // Remove existing container if any
    const existing = document.getElementById('heatmap-overlay');
    if (existing) {
      existing.remove();
    }

    // Create new container
    this.container = document.createElement('div');
    this.container.id = 'heatmap-overlay';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    document.body.appendChild(this.container);
  }

  /**
   * Render the overlay UI
   */
  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div style="
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 16px;
        min-width: 200px;
      ">
        <!-- Toggle Button -->
        <div style="margin-bottom: 12px;">
          <button id="heatmap-toggle" style="
            width: 100%;
            padding: 8px 16px;
            background: ${this.state.isVisible ? '#3b82f6' : '#6b7280'};
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
          ">
            ${this.state.isVisible ? 'ヒートマップを隠す' : 'ヒートマップを表示'}
          </button>
        </div>

        <!-- Mode Selector (visible when heatmap is shown) -->
        ${this.state.isVisible ? `
          <div style="margin-bottom: 12px;">
            <label style="
              display: block;
              font-size: 12px;
              font-weight: 500;
              color: #374151;
              margin-bottom: 6px;
            ">表示モード</label>
            <select id="heatmap-mode" style="
              width: 100%;
              padding: 6px 10px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-size: 14px;
              background: white;
              cursor: pointer;
            ">
              <option value="click" ${this.state.mode === 'click' ? 'selected' : ''}>クリックヒートマップ</option>
              <option value="scroll" ${this.state.mode === 'scroll' ? 'selected' : ''}>スクロールヒートマップ</option>
              <option value="mouse" ${this.state.mode === 'mouse' ? 'selected' : ''}>マウスムーブメント</option>
              <option value="funnel" ${this.state.mode === 'funnel' ? 'selected' : ''}>ファネル解析</option>
            </select>
          </div>

          <!-- Data Reset Button -->
          <div>
            <button id="heatmap-reset" style="
              width: 100%;
              padding: 6px 12px;
              background: #ef4444;
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 500;
              cursor: pointer;
              transition: background 0.2s;
            ">
              データをリセット
            </button>
          </div>
        ` : ''}
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Attach event listeners to UI elements
   */
  private attachEventListeners(): void {
    // Toggle button
    const toggleBtn = document.getElementById('heatmap-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleVisibility());
    }

    // Mode selector
    const modeSelect = document.getElementById('heatmap-mode') as HTMLSelectElement;
    if (modeSelect) {
      modeSelect.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        this.changeMode(target.value as DisplayMode);
      });
    }

    // Reset button
    const resetBtn = document.getElementById('heatmap-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.showResetDialog());
    }
  }

  /**
   * Toggle heatmap visibility
   */
  private toggleVisibility(): void {
    this.state.isVisible = !this.state.isVisible;
    this.saveState();
    this.render();
    this.notifyStateChange();
  }

  /**
   * Change display mode
   */
  private changeMode(mode: DisplayMode): void {
    this.state.mode = mode;
    this.saveState();
    this.notifyStateChange();
  }

  /**
   * Show reset confirmation dialog
   */
  private showResetDialog(): void {
    const confirmed = window.confirm(
      '全てのヒートマップデータをリセットしますか？この操作は元に戻せません。'
    );

    if (confirmed) {
      this.resetData();
    }
  }

  /**
   * Reset all heatmap data
   */
  private resetData(): void {
    StorageManager.clearAllData();
    alert('全てのヒートマップデータがリセットされました。');

    // Reset state to defaults
    this.state = {
      isVisible: false,
      mode: 'click',
    };
    this.saveState();
    this.render();
    this.notifyStateChange();
  }

  /**
   * Save current state to LocalStorage
   */
  private saveState(): void {
    StorageManager.saveOverlayState(this.state);
  }

  /**
   * Notify state change listeners
   */
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  /**
   * Get current state
   */
  getState(): OverlayState {
    return { ...this.state };
  }

  /**
   * Destroy the overlay UI
   */
  destroy(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
