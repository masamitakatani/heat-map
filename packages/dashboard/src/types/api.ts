/**
 * API型定義
 * バックエンドAPIのレスポンス型
 */

// ページ情報
export interface Page {
  id: string;
  url: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

// ページ統計情報
export interface PageStats {
  page_id: string;
  page_url: string;
  page_title: string | null;
  total_clicks: number;
  total_scrolls: number;
  total_mouse_moves: number;
  unique_sessions: number;
  last_activity: string;
}

// クリックイベント
export interface ClickEvent {
  x: number;
  y: number;
  viewport_width: number;
  viewport_height: number;
  element_tag: string | null;
  element_id: string | null;
  element_class: string | null;
  timestamp: string;
}

// クリックヒートマップデータ
export interface ClickHeatmapData {
  page_url: string;
  clicks: ClickEvent[];
  total_count: number;
}

// スクロールイベント
export interface ScrollEvent {
  scroll_depth: number;
  max_scroll: number;
  viewport_height: number;
  document_height: number;
  timestamp: string;
}

// スクロール統計
export interface ScrollStats {
  page_url: string;
  avg_scroll_depth: number;
  max_scroll_depth: number;
  scroll_distribution: Record<string, number>;
  total_count: number;
}

// マウスムーブイベント
export interface MouseMoveEvent {
  x: number;
  y: number;
  viewport_width: number;
  viewport_height: number;
  timestamp: string;
}

// マウスムーブヒートマップデータ
export interface MouseMoveHeatmapData {
  page_url: string;
  grid_size: number;
  grid_data: Record<string, number>;
  total_count: number;
}

// ページ一覧レスポンス
export interface PageListResponse {
  pages: Page[];
  total: number;
}

// ページ統計一覧レスポンス
export interface PageStatsListResponse {
  stats: PageStats[];
  total: number;
}
