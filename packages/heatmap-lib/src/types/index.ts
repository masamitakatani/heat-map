/**
 * Type definitions for heatmap library
 */

export interface HeatmapConfig {
  apiKey?: string;
  enableClickTracking?: boolean;
  enableScrollTracking?: boolean;
  enableMouseTracking?: boolean;
}

export interface ClickEvent {
  x: number;
  y: number;
  timestamp: number;
  element?: string;
}

export interface ScrollEvent {
  depth: number;
  timestamp: number;
}

export interface MouseMoveEvent {
  x: number;
  y: number;
  timestamp: number;
}

/**
 * Display modes for heatmap overlay
 */
export type DisplayMode = 'click' | 'scroll' | 'mouse' | 'funnel';

/**
 * Overlay UI state
 */
export interface OverlayState {
  isVisible: boolean;
  mode: DisplayMode;
}

/**
 * Storage keys for LocalStorage
 */
export const STORAGE_KEYS = {
  OVERLAY_STATE: 'heatmap_overlay_state',
  CLICK_DATA: 'heatmap_click_data',
  SCROLL_DATA: 'heatmap_scroll_data',
  MOUSE_DATA: 'heatmap_mouse_data',
  FUNNEL_DATA: 'heatmap_funnel_data',
} as const;
