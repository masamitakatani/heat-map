/**
 * ヒートマップ & ファネル解析ツール - 型定義
 * 要件定義書に基づく型定義
 */

// ===========================
// LocalStorage データ構造
// ===========================

/**
 * LocalStorageに保存するメインデータ構造
 */
export interface LocalStorageData {
  /** オーバーレイ表示状態 */
  overlayState: OverlayState;
  /** セッション情報 */
  sessionId: string;
  /** ブラウザ固有のUUID（匿名ID） */
  anonymousId: string;
  /** イベントデータ（未送信分） */
  pendingEvents: PendingEvents;
  /** ファネル進行状況 */
  funnelProgress?: FunnelProgress;
  /** オーバーレイUIの位置 */
  overlayPosition?: Position;
}

/**
 * オーバーレイ表示状態
 */
export interface OverlayState {
  /** 表示/非表示 */
  isVisible: boolean;
  /** 表示モード */
  mode: 'click' | 'scroll' | 'mouse' | 'funnel';
}

/**
 * 未送信イベントデータ
 */
export interface PendingEvents {
  clicks: ClickEvent[];
  scrolls: ScrollEvent[];
  mouseMoves: MouseMoveEvent[];
}

/**
 * ファネル進行状況
 */
export interface FunnelProgress {
  funnelId: string;
  currentStep: number;
  completedSteps: number[];
}

/**
 * UI位置情報
 */
export interface Position {
  x: number;
  y: number;
}

// ===========================
// イベント型定義
// ===========================

/**
 * クリックイベント
 */
export interface ClickEvent {
  /** クリック座標X */
  x: number;
  /** クリック座標Y */
  y: number;
  /** ビューポート幅 */
  viewport_width: number;
  /** ビューポート高さ */
  viewport_height: number;
  /** クリックされた要素情報 */
  element: ElementInfo;
  /** タイムスタンプ（ISO8601形式） */
  timestamp: string;
}

/**
 * スクロールイベント
 */
export interface ScrollEvent {
  /** スクロール深度（%） */
  depth_percent: number;
  /** 最大スクロール位置（px） */
  max_scroll_y: number;
  /** ページ全体の高さ（px） */
  page_height: number;
  /** タイムスタンプ（ISO8601形式） */
  timestamp: string;
}

/**
 * マウス移動イベント
 */
export interface MouseMoveEvent {
  /** マウス座標X */
  x: number;
  /** マウス座標Y */
  y: number;
  /** ビューポート幅 */
  viewport_width: number;
  /** ビューポート高さ */
  viewport_height: number;
  /** タイムスタンプ（ISO8601形式） */
  timestamp: string;
}

/**
 * 要素情報
 */
export interface ElementInfo {
  /** HTMLタグ名 */
  tag: string;
  /** ID属性 */
  id?: string;
  /** class属性 */
  class?: string;
  /** テキスト内容 */
  text?: string;
}

// ===========================
// セッション型定義
// ===========================

/**
 * セッション情報
 */
export interface Session {
  id: string;
  user_id: string;
  page_id: string;
  session_start: string;
  session_end?: string;
  duration_seconds?: number;
  device_type: DeviceType;
  browser: string;
  screen_width: number;
  screen_height: number;
}

/**
 * デバイスタイプ
 */
export type DeviceType = 'desktop' | 'mobile' | 'tablet';

/**
 * デバイス情報
 */
export interface DeviceInfo {
  type: DeviceType;
  browser: string;
  screen_width: number;
  screen_height: number;
}

// ===========================
// ファネル型定義
// ===========================

/**
 * ファネル定義
 */
export interface Funnel {
  id: string;
  name: string;
  description?: string;
  connected_one_project_id?: string;
  steps: FunnelStep[];
  created_at: string;
}

/**
 * ファネルステップ
 */
export interface FunnelStep {
  id: string;
  step_order: number;
  step_name: string;
  page_url: string;
}

/**
 * ファネルイベント
 */
export interface FunnelEvent {
  funnel_id: string;
  funnel_step_id: string;
  session_id: string;
  user_id: string;
  completed: boolean;
  dropped_off: boolean;
  timestamp: string;
}

/**
 * ファネル統計
 */
export interface FunnelStats {
  funnel: {
    id: string;
    name: string;
  };
  stats: FunnelStepStats[];
  overall_conversion_rate: number;
  date_range: {
    start: string;
    end: string;
  };
}

/**
 * ファネルステップ統計
 */
export interface FunnelStepStats {
  step_order: number;
  step_name: string;
  users_entered: number;
  users_completed: number;
  completion_rate: number;
  drop_off_rate: number;
}

// ===========================
// ヒートマップ型定義
// ===========================

/**
 * クリックヒートマップデータ
 */
export interface ClickHeatmapData {
  page: {
    url: string;
    title: string;
    total_clicks: number;
  };
  heatmap_data: Array<{
    x: number;
    y: number;
    click_count: number;
    element_tag: string;
    element_text?: string;
  }>;
  date_range: {
    start: string;
    end: string;
  };
}

/**
 * スクロールヒートマップデータ
 */
export interface ScrollHeatmapData {
  page: {
    url: string;
    title: string;
    average_page_height: number;
  };
  scroll_data: Array<{
    depth_percent: number;
    users_reached: number;
    reach_rate: number;
  }>;
  date_range: {
    start: string;
    end: string;
  };
}

/**
 * マウス移動ヒートマップデータ
 */
export interface MouseMoveHeatmapData {
  page: {
    url: string;
    title: string;
  };
  heatmap_data: Array<{
    x_bucket: number;
    y_bucket: number;
    move_count: number;
    intensity: number;
  }>;
  grid_size: number;
  date_range: {
    start: string;
    end: string;
  };
}

// ===========================
// API関連型定義
// ===========================

/**
 * API設定
 */
export interface ApiConfig {
  /** APIキー */
  apiKey?: string;
  /** ベースURL */
  baseUrl?: string;
  /** コネクティッドワンプロジェクトID */
  projectId?: string;
}

/**
 * APIレスポンス
 */
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

/**
 * APIエラー
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ===========================
// 設定型定義
// ===========================

/**
 * ツール初期化設定
 */
export interface HeatmapConfig {
  /** API設定（任意） */
  api?: ApiConfig;
  /** 自動記録開始 */
  autoStart?: boolean;
  /** サンプリング間隔（ms） */
  samplingInterval?: {
    mousemove?: number;
    scroll?: number;
  };
  /** デバッグモード */
  debug?: boolean;
  /** オーバーレイ初期表示状態 */
  overlay?: {
    initialVisible?: boolean;
    initialMode?: 'click' | 'scroll' | 'mouse' | 'funnel';
  };
}

// ===========================
// ユーティリティ型
// ===========================

/**
 * カラースキーム（ヒートマップ）
 */
export interface ColorScheme {
  low: string; // 低頻度（青）
  medium: string; // 中頻度（黄）
  high: string; // 高頻度（赤）
}

/**
 * ヒートマップレンダリング設定
 */
export interface HeatmapRenderConfig {
  /** カラースキーム */
  colors: ColorScheme;
  /** 透明度範囲 */
  opacity: {
    min: number;
    max: number;
  };
  /** グリッドサイズ（px） */
  gridSize: number;
}
