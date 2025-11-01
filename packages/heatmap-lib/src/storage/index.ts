/**
 * LocalStorage management for heatmap data
 */

import type { OverlayState } from '../types';
import { STORAGE_KEYS } from '../types';

/**
 * Storage manager class
 */
export class StorageManager {
  /**
   * Save overlay state to LocalStorage
   */
  static saveOverlayState(state: OverlayState): void {
    try {
      localStorage.setItem(STORAGE_KEYS.OVERLAY_STATE, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save overlay state:', error);
    }
  }

  /**
   * Load overlay state from LocalStorage
   */
  static loadOverlayState(): OverlayState | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OVERLAY_STATE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load overlay state:', error);
      return null;
    }
  }

  /**
   * Clear all heatmap data from LocalStorage
   */
  static clearAllData(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  /**
   * Check if LocalStorage is available
   */
  static isAvailable(): boolean {
    try {
      const testKey = '__heatmap_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current storage usage in bytes
   */
  static getStorageSize(): number {
    let total = 0;
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        const value = localStorage.getItem(key);
        if (value) {
          total += value.length + key.length;
        }
      });
    } catch (error) {
      console.error('Failed to calculate storage size:', error);
    }
    return total;
  }

  /**
   * Check if storage is near the limit (5MB)
   */
  static isStorageNearLimit(threshold = 0.8): boolean {
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    const currentSize = this.getStorageSize();
    return currentSize / maxSize > threshold;
  }
}
