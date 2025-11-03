/**
 * デバイス情報取得ユーティリティ
 */

import type { DeviceInfo, DeviceType } from '../types';

/**
 * デバイスタイプを判定
 */
export function getDeviceType(): DeviceType {
  const ua = navigator.userAgent;

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }

  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }

  return 'desktop';
}

/**
 * ブラウザ名を取得
 */
export function getBrowserName(): string {
  const ua = navigator.userAgent;

  if (ua.indexOf('Firefox') > -1) return 'Firefox';
  if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
  if (ua.indexOf('Trident') > -1) return 'IE';
  if (ua.indexOf('Edge') > -1) return 'Edge';
  if (ua.indexOf('Chrome') > -1) return 'Chrome';
  if (ua.indexOf('Safari') > -1) return 'Safari';

  return 'Unknown';
}

/**
 * デバイス情報を取得
 */
export function getDeviceInfo(): DeviceInfo {
  return {
    type: getDeviceType(),
    browser: getBrowserName(),
    screen_width: window.screen.width,
    screen_height: window.screen.height,
  };
}
