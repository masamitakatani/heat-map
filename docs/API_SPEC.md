# API仕様書

**プロジェクト**: ヒートマップ & ファネル解析ツール
**作成日**: 2025年11月2日
**バージョン**: 1.0

---

## 1. API概要

### 1.1 アーキテクチャ方針
このツールは**完全サーバーレス**構成のため、以下の特徴があります:

- **データストレージ**: LocalStorageのみ（バックエンドDBなし）
- **APIの役割**: コネクティッドワン連携のみ
- **データ永続化**: クライアント側のみ（ブラウザ）

### 1.2 API種別
1. **コネクティッドワン連携API** (読み取り専用)
   - ファネル情報の取得
   - プロジェクト設定の取得

2. **Webhook API** (イベント送信)
   - ユーザー行動イベントの通知
   - ファネル完了/離脱の通知

---

## 2. コネクティッドワン連携API

### 2.1 認証方式

**APIキー認証**:
```http
Authorization: Bearer {CONNECTED_ONE_API_KEY}
Content-Type: application/json
```

### 2.2 エンドポイント

#### 2.2.1 ファネル情報取得

**エンドポイント**:
```http
GET https://api.connected-one.com/v1/funnels/{project_id}
```

**用途**: コネクティッドワンで定義されたファネル情報を取得

**リクエストヘッダー**:
```http
Authorization: Bearer {API_KEY}
```

**レスポンス**: `200 OK`
```json
{
  "project_id": "proj_abc123",
  "funnels": [
    {
      "funnel_id": "funnel_001",
      "funnel_name": "商品購入フロー",
      "description": "LPから購入完了までの流れ",
      "steps": [
        {
          "step_index": 0,
          "step_name": "LPトップ",
          "page_url": "https://example.com/lp"
        },
        {
          "step_index": 1,
          "step_name": "申込フォーム",
          "page_url": "https://example.com/form"
        },
        {
          "step_index": 2,
          "step_name": "サンクスページ",
          "page_url": "https://example.com/thanks"
        }
      ],
      "created_at": "2025-11-01T10:00:00Z"
    }
  ]
}
```

