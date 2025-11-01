/**
 * Heatmap Library Demo
 * This file demonstrates the overlay UI functionality
 */

import './style.css';
import { OverlayController } from './overlay';

// Create a demo page
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div style="padding: 40px; max-width: 800px; margin: 0 auto;">
    <h1 style="font-size: 32px; font-weight: bold; margin-bottom: 20px;">
      ヒートマップ & ファネル解析 デモ
    </h1>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 10px;">
        ヒートマップライブラリへようこそ
      </h2>
      <p style="color: #4b5563; line-height: 1.6;">
        このデモページではオーバーレイUIコントロールを確認できます。右上のヒートマップコントロールパネルをご覧ください。以下の操作が可能です:
      </p>
      <ul style="margin: 10px 0; padding-left: 20px; color: #4b5563;">
        <li>ヒートマップの表示/非表示を切り替え</li>
        <li>表示モードの切り替え（クリック、スクロール、マウス、ファネル）</li>
        <li>収集したデータをリセット</li>
      </ul>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
      <button style="padding: 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500;">
        クリックしてください
      </button>
      <button style="padding: 16px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500;">
        ボタン2
      </button>
      <button style="padding: 16px; background: #f59e0b; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500;">
        ボタン3
      </button>
    </div>

    <div style="background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 10px;">
        サンプルコンテンツエリア
      </h3>
      <p style="color: #6b7280; line-height: 1.8; margin-bottom: 10px;">
        これはヒートマップ機能を実演するためのサンプルコンテンツエリアです。
        マウスを動かしたり、様々な要素をクリックしたり、ページをスクロールして、
        ヒートマップがユーザー行動をどのように追跡するかを確認できます。
      </p>
      <p style="color: #6b7280; line-height: 1.8;">
        本番環境では、ヒートマップライブラリがこれらの操作を全て記録し、
        後で可視化するためにLocalStorageに保存します。
      </p>
    </div>

    <div style="height: 400px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: 600;">
      スクロールエリア
    </div>
  </div>
`;

// Initialize the overlay controller
const overlay = new OverlayController();
overlay.initialize((state) => {
  console.log('Overlay state changed:', state);
});

// Log initialization
console.log('Heatmap library demo initialized');
console.log('Current state:', overlay.getState());
