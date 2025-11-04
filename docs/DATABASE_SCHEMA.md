# データベーススキーマ設計書

**プロジェクト**: ヒートマップ & ファネル解析ツール
**作成日**: 2025年11月2日
**バージョン**: 1.0

---

## 1. データストレージ概要

### 1.1 ストレージ方式
- **種類**: LocalStorage (完全サーバーレス)
- **データ形式**: JSON
- **容量制限**: 5MB
- **保存期間**: 永続化(ユーザーが手動でクリアするまで)
- **スコープ**: オリジン単位(同一ドメイン内でデータ共有)

### 1.2 バックエンドDB
**使用しない** (維持費ゼロ制約のため)

### 1.3 データ管理方針
- **FIFO方式**: 容量超過時は古いデータから自動削除
- **データ圧縮**: 保存時にJSON文字列を最小化
- **インデックス不要**: LocalStorageはKVS形式のため

---

## 2. LocalStorageキー設計

### 2.1 キー命名規則
```
heatmap_{category}_{identifier}
```

- **prefix**: `heatmap_` (他ライブラリとの競合を避ける)
- **category**: データカテゴリ(clicks, scrolls, mousemoves等)
- **identifier**: 識別子(URL hash、ページID等)

### 2.2 主要キー一覧

| キー名 | 説明 | データ型 | 例 |
|--------|------|---------|-----|
| `heatmap_config` | ツール設定情報 | Object | 表示状態、UI位置等 |
| `heatmap_clicks_{pageId}` | クリックデータ | Array | クリック座標リスト |
| `heatmap_scrolls_{pageId}` | スクロールデータ | Array | スクロール深度リスト |
| `heatmap_mousemoves_{pageId}` | マウスムーブメントデータ | Array | マウス軌跡リスト |
| `heatmap_funnel_{funnelId}` | ファネルステップデータ | Object | ファネル遷移情報 |
| `heatmap_metadata` | メタデータ | Object | データ作成日時、バージョン等 |

---

## 3. データ構造定義

### 3.1 ツール設定情報 (`heatmap_config`)

**用途**: ヒートマップの表示状態、UI設定を保存

```typescript
interface HeatmapConfig {
  version: string;                    // データスキーマバージョン (例: "1.0")
  isEnabled: boolean;                 // ヒートマップ表示ON/OFF
  displayMode: DisplayMode;           // 表示モード
  overlayPosition: {                  // オーバーレイUI位置
    x: number;                        // X座標(px)
    y: number;                        // Y座標(px)
  };
  colorScheme: {                      // カラースキーム設定
    high: string;                     // 高頻度色 (例: "#FF0000")
    medium: string;                   // 中頻度色 (例: "#FFFF00")
    low: string;                      // 低頻度色 (例: "#0000FF")
  };
  opacity: {                          // 透明度設定
    min: number;                      // 最小透明度 (0.0-1.0)
    max: number;                      // 最大透明度 (0.0-1.0)
  };
  createdAt: string;                  // 初回作成日時 (ISO 8601)
  updatedAt: string;                  // 最終更新日時 (ISO 8601)
}

type DisplayMode =
  | "click"                           // クリックヒートマップ
  | "scroll"                          // スクロールヒートマップ
  | "mousemove"                       // マウスムーブメント
  | "funnel";                         // ファネル解析ダッシュボード
```

**サンプルデータ**:
```json
{
  "version": "1.0",
  "isEnabled": true,
  "displayMode": "click",
  "overlayPosition": {
    "x": 20,
    "y": 20
  },
  "colorScheme": {
    "high": "#FF0000",
    "medium": "#FFFF00",
    "low": "#0000FF"
  },
  "opacity": {
    "min": 0.3,
    "max": 0.8
  },
  "createdAt": "2025-11-02T10:00:00.000Z",
  "updatedAt": "2025-11-02T12:30:00.000Z"
}
```

---

### 3.2 クリックデータ (`heatmap_clicks_{pageId}`)

**用途**: ページ上のクリック位置を記録

