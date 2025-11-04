/**
 * ヒートマップ描画エンジン
 * Canvas APIを使ってヒートマップを描画
 */

import type { ClickEvent, MouseMoveEvent, ScrollEvent, HeatmapRenderConfig } from '../types';

/**
 * デフォルト描画設定
 */
const DEFAULT_RENDER_CONFIG: HeatmapRenderConfig = {
  colors: {
    low: '#0000FF', // 青
    medium: '#FFFF00', // 黄
    high: '#FF0000', // 赤
  },
  opacity: {
    min: 0.3,
    max: 0.8,
  },
  gridSize: 20, // 20px単位でグリッド化
};

/**
 * 色を補間（RGB線形補間）
 */
function interpolateColor(color1: string, color2: string, ratio: number): string {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');

  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);

  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 頻度に応じた色を取得
 */
function getHeatmapColor(intensity: number, config: HeatmapRenderConfig): string {
  // intensity: 0.0〜1.0
  const clamped = Math.max(0, Math.min(1, intensity));

  if (clamped < 0.5) {
    // 青 → 黄（0.0〜0.5）
    return interpolateColor(config.colors.low, config.colors.medium, clamped * 2);
  } else {
    // 黄 → 赤（0.5〜1.0）
    return interpolateColor(config.colors.medium, config.colors.high, (clamped - 0.5) * 2);
  }
}

/**
 * 頻度に応じた透明度を取得
 */
function getOpacity(intensity: number, config: HeatmapRenderConfig): number {
  const clamped = Math.max(0, Math.min(1, intensity));
  return config.opacity.min + (config.opacity.max - config.opacity.min) * clamped;
}

/**
 * ヒートマップレンダラークラス
 */
export class HeatmapRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private config: HeatmapRenderConfig;

  constructor(config: Partial<HeatmapRenderConfig> = {}) {
    this.config = {
      ...DEFAULT_RENDER_CONFIG,
      ...config,
      colors: {
        ...DEFAULT_RENDER_CONFIG.colors,
        ...config.colors,
      },
      opacity: {
        ...DEFAULT_RENDER_CONFIG.opacity,
        ...config.opacity,
      },
    };
  }

  /**
   * Canvasを初期化
   */
  private initCanvas(): void {
    if (this.canvas) {
      return; // 既に初期化済み
    }

    // Canvas要素を作成
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'heatmap-overlay-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none'; // マウスイベントを透過
    this.canvas.style.zIndex = '999999'; // 最前面に表示

    // Canvas解像度を設定
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Canvasコンテキストを取得
    this.ctx = this.canvas.getContext('2d');

    if (!this.ctx) {
      throw new Error('Canvas 2D context取得失敗');
    }

    // DOMに追加
    document.body.appendChild(this.canvas);
  }

  /**
   * Canvasをクリア
   */
  public clear(): void {
    if (!this.ctx || !this.canvas) {
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * ヒートマップを非表示
   */
  public hide(): void {
    if (this.canvas) {
      this.canvas.style.display = 'none';
    }
  }

  /**
   * ヒートマップを表示
   */
  public show(): void {
    if (!this.canvas) {
      this.initCanvas();
    } else {
      this.canvas.style.display = 'block';
    }
  }

  /**
   * クリックヒートマップを描画
   */
  public renderClickHeatmap(clickEvents: ClickEvent[]): void {
    this.initCanvas();
    this.clear();

    if (!this.ctx || clickEvents.length === 0) {
      return;
    }

    // グリッド単位でクリック数を集計
    const gridMap = new Map<string, number>();

    clickEvents.forEach((event) => {
      const gridX = Math.floor(event.x / this.config.gridSize);
      const gridY = Math.floor(event.y / this.config.gridSize);
      const key = `${gridX},${gridY}`;

      gridMap.set(key, (gridMap.get(key) || 0) + 1);
    });

    // 最大クリック数を取得
    const maxClicks = Math.max(...Array.from(gridMap.values()));

    // グリッドごとに描画
    gridMap.forEach((count, key) => {
      const [gridX, gridY] = key.split(',').map(Number);
      const x = gridX * this.config.gridSize;
      const y = gridY * this.config.gridSize;

      const intensity = count / maxClicks;
      const color = getHeatmapColor(intensity, this.config);
      const opacity = getOpacity(intensity, this.config);

      // 円を描画
      this.ctx!.beginPath();
      this.ctx!.arc(
        x + this.config.gridSize / 2,
        y + this.config.gridSize / 2,
        this.config.gridSize * 2, // 半径
        0,
        Math.PI * 2
      );
      this.ctx!.fillStyle = color;
      this.ctx!.globalAlpha = opacity;
      this.ctx!.fill();
    });

    // 透明度をリセット
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * スクロールヒートマップを描画
   */
  public renderScrollHeatmap(scrollEvents: ScrollEvent[]): void {
    this.initCanvas();
    this.clear();

    if (!this.ctx || !this.canvas || scrollEvents.length === 0) {
      return;
    }

    // スクロール深度ごとの到達率を計算
    const depthMap = new Map<number, number>();
    scrollEvents.forEach((event) => {
      const depth = Math.floor(event.depth_percent / 10) * 10; // 10%単位で丸める
      depthMap.set(depth, (depthMap.get(depth) || 0) + 1);
    });

    const maxCount = Math.max(...Array.from(depthMap.values()));

    // スクロール深度を視覚化（横線で表示）
    const pageHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );

    depthMap.forEach((count, depth) => {
      const y = (depth / 100) * pageHeight;
      const intensity = count / maxCount;
      const color = getHeatmapColor(intensity, this.config);
      const opacity = getOpacity(intensity, this.config);

      this.ctx!.fillStyle = color;
      this.ctx!.globalAlpha = opacity;
      this.ctx!.fillRect(0, y, this.canvas!.width, 5); // 5px高さの横線
    });

    // 透明度をリセット
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * マウスムーブメントヒートマップを描画
   */
  public renderMouseMoveHeatmap(mouseMoveEvents: MouseMoveEvent[]): void {
    this.initCanvas();
    this.clear();

    if (!this.ctx || mouseMoveEvents.length === 0) {
      return;
    }

    // グリッド単位でマウス移動回数を集計
    const gridMap = new Map<string, number>();

    mouseMoveEvents.forEach((event) => {
      const gridX = Math.floor(event.x / this.config.gridSize);
      const gridY = Math.floor(event.y / this.config.gridSize);
      const key = `${gridX},${gridY}`;

      gridMap.set(key, (gridMap.get(key) || 0) + 1);
    });

    // 最大移動回数を取得
    const maxMoves = Math.max(...Array.from(gridMap.values()));

    // グリッドごとに描画
    gridMap.forEach((count, key) => {
      const [gridX, gridY] = key.split(',').map(Number);
      const x = gridX * this.config.gridSize;
      const y = gridY * this.config.gridSize;

      const intensity = count / maxMoves;
      const color = getHeatmapColor(intensity, this.config);
      const opacity = getOpacity(intensity, this.config);

      // 四角形を描画
      this.ctx!.fillStyle = color;
      this.ctx!.globalAlpha = opacity;
      this.ctx!.fillRect(x, y, this.config.gridSize, this.config.gridSize);
    });

    // 透明度をリセット
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * リサイズ対応
   */
  public resize(): void {
    if (!this.canvas) {
      return;
    }

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * クリーンアップ
   */
  public destroy(): void {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    this.canvas = null;
    this.ctx = null;
  }
}