**エラーレスポンス**:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key"
  }
}
```

---

#### 2.2.2 プロジェクト設定取得

**エンドポイント**:
```http
GET https://api.connected-one.com/v1/projects/{project_id}/settings
```

**用途**: ヒートマップツールの設定情報を取得

**レスポンス**: `200 OK`
```json
{
  "project_id": "proj_abc123",
  "project_name": "サンプルプロジェクト",
  "heatmap_enabled": true,
  "tracking_domains": [
    "example.com",
    "www.example.com"
  ],
  "settings": {
    "color_scheme": {
      "high": "#FF0000",
      "medium": "#FFFF00",
      "low": "#0000FF"
    },
    "opacity": {
      "min": 0.3,
      "max": 0.8
    },
    "sampling_rate": {
      "clicks": 1.0,
      "scrolls": 0.5,
      "mousemoves": 0.1
    }
  }
}
```

---

## 3. Webhook API（コネクティッドワンへのイベント送信）

### 3.1 概要
ユーザーの重要な行動（ファネル完了、離脱等）をコネクティッドワンに通知します。

### 3.2 Webhookエンドポイント

**送信先URL**:
```http
POST https://api.connected-one.com/v1/webhooks/heatmap-events
```

**認証**:
```http
Authorization: Bearer {API_KEY}
X-Webhook-Signature: {HMAC_SHA256_SIGNATURE}
```

---

### 3.3 イベント種別

#### 3.3.1 ファネル完了イベント

**イベントタイプ**: `funnel.completed`

**ペイロード**:
```json
{
  "event_type": "funnel.completed",
  "project_id": "proj_abc123",
  "funnel_id": "funnel_001",
  "user": {
    "anonymous_id": "uuid-v4-string",
    "session_id": "sess_abc123"
  },
  "funnel_data": {
    "funnel_name": "商品購入フロー",
    "total_steps": 3,
    "completed_steps": [0, 1, 2],
    "started_at": "2025-11-02T10:00:00.000Z",
    "completed_at": "2025-11-02T10:10:00.000Z",
    "duration_seconds": 600
  },
  "device": {
    "type": "desktop",
    "viewport_width": 1920,
    "viewport_height": 1080
  },
  "timestamp": "2025-11-02T10:10:00.000Z"
}
```

**レスポンス**: `200 OK`
```json
{
  "status": "received",
  "event_id": "evt_xyz789"
}
```

---

#### 3.3.2 ファネル離脱イベント

**イベントタイプ**: `funnel.dropped_off`

**ペイロード**:
```json
{
  "event_type": "funnel.dropped_off",
  "project_id": "proj_abc123",
  "funnel_id": "funnel_001",
  "user": {
    "anonymous_id": "uuid-v4-string",
    "session_id": "sess_abc123"
  },
  "funnel_data": {
    "funnel_name": "商品購入フロー",
    "total_steps": 3,
    "completed_steps": [0, 1],
    "dropoff_step": 1,
    "dropoff_step_name": "申込フォーム",
    "started_at": "2025-11-02T10:00:00.000Z",
    "dropped_at": "2025-11-02T10:05:00.000Z",
    "duration_seconds": 300
  },
  "device": {
    "type": "mobile",
    "viewport_width": 375,
    "viewport_height": 812
  },
  "timestamp": "2025-11-02T10:05:00.000Z"
}
```

---

#### 3.3.3 高頻度クリックイベント

**イベントタイプ**: `click.high_frequency`

**用途**: 特定要素への異常なクリック数を検知した場合に通知

**ペイロード**:
```json
{
  "event_type": "click.high_frequency",
  "project_id": "proj_abc123",
  "page_url": "https://example.com/lp",
  "element": {
    "tag_name": "BUTTON",
    "id": "cta-button",
    "class_name": "btn-primary",
    "text": "今すぐ申し込む"
  },
  "click_data": {
    "total_clicks": 500,
    "unique_sessions": 50,
    "time_window_minutes": 60
  },
  "timestamp": "2025-11-02T10:00:00.000Z"
}
```

---

#### 3.3.4 低スクロール率アラート

**イベントタイプ**: `scroll.low_engagement`

**用途**: ページスクロール率が低い場合にアラート送信

**ペイロード**:
```json
{
  "event_type": "scroll.low_engagement",
  "project_id": "proj_abc123",
  "page_url": "https://example.com/lp",
  "scroll_data": {
    "average_depth_percent": 25,
    "bounce_rate": 65.0,
    "total_sessions": 1000,
    "time_window_hours": 24
  },
  "timestamp": "2025-11-02T10:00:00.000Z"
}
```

---

## 4. クライアント側API（JavaScriptライブラリ）

### 4.1 概要
ブラウザで動作するJavaScriptライブラリが提供するAPIです。LocalStorageへのデータ保存を担当します。

### 4.2 初期化API

```typescript
// ライブラリ初期化
HeatmapTracker.init({
  projectId: "proj_abc123",
  apiKey: "your-api-key",
  connectedOneApiUrl: "https://api.connected-one.com/v1",
  enabledFeatures: {
    clickTracking: true,
    scrollTracking: true,
    mouseMoveTracking: true,
    funnelTracking: true
  },
  samplingRates: {
    clicks: 1.0,        // 100%記録
    scrolls: 0.5,       // 50%記録
    mouseMoves: 0.1     // 10%記録（サンプリング）
  },
  localStorageConfig: {
    maxSizeBytes: 4 * 1024 * 1024,  // 4MB
    retentionDays: 30
  }
});
```

---

### 4.3 データ記録API

#### 4.3.1 クリックトラッキング

```typescript
// クリックイベント記録（自動）
document.addEventListener('click', (event) => {
  HeatmapTracker.trackClick({
    x: event.clientX,
    y: event.clientY,
    element: event.target,
    timestamp: Date.now()
  });
});