```typescript
interface ClickDataCollection {
  pageUrl: string;                    // ページURL
  pageId: string;                     // ページ識別子(URLのhash値)
  viewport: {                         // ビューポート情報
    width: number;                    // 幅(px)
    height: number;                   // 高さ(px)
  };
  clicks: ClickEvent[];               // クリックイベント配列
  totalClicks: number;                // 総クリック数
  createdAt: string;                  // データ作成日時
  updatedAt: string;                  // 最終更新日時
}

interface ClickEvent {
  id: string;                         // イベント一意ID (UUID)
  x: number;                          // X座標(px、ビューポート基準)
  y: number;                          // Y座標(px、ビューポート基準)
  element: {                          // クリック対象要素
    tagName: string;                  // タグ名 (例: "BUTTON")
    className: string;                // クラス名
    id: string;                       // 要素ID
    text: string;                     // テキスト内容(最大50文字)
  };
  timestamp: number;                  // タイムスタンプ(Unix時間, ms)
  sessionId: string;                  // セッションID
  deviceType: DeviceType;             // デバイスタイプ
}

type DeviceType = "desktop" | "tablet" | "mobile";
```

**サンプルデータ**:
```json
{
  "pageUrl": "https://example.com/lp",
  "pageId": "a3f8e92b",
  "viewport": {
    "width": 1920,
    "height": 1080
  },
  "clicks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "x": 960,
      "y": 540,
      "element": {
        "tagName": "BUTTON",
        "className": "cta-button primary",
        "id": "main-cta",
        "text": "今すぐ申し込む"
      },
      "timestamp": 1730545200000,
      "sessionId": "sess_abc123",
      "deviceType": "desktop"
    }
  ],
  "totalClicks": 150,
  "createdAt": "2025-11-02T10:00:00.000Z",
  "updatedAt": "2025-11-02T12:30:00.000Z"
}
```

**容量最適化**:
- `element.text`は最大50文字に制限
- 古いクリックデータは集計後に削除(集計結果のみ保持)

---

### 3.3 スクロールデータ (`heatmap_scrolls_{pageId}`)

**用途**: ページのスクロール深度を記録

```typescript
interface ScrollDataCollection {
  pageUrl: string;                    // ページURL
  pageId: string;                     // ページ識別子
  pageHeight: number;                 // ページ全体の高さ(px)
  scrolls: ScrollEvent[];             // スクロールイベント配列
  depthDistribution: {                // 深度分布(集計データ)
    depth: number;                    // 深度(%, 0-100)
    reachedCount: number;             // 到達ユーザー数
  }[];
  createdAt: string;
  updatedAt: string;
}

interface ScrollEvent {
  id: string;                         // イベント一意ID
  maxDepth: number;                   // 最大到達深度(%, 0-100)
  timestamp: number;                  // タイムスタンプ
  sessionId: string;                  // セッションID
  deviceType: DeviceType;             // デバイスタイプ
}
```

**サンプルデータ**:
```json
{
  "pageUrl": "https://example.com/lp",
  "pageId": "a3f8e92b",
  "pageHeight": 5000,
  "scrolls": [
    {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "maxDepth": 75,
      "timestamp": 1730545300000,
      "sessionId": "sess_abc123",
      "deviceType": "desktop"
    }
  ],
  "depthDistribution": [
    { "depth": 0, "reachedCount": 1000 },
    { "depth": 25, "reachedCount": 800 },
    { "depth": 50, "reachedCount": 500 },
    { "depth": 75, "reachedCount": 200 },
    { "depth": 100, "reachedCount": 50 }
  ],
  "createdAt": "2025-11-02T10:00:00.000Z",
  "updatedAt": "2025-11-02T12:30:00.000Z"
}
```

---

### 3.4 マウスムーブメントデータ (`heatmap_mousemoves_{pageId}`)

**用途**: マウスカーソルの軌跡を記録

