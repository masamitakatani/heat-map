/**
 * Type definitions for dashboard
 */

export interface HeatmapData {
  clicks: ClickEvent[];
  scrolls: ScrollEvent[];
  mouseMoves: MouseMoveEvent[];
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

export interface FunnelStep {
  id: string;
  name: string;
  url: string;
  order: number;
}

export interface FunnelData {
  steps: FunnelStep[];
  conversions: {
    stepId: string;
    count: number;
    rate: number;
  }[];
}

export type ViewMode = 'click' | 'scroll' | 'mouse' | 'funnel';