// 手動記録
HeatmapTracker.trackClick({
  x: 960,
  y: 540,
  element: document.getElementById('cta-button'),
  timestamp: Date.now()
});
```

**LocalStorageに保存されるデータ**:
```json
{
  "pageId": "a3f8e92b",
  "pageUrl": "https://example.com/lp",
  "clicks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "x": 960,
      "y": 540,
      "element": {
        "tagName": "BUTTON",
        "className": "btn-primary",
        "id": "cta-button",
        "text": "今すぐ申し込む"
      },
      "timestamp": 1730545200000,
      "sessionId": "sess_abc123",
      "deviceType": "desktop"
    }
  ]
}
```

---

#### 4.3.2 スクロールトラッキング

```typescript
// スクロールイベント記録（自動・防抖処理済み）
window.addEventListener('scroll', () => {
  HeatmapTracker.trackScroll();
});

// 現在のスクロール深度を取得
const depth = HeatmapTracker.getScrollDepth();
console.log(`現在のスクロール深度: ${depth}%`);
```

---

#### 4.3.3 マウスムーブメントトラッキング

```typescript
// マウス移動記録（自動・サンプリング済み）
document.addEventListener('mousemove', (event) => {
  HeatmapTracker.trackMouseMove({
    x: event.clientX,
    y: event.clientY,
    timestamp: Date.now()
  });
});
```

---

### 4.4 ファネルトラッキングAPI

#### 4.4.1 ファネル初期化

```typescript
// コネクティッドワンからファネル定義を取得
const funnels = await HeatmapTracker.fetchFunnels("proj_abc123");

// ファネルトラッキング開始
HeatmapTracker.startFunnelTracking(funnels[0].funnel_id);
```

---

#### 4.4.2 ファネルステップ進行

```typescript
// 手動でステップ完了を記録
HeatmapTracker.completeFunnelStep({
  funnelId: "funnel_001",
  stepIndex: 1,
  timestamp: Date.now()
});

// 自動検知（URLベース）
// ページURLが一致した場合、自動的にステップ完了を記録
```

---

### 4.5 データ管理API

#### 4.5.1 データ取得

```typescript
// クリックデータ取得
const clickData = HeatmapTracker.getClickData({
  pageUrl: "https://example.com/lp"
});

// スクロールデータ取得
const scrollData = HeatmapTracker.getScrollData({
  pageUrl: "https://example.com/lp"
});

// ファネルデータ取得
const funnelData = HeatmapTracker.getFunnelData({
  funnelId: "funnel_001"
});
```

---

#### 4.5.2 データクリア

```typescript
// 全データクリア
HeatmapTracker.clearAllData();

// 特定ページのデータクリア
HeatmapTracker.clearPageData("https://example.com/lp");

// 古いデータのみクリア（30日以上前）
HeatmapTracker.cleanupOldData(30);
```

---

#### 4.5.3 データエクスポート

```typescript
// JSONファイルとしてエクスポート
HeatmapTracker.exportData({
  format: "json",
  filename: "heatmap-data-2025-11-02.json"
});

// CSV形式でエクスポート
HeatmapTracker.exportData({
  format: "csv",
  filename: "heatmap-clicks-2025-11-02.csv",
  dataType: "clicks"
});
```

---

### 4.6 ヒートマップ表示API

#### 4.6.1 ヒートマップ表示

```typescript
// クリックヒートマップ表示
HeatmapTracker.showHeatmap({
  type: "click",
  pageUrl: "https://example.com/lp"
});

// スクロールヒートマップ表示
HeatmapTracker.showHeatmap({
  type: "scroll",
  pageUrl: "https://example.com/lp"
});

// マウスムーブメントヒートマップ表示
HeatmapTracker.showHeatmap({
  type: "mousemove",
  pageUrl: "https://example.com/lp"
});
```

---

#### 4.6.2 ヒートマップ非表示

```typescript
// ヒートマップを非表示
HeatmapTracker.hideHeatmap();
```

---

#### 4.6.3 オーバーレイUI制御

```typescript
// オーバーレイUI表示
HeatmapTracker.showOverlay();

// オーバーレイUI非表示
HeatmapTracker.hideOverlay();

// オーバーレイUI位置設定
HeatmapTracker.setOverlayPosition({
  x: 20,
  y: 20
});
```

---

## 5. データフロー

### 5.1 データ記録フロー

```
[ユーザーアクション]
    ↓
[JavaScript Event Listener]
    ↓
[サンプリング・防抖処理]
    ↓
[LocalStorageに保存]
    ↓
