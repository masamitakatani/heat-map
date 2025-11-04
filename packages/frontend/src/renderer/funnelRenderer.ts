/**
 * ファネルチャート描画モジュール
 * ファネル統計を視覚化
 */

import type { FunnelStats } from '../types';

/**
 * ファネルレンダラークラス
 */
export class FunnelRenderer {
  private container: HTMLDivElement | null = null;

  /**
   * ファネルチャートを描画
   */
  public render(stats: FunnelStats): void {
    // 既存のコンテナをクリア
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    // コンテナ作成
    this.container = document.createElement('div');
    this.container.id = 'funnel-chart-container';
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 800px;
      max-height: 80vh;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 1000001;
      overflow-y: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    // ヘッダー
    const header = this.createHeader(stats);
    this.container.appendChild(header);

    // ファネルチャート
    const chart = this.createFunnelChart(stats);
    this.container.appendChild(chart);

    // フッター
    const footer = this.createFooter(stats);
    this.container.appendChild(footer);

    // 閉じるボタン
    const closeButton = this.createCloseButton();
    this.container.appendChild(closeButton);

    document.body.appendChild(this.container);
  }

  /**
   * ヘッダー作成
   */
  private createHeader(stats: FunnelStats): HTMLDivElement {
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 24px;
      border-bottom: 1px solid #e0e0e0;
    `;

    const title = document.createElement('h2');
    title.textContent = stats.funnel.name;
    title.style.cssText = `
      margin: 0 0 8px 0;
      font-size: 24px;
      color: #333;
    `;

    const subtitle = document.createElement('p');
    subtitle.textContent = `コンバージョン率: ${stats.overall_conversion_rate}%`;
    subtitle.style.cssText = `
      margin: 0;
      font-size: 16px;
      color: #666;
    `;

    header.appendChild(title);
    header.appendChild(subtitle);

    return header;
  }

  /**
   * ファネルチャート作成
   */
  private createFunnelChart(stats: FunnelStats): HTMLDivElement {
    const chart = document.createElement('div');
    chart.style.cssText = `
      padding: 32px 24px;
    `;

    stats.stats.forEach((step, index) => {
      const stepElement = this.createFunnelStep(step, index, stats.stats.length);
      chart.appendChild(stepElement);

      // 矢印追加（最後のステップ以外）
      if (index < stats.stats.length - 1) {
        const arrow = this.createArrow();
        chart.appendChild(arrow);
      }
    });

    return chart;
  }

  /**
   * ファネルステップ作成
   */
  private createFunnelStep(
    step: { step_name: string; users_entered: number; completion_rate: number; drop_off_rate: number },
    index: number,
    totalSteps: number
  ): HTMLDivElement {
    const stepElement = document.createElement('div');

    // 幅を計算（最初のステップが100%、最後に向けて徐々に狭くなる）
    const widthPercent = 100 - (index / totalSteps) * 40; // 100% → 60%

    stepElement.style.cssText = `
      width: ${widthPercent}%;
      margin: 0 auto;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      border-radius: 8px;
      color: white;
      text-align: center;
      position: relative;
    `;

    const stepName = document.createElement('div');
    stepName.textContent = `${index + 1}. ${step.step_name}`;
    stepName.style.cssText = `
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 8px;
    `;

    const usersCount = document.createElement('div');
    usersCount.textContent = `${step.users_entered}人`;
    usersCount.style.cssText = `
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 8px;
    `;

    const rates = document.createElement('div');
    rates.textContent = `完了率: ${step.completion_rate}% | 離脱率: ${step.drop_off_rate}%`;
    rates.style.cssText = `
      font-size: 14px;
      opacity: 0.9;
    `;

    stepElement.appendChild(stepName);
    stepElement.appendChild(usersCount);
    stepElement.appendChild(rates);

    return stepElement;
  }

  /**
   * 矢印作成
   */
  private createArrow(): HTMLDivElement {
    const arrow = document.createElement('div');
    arrow.textContent = '↓';
    arrow.style.cssText = `
      text-align: center;
      font-size: 32px;
      color: #667eea;
      margin: 12px 0;
    `;
    return arrow;
  }

  /**
   * フッター作成
   */
  private createFooter(stats: FunnelStats): HTMLDivElement {
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 24px;
      border-top: 1px solid #e0e0e0;
      background: #f9f9f9;
      border-radius: 0 0 12px 12px;
    `;

    const dateRange = document.createElement('p');
    const startDate = new Date(stats.date_range.start).toLocaleDateString('ja-JP');
    const endDate = new Date(stats.date_range.end).toLocaleDateString('ja-JP');
    dateRange.textContent = `集計期間: ${startDate} 〜 ${endDate}`;
    dateRange.style.cssText = `
      margin: 0;
      font-size: 14px;
      color: #666;
    `;

    footer.appendChild(dateRange);

    return footer;
  }

  /**
   * 閉じるボタン作成
   */
  private createCloseButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = '×';
    button.style.cssText = `
      position: absolute;
      top: 16px;
      right: 16px;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 50%;
      background: #f0f0f0;
      color: #333;
      font-size: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.background = '#e0e0e0';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = '#f0f0f0';
    });

    button.addEventListener('click', () => {
      this.hide();
    });

    return button;
  }

  /**
   * ファネルチャートを非表示
   */
  public hide(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }

  /**
   * クリーンアップ
   */
  public destroy(): void {
    this.hide();
  }
}