```typescript
interface MouseMoveDataCollection {
  pageUrl: string;
  pageId: string;
  viewport: {
    width: number;
    height: number;
  };
  moves: MouseMoveEvent[];            // マウスムーブメント配列
  hoverAreas: HoverArea[];            // ホバー頻出エリア(集計データ)
  createdAt: string;
  updatedAt: string;
}

interface MouseMoveEvent {
  id: string;
  positions: {                        // 座標配列(サンプリング済み)
    x: number;
    y: number;
    timestamp: number;                // 相対タイムスタンプ(ms)
  }[];
  sessionId: string;
  deviceType: DeviceType;
}

interface HoverArea {
  x: number;                          // エリア中心X座標
  y: number;                          // エリア中心Y座標
  radius: number;                     // エリア半径(px)
  hoverCount: number;                 // ホバー回数
  avgDuration: number;                // 平均滞在時間(ms)
}
```

**サンプルデータ**:
```json
{
  "pageUrl": "https://example.com/lp",
  "pageId": "a3f8e92b",
  "viewport": {
    "width": 1920,
    "height": 1080
  },
  "moves": [
    {
      "id": "750e8400-e29b-41d4-a716-446655440002",
      "positions": [
        { "x": 100, "y": 200, "timestamp": 0 },
        { "x": 150, "y": 250, "timestamp": 100 },
        { "x": 200, "y": 300, "timestamp": 200 }
      ],
      "sessionId": "sess_abc123",
      "deviceType": "desktop"
    }
  ],
  "hoverAreas": [
    {
      "x": 960,
      "y": 540,
      "radius": 50,
      "hoverCount": 150,
      "avgDuration": 2000
    }
  ],
  "createdAt": "2025-11-02T10:00:00.000Z",
  "updatedAt": "2025-11-02T12:30:00.000Z"
}
```

**容量最適化**:
- マウス座標は**100msごとにサンプリング**(全座標を保存しない)
- 一定期間後は`hoverAreas`のみ保持し、生データは削除

---

### 3.5 ファネルデータ (`heatmap_funnel_{funnelId}`)

**用途**: ファネルステップ間の遷移・離脱を記録

```typescript
interface FunnelDataCollection {
  funnelId: string;                   // ファネル識別子
  funnelName: string;                 // ファネル名
  steps: FunnelStep[];                // ファネルステップ配列
  sessions: FunnelSession[];          // ユーザーセッション配列
  summary: FunnelSummary;             // サマリー(集計データ)
  createdAt: string;
  updatedAt: string;
}

interface FunnelStep {
  stepIndex: number;                  // ステップ番号(0から開始)
  stepName: string;                   // ステップ名
  pageUrl: string;                    // ページURL
  pageId: string;                     // ページ識別子
}

interface FunnelSession {
  sessionId: string;                  // セッションID
  userId: string;                     // ユーザーID(匿名化)
  completedSteps: number[];           // 完了したステップ番号配列
  dropoffStep: number | null;         // 離脱ステップ(nullは完走)
  startedAt: number;                  // 開始タイムスタンプ
  completedAt: number | null;         // 完了タイムスタンプ
  deviceType: DeviceType;
}

interface FunnelSummary {
  totalSessions: number;              // 総セッション数
  completedSessions: number;          // 完走セッション数
  conversionRate: number;             // コンバージョン率(%)
  stepStats: {                        // ステップごとの統計
    stepIndex: number;
    reached: number;                  // 到達数
    completed: number;                // 完了数
    dropoff: number;                  // 離脱数
    dropoffRate: number;              // 離脱率(%)
    avgTimeSpent: number;             // 平均滞在時間(ms)
  }[];
}
```

