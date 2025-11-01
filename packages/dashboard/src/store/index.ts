/**
 * Zustand store for global state management
 */

import { create } from 'zustand';
import type { HeatmapData, FunnelData, ViewMode } from '../types';

interface AppState {
  // View state
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Heatmap data
  heatmapData: HeatmapData | null;
  setHeatmapData: (data: HeatmapData) => void;

  // Funnel data
  funnelData: FunnelData | null;
  setFunnelData: (data: FunnelData) => void;

  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  viewMode: 'click',
  setViewMode: (mode) => set({ viewMode: mode }),

  heatmapData: null,
  setHeatmapData: (data) => set({ heatmapData: data }),

  funnelData: null,
  setFunnelData: (data) => set({ funnelData: data }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