[容量チェック（4MB超えたら古いデータ削除）]
```

---

### 5.2 Webhook送信フロー

```
[ファネル完了検知]
    ↓
[LocalStorageから関連データ取得]
    ↓
[Webhookペイロード生成]
    ↓
[コネクティッドワンAPIに送信]
    ↓
[送信結果をコンソールにログ]
```

---

## 6. エラーハンドリング

### 6.1 LocalStorageエラー

```typescript
try {
  localStorage.setItem(key, JSON.stringify(data));
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // 容量超過時の処理
    console.warn('LocalStorage quota exceeded. Cleaning up old data...');
    HeatmapTracker.cleanupOldData(7); // 7日以上前のデータ削除

    // 再試行
    localStorage.setItem(key, JSON.stringify(data));
  } else if (error.name === 'SecurityError') {
    // プライベートモード警告
    console.error('LocalStorage is disabled (private mode)');
  } else {
    console.error('Failed to save data:', error);
  }
}
```

---

### 6.2 API通信エラー

```typescript
try {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error('API request error:', error);

  // オフライン時はLocalStorageにキューイング
  HeatmapTracker.queueWebhook(payload);

  // オンライン復帰時に再送信
  window.addEventListener('online', () => {
    HeatmapTracker.flushWebhookQueue();
  });
}
```

---

## 7. セキュリティ

### 7.1 個人情報保護

**記録しないデータ**:
- 氏名、メールアドレス等の個人情報
- フォーム入力内容
- IPアドレス
- Cookie情報（匿名セッションIDのみ）

**記録するデータ**:
- クリック座標（匿名）
- スクロール深度
- マウス軌跡
- デバイスタイプ（desktop/tablet/mobile）
- セッションID（ランダム生成UUID）

---

### 7.2 XSS対策

```typescript
// 要素テキストのサニタイゼーション
function sanitizeElementText(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// クリック要素情報記録時
const element = {
  tagName: target.tagName,
  className: target.className,
  id: target.id,
  text: sanitizeElementText(target.textContent || '').slice(0, 50) // 50文字制限
};
```

---

### 7.3 Webhook署名検証

```typescript
// Webhook送信時のHMAC署名生成
async function generateWebhookSignature(
  payload: object,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, data);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// Webhook送信
const signature = await generateWebhookSignature(payload, webhookSecret);
fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'X-Webhook-Signature': signature,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});
```

---

## 8. パフォーマンス最適化

### 8.1 バッチ処理

```typescript
// クリックイベントを5秒ごとにバッチ保存
let clickBuffer: ClickEvent[] = [];

function bufferClickEvent(event: ClickEvent) {
  clickBuffer.push(event);

  // バッファが100件溜まったら即座に保存
  if (clickBuffer.length >= 100) {
    flushClickBuffer();
  }
}

function flushClickBuffer() {
  if (clickBuffer.length === 0) return;

  const existingData = HeatmapTracker.getClickData(currentPageUrl);
  existingData.clicks.push(...clickBuffer);

  localStorage.setItem(
    `heatmap_clicks_${pageId}`,
    JSON.stringify(existingData)
  );

  clickBuffer = [];
}

// 5秒ごとに自動フラッシュ
setInterval(flushClickBuffer, 5000);

// ページ離脱時にも保存
window.addEventListener('beforeunload', flushClickBuffer);
```

---

### 8.2 防抖処理（Debounce）

```typescript
// スクロールイベントの防抖処理
let scrollTimeout: number | null = null;