**サンプルデータ**:
```json
{
  "funnelId": "funnel_001",
  "funnelName": "LPコンバージョンファネル",
  "steps": [
    {
      "stepIndex": 0,
      "stepName": "LPトップ",
      "pageUrl": "https://example.com/lp",
      "pageId": "a3f8e92b"
    },
    {
      "stepIndex": 1,
      "stepName": "申込フォーム",
      "pageUrl": "https://example.com/form",
      "pageId": "b4g9f03c"
    },
    {
      "stepIndex": 2,
      "stepName": "サンクスページ",
      "pageUrl": "https://example.com/thanks",
      "pageId": "c5h0g14d"
    }
  ],
  "sessions": [
    {
      "sessionId": "sess_abc123",
      "userId": "user_xyz789",
      "completedSteps": [0, 1, 2],
      "dropoffStep": null,
      "startedAt": 1730545200000,
      "completedAt": 1730545800000,
      "deviceType": "desktop"
    },
    {
      "sessionId": "sess_def456",
      "userId": "user_uvw456",
      "completedSteps": [0, 1],
      "dropoffStep": 1,
      "startedAt": 1730545300000,
      "completedAt": null,
      "deviceType": "mobile"
    }
  ],
  "summary": {
    "totalSessions": 1000,
    "completedSessions": 250,
    "conversionRate": 25.0,
    "stepStats": [
      {
        "stepIndex": 0,
        "reached": 1000,
        "completed": 700,
        "dropoff": 300,
        "dropoffRate": 30.0,
        "avgTimeSpent": 45000
      },
      {
        "stepIndex": 1,
        "reached": 700,
        "completed": 400,
        "dropoff": 300,
        "dropoffRate": 42.86,
        "avgTimeSpent": 120000
      },
      {
        "stepIndex": 2,
        "reached": 400,
        "completed": 250,
        "dropoff": 150,
        "dropoffRate": 37.5,
        "avgTimeSpent": 10000
      }
    ]
  },
  "createdAt": "2025-11-02T10:00:00.000Z",
  "updatedAt": "2025-11-02T12:30:00.000Z"
}
```

**容量最適化**:
- 古いセッションデータは`summary`に集計後、削除
- `sessions`は直近100件のみ保持

---

### 3.6 メタデータ (`heatmap_metadata`)

**用途**: データ全体の管理情報

```typescript
interface HeatmapMetadata {
  version: string;                    // スキーマバージョン
  totalDataSize: number;              // 総データサイズ(bytes)
  lastCleanupAt: string;              // 最終クリーンアップ日時
  dataRetentionDays: number;          // データ保持期間(日)
  pages: {                            // ページ別データサイズ
    pageId: string;
    pageUrl: string;
    dataSize: number;                 // バイト数
    lastUpdatedAt: string;
  }[];
}
```

**サンプルデータ**:
```json
{
  "version": "1.0",
  "totalDataSize": 2048000,
  "lastCleanupAt": "2025-11-02T00:00:00.000Z",
  "dataRetentionDays": 30,
  "pages": [
    {
      "pageId": "a3f8e92b",
      "pageUrl": "https://example.com/lp",
      "dataSize": 512000,
      "lastUpdatedAt": "2025-11-02T12:30:00.000Z"
    }
  ]
}
```

---

## 4. データ管理・最適化

### 4.1 容量管理

**LocalStorage容量制限対策**:
1. **事前容量チェック**
   - データ書き込み前に現在の使用量を確認
   - 5MBの80%(4MB)を超えたら警告

2. **自動クリーンアップ(FIFO)**
   - 容量が5MBに近づいたら古いデータから削除
   - `createdAt`の古い順に削除

3. **データ集計・圧縮**
   - 生データ → 集計データへの変換
   - 不要なプロパティの削除
   - JSON.stringifyで最小化

### 4.2 データサンプリング

**記録データの間引き**:
- **マウスムーブメント**: 100msごとにサンプリング
- **スクロールイベント**: 防抖処理(500ms)
- **クリックイベント**: 全て記録(重要なため)

### 4.3 データライフサイクル

```
[生データ記録] → [一定期間保持] → [集計処理] → [生データ削除] → [集計結果保持]
```

**例: クリックデータ**
1. 7日間: 全クリックデータを保持
2. 7日経過後: 集計データのみ保持
3. 30日経過後: 古い集計データを削除

---

## 5. セキュリティ・プライバシー

### 5.1 個人情報保護
- **記録しないデータ**:
  - 氏名、メールアドレス等の個人情報
  - フォーム入力内容
  - IPアドレス
  - Cookie情報

