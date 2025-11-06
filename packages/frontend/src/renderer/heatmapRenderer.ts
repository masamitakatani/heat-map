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
    min: 0.5, // より濃く（0.3 → 0.5）
    max: 0.9, // より濃く（0.8 → 0.9）
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
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none'; // マウスイベントを透過
    this.canvas.style.zIndex = '999999'; // 最前面に表示

    // ページ全体の高さを取得
    const pageHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );

    // Canvas解像度を設定（ページ全体のサイズ）
    this.canvas.width = window.innerWidth;
    this.canvas.height = pageHeight;

    // CSSでもサイズを明示的に設定
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${pageHeight}px`;

    console.log('🎨 Canvas初期化:', {
      width: this.canvas.width,
      height: this.canvas.height,
      styleWidth: this.canvas.style.width,
      styleHeight: this.canvas.style.height
    });

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
      console.warn('⚠️ スクロールヒートマップ描画スキップ:', {
        ctx: !!this.ctx,
        canvas: !!this.canvas,
        eventsLength: scrollEvents.length
      });
      return;
    }

    console.log('📊 スクロールヒートマップ描画開始:', {
      eventsCount: scrollEvents.length,
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height
    });

    // 各スクロール深度に到達したユーザー数を計算
    const depthReachMap = new Map<number, number>();

    // 各イベントの深度をカウント（各イベントが到達した全ての深度を記録）
    scrollEvents.forEach((event) => {
      const depth = event.depth_percent;

      // このイベントが到達した全ての深度を記録
      for (let d = 0; d <= depth; d += 5) {
        const roundedDepth = Math.floor(d / 5) * 5;
        if (!depthReachMap.has(roundedDepth)) {
          depthReachMap.set(roundedDepth, 0);
        }
        // 各イベントを個別にカウント
        depthReachMap.set(roundedDepth, depthReachMap.get(roundedDepth)! + 1);
      }
    });

    // 最大到達カウント数（通常はトップが最大）
    const maxReachCount = Math.max(...Array.from(depthReachMap.values()));

    console.log('📈 深度到達マップ:', {
      depths: Array.from(depthReachMap.keys()).sort((a, b) => a - b),
      counts: Array.from(depthReachMap.entries()).sort((a, b) => a[0] - b[0]),
      maxReachCount
    });

    // ページ全体の高さを取得
    const pageHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );

    console.log('📏 ページ高さ:', {
      pageHeight,
      bodyScrollHeight: document.body.scrollHeight,
      documentScrollHeight: document.documentElement.scrollHeight
    });

    // 各スクロール深度セクションを塗りつぶす
    const sortedDepths = Array.from(depthReachMap.keys()).sort((a, b) => a - b);

    sortedDepths.forEach((depth, index) => {
      const reachCount = depthReachMap.get(depth) || 0;
      const nextDepth = sortedDepths[index + 1] !== undefined ? sortedDepths[index + 1] : 100;

      // このセクションの開始位置と高さ
      const startY = (depth / 100) * pageHeight;
      const endY = (nextDepth / 100) * pageHeight;
      const sectionHeight = endY - startY;

      // 到達率でintensityを計算
      const intensity = maxReachCount > 0 ? reachCount / maxReachCount : 0;
      const color = getHeatmapColor(intensity, this.config);
      const opacity = getOpacity(intensity, this.config);

      console.log(`🎨 セクション描画 [${depth}%-${nextDepth}%]:`, {
        startY,
        endY,
        sectionHeight,
        reachCount,
        intensity,
        color,
        opacity
      });

      this.ctx!.fillStyle = color;
      this.ctx!.globalAlpha = opacity;
      this.ctx!.fillRect(0, startY, this.canvas!.width, sectionHeight);
    });

    // 透明度をリセット
    this.ctx.globalAlpha = 1.0;

    console.log('✅ スクロールヒートマップ描画完了');
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

    // ページ全体の高さを取得
    const pageHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );

    this.canvas.width = window.innerWidth;
    this.canvas.height = pageHeight;

    // CSSサイズも更新
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${pageHeight}px`;
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