window.addEventListener('scroll', () => {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }

  scrollTimeout = setTimeout(() => {
    HeatmapTracker.trackScroll();
  }, 500); // 500ms後に実行
});
```

---

### 8.3 サンプリング

```typescript
// マウスムーブメントの10%サンプリング
document.addEventListener('mousemove', (event) => {
  if (Math.random() > 0.1) return; // 90%はスキップ

  HeatmapTracker.trackMouseMove({
    x: event.clientX,
    y: event.clientY,
    timestamp: Date.now()
  });
});
```

---

## 9. TypeScript型定義

```typescript
// HeatmapTracker クラス型定義
declare class HeatmapTracker {
  static init(config: HeatmapConfig): void;
  static trackClick(event: ClickEventData): void;
  static trackScroll(): void;
  static trackMouseMove(event: MouseMoveEventData): void;
  static startFunnelTracking(funnelId: string): void;
  static completeFunnelStep(data: FunnelStepData): void;
  static getClickData(pageUrl: string): ClickDataCollection;
  static getScrollData(pageUrl: string): ScrollDataCollection;
  static getFunnelData(funnelId: string): FunnelDataCollection;
  static clearAllData(): void;
  static clearPageData(pageUrl: string): void;
  static cleanupOldData(days: number): void;
  static exportData(options: ExportOptions): void;
  static showHeatmap(options: HeatmapDisplayOptions): void;
  static hideHeatmap(): void;
  static showOverlay(): void;
  static hideOverlay(): void;
  static setOverlayPosition(position: { x: number; y: number }): void;
  static fetchFunnels(projectId: string): Promise<Funnel[]>;
  static queueWebhook(payload: WebhookPayload): void;
  static flushWebhookQueue(): Promise<void>;
}

interface HeatmapConfig {
  projectId: string;
  apiKey: string;
  connectedOneApiUrl: string;
  enabledFeatures: {
    clickTracking: boolean;
    scrollTracking: boolean;
    mouseMoveTracking: boolean;
    funnelTracking: boolean;
  };
  samplingRates: {
    clicks: number;
    scrolls: number;
    mouseMoves: number;
  };
  localStorageConfig: {
    maxSizeBytes: number;
    retentionDays: number;
  };
}

interface ClickEventData {
  x: number;
  y: number;
  element: HTMLElement;
  timestamp: number;
}

interface MouseMoveEventData {
  x: number;
  y: number;
  timestamp: number;
}

interface FunnelStepData {
  funnelId: string;
  stepIndex: number;
  timestamp: number;
}

interface ExportOptions {
  format: "json" | "csv";
  filename: string;
  dataType?: "clicks" | "scrolls" | "mousemoves" | "funnels";
}

interface HeatmapDisplayOptions {
  type: "click" | "scroll" | "mousemove";
  pageUrl: string;
}

interface WebhookPayload {
  event_type: string;
  project_id: string;
  [key: string]: any;
}
```

---

## 10. 導入方法

### 10.1 CDN経由で導入

```html
<!-- ヒートマップトラッカー読み込み -->
<script src="https://cdn.your-domain.com/heatmap-tracker.min.js"></script>

<!-- 初期化 -->
<script>
  HeatmapTracker.init({
    projectId: "proj_abc123",
    apiKey: "your-api-key",
    connectedOneApiUrl: "https://api.connected-one.com/v1",
    enabledFeatures: {
      clickTracking: true,
      scrollTracking: true,
      mouseMoveTracking: true,
      funnelTracking: true
    },
    samplingRates: {
      clicks: 1.0,
      scrolls: 0.5,
      mouseMoves: 0.1
    },
    localStorageConfig: {
      maxSizeBytes: 4 * 1024 * 1024,
      retentionDays: 30
    }
  });
</script>
```

---

### 10.2 npm経由で導入

```bash
npm install @your-org/heatmap-tracker
```

```typescript
import HeatmapTracker from '@your-org/heatmap-tracker';

HeatmapTracker.init({
  projectId: "proj_abc123",
  apiKey: "your-api-key",
  // ... その他の設定
});
```

---

## 11. 付録

### 11.1 エラーコード一覧

| コード | 説明 | 対応方法 |
|--------|------|---------|
| `QUOTA_EXCEEDED` | LocalStorage容量超過 | 古いデータを削除 |
| `SECURITY_ERROR` | プライベートモード | ユーザーに通知 |
| `NETWORK_ERROR` | API通信失敗 | リトライ or キューイング |
| `UNAUTHORIZED` | APIキー無効 | APIキーを確認 |
| `INVALID_CONFIG` | 設定値が不正 | 初期化パラメータを確認 |

---

### 11.2 参考リンク

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - LocalStorageスキーマ定義
- [要件定義書](./requirements/requirements.md) - プロジェクト要件

---

**作成者**: AIエンジニア
**最終更新日**: 2025年11月2日
**バージョン**: 1.0