- **記録するデータ**:
  - クリック座標(匿名)
  - スクロール深度
  - マウス軌跡
  - セッションID(ランダム生成)

### 5.2 データサニタイゼーション
- `element.text`はXSS対策のためエスケープ処理
- URL記録時はクエリパラメータを除外(個人情報漏洩防止)

---

## 6. データマイグレーション

### 6.1 バージョン管理
- `version`フィールドでスキーマバージョンを管理
- スキーマ変更時は古いデータを新形式に移行

### 6.2 マイグレーション処理例
```typescript
function migrateData(oldData: any, oldVersion: string): HeatmapConfig {
  if (oldVersion === "0.9") {
    // v0.9 → v1.0 へのマイグレーション
    return {
      ...oldData,
      version: "1.0",
      // 新しいフィールドを追加
      opacity: { min: 0.3, max: 0.8 }
    };
  }
  return oldData;
}
```

---

## 7. データアクセスパターン

### 7.1 主要な読み書き操作

| 操作 | キー | 頻度 | 最適化 |
|------|------|------|--------|
| クリック記録 | `heatmap_clicks_{pageId}` | 高 | 非同期書き込み |
| スクロール記録 | `heatmap_scrolls_{pageId}` | 中 | 防抖処理 |
| ヒートマップ表示 | `heatmap_clicks_{pageId}` | 中 | キャッシュ利用 |
| 設定読み込み | `heatmap_config` | 低 | 初回のみ読み込み |
| ファネル更新 | `heatmap_funnel_{funnelId}` | 低 | バッチ処理 |

### 7.2 パフォーマンス最適化
- **バッチ書き込み**: 複数イベントをまとめて書き込み
- **防抖処理**: 短時間の連続イベントは間引き
- **非同期処理**: メインスレッドをブロックしない

---

## 8. エラーハンドリング

### 8.1 LocalStorage書き込みエラー

**エラーケース**:
1. 容量超過(`QuotaExceededError`)
2. プライベートモードでの書き込み制限
3. データ破損(JSONパースエラー)

**対応**:
```typescript
try {
  localStorage.setItem(key, JSON.stringify(data));
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // 古いデータを削除して再試行
    cleanupOldData();
    localStorage.setItem(key, JSON.stringify(data));
  } else if (error.name === 'SecurityError') {
    // プライベートモード警告
    console.warn('LocalStorage is disabled in private mode');
  } else {
    // その他のエラー
    console.error('Failed to save data:', error);
  }
}
```

---

## 9. テストデータ

### 9.1 サンプルデータ生成
開発・テスト用にダミーデータを生成する関数を用意

```typescript
function generateSampleClickData(count: number): ClickDataCollection {
  const clicks: ClickEvent[] = [];
  for (let i = 0; i < count; i++) {
    clicks.push({
      id: crypto.randomUUID(),
      x: Math.random() * 1920,
      y: Math.random() * 1080,
      element: {
        tagName: "BUTTON",
        className: "sample-button",
        id: `btn-${i}`,
        text: "Sample Button"
      },
      timestamp: Date.now() - (count - i) * 1000,
      sessionId: "test_session",
      deviceType: "desktop"
    });
  }

  return {
    pageUrl: "https://example.com/test",
    pageId: "test_page",
    viewport: { width: 1920, height: 1080 },
    clicks,
    totalClicks: count,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
```

---

## 10. 付録

### 10.1 用語集
| 用語 | 説明 |
|------|------|
| LocalStorage | ブラウザに永続的にデータを保存するWeb Storage API |
| FIFO | First In First Out - 先入れ先出し方式 |
| サンプリング | データを間引いて保存すること |
| 防抖(Debounce) | 連続するイベントを一定時間後にまとめて処理 |
| セッションID | ユーザーの訪問セッションを識別する一意ID |

### 10.2 参考リンク
- [Web Storage API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [LocalStorage limits - Stack Overflow](https://stackoverflow.com/questions/2989284/what-is-the-max-size-of-localstorage-values)

---

**作成者**: AIエンジニア
**最終更新日**: 2025年11月2日
**バージョン**: 1.0
