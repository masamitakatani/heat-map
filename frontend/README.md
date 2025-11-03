# Heatmap Analytics - API統合

## 📌 概要

このプロジェクトは、ヒートマップ＆ファネル解析ツールのフロントエンド実装です。TanStack Queryを使用してConnected One APIと統合し、完全なサーバーレス構成を実現しています。

## ✅ 実装完了項目

### Phase 6: API統合

- [x] **TanStack Query統合**
  - `@tanstack/query-core` を使用したVanilla JS環境でのクエリ管理
  - QueryClientの初期化とグローバルインスタンス管理
  - カスタムフック（`useFunnels`, `useProjectSettings`）の実装

- [x] **APIクライアント実装**
  - 汎用HTTPクライアント（`ApiClient`）の実装
  - Bearer認証対応
  - エラーハンドリングとレスポンス処理

- [x] **Connected One API連携**
  - ファネル情報取得API（`fetchFunnels`）
  - プロジェクト設定取得API（`fetchProjectSettings`）
  - レスポンスの型変換とデータ正規化

- [x] **Webhook送信機能**
  - ファネル完了イベント送信
  - ファネル離脱イベント送信
  - HMAC-SHA256署名生成
  - オフライン時のキューイング機能
  - オンライン復帰時の自動再送信

- [x] **エラーハンドリング**
  - リトライロジック（指数バックオフ）
  - LocalStorageエラー処理（容量超過、セキュリティエラー）
  - ネットワークエラー処理
  - グローバルエラーハンドラー登録

- [x] **テストページ作成**
  - インタラクティブなテストUI
  - API呼び出しのデバッグ機能
  - Webhook送信のテスト機能
  - LocalStorageの可視化

## 🚀 使用方法

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000/` を開いてテストページにアクセスします。

### ビルド

```bash
npm run build
```

ビルド成果物は `dist/` ディレクトリに出力されます：
- `dist/heatmap-analytics.umd.js` - UMD形式（ブラウザ直接利用）
- `dist/heatmap-analytics.es.js` - ES Module形式（モジュールバンドラー用）

### ライブラリの使用例

```html
<!DOCTYPE html>
<html>
<head>
  <title>Heatmap Analytics</title>
</head>
<body>
  <script type="module">
    import HeatmapAnalytics from './dist/heatmap-analytics.es.js';

    const tracker = new HeatmapAnalytics({
      api: {
        apiKey: 'your-api-key',
        projectId: 'proj_abc123',
        baseUrl: 'https://api.connected-one.com/v1',
      },
      debug: true,
    });

    tracker.init();
  </script>
</body>
</html>
```

## 📁 ファイル構成

```
frontend/
├── src/
│   ├── api/                    # API統合モジュール
│   │   ├── client.ts          # APIクライアント基盤
│   │   ├── connectedOne.ts    # Connected One API連携
│   │   ├── webhook.ts         # Webhook送信機能
│   │   ├── queries.ts         # TanStack Query統合
│   │   ├── errorHandler.ts   # エラーハンドリング
│   │   └── index.ts           # エクスポート統合
│   ├── storage/               # LocalStorage管理
│   ├── types/                 # TypeScript型定義
│   ├── utils/                 # ユーティリティ関数
│   └── main.ts                # メインエントリーポイント
├── index.html                 # テストページ
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🔧 API仕様

### 初期化

```typescript
const tracker = new HeatmapAnalytics({
  api: {
    apiKey: string;         // APIキー
    projectId: string;      // プロジェクトID
    baseUrl?: string;       // API Base URL（省略可）
  },
  debug?: boolean;          // デバッグモード
  autoStart?: boolean;      // 自動記録開始
});

tracker.init();
```

### ファネル情報取得

```typescript
import { fetchFunnels } from './api/connectedOne';

const response = await fetchFunnels('proj_abc123');

if (response.error) {
  console.error(response.error.message);
} else {
  console.log(response.data); // Funnel[]
}
```

### Webhook送信

```typescript
import { sendWebhook } from './api/webhook';

const payload = {
  event_type: 'funnel.completed',
  project_id: 'proj_abc123',
  funnel_id: 'funnel_001',
  user: {
    anonymous_id: 'uuid-v4-string',
    session_id: 'sess_abc123',
  },
  // ... その他のフィールド
};

const response = await sendWebhook(payload);
```

## 🧪 テスト

テストページ（`http://localhost:3000/`）で以下の機能をテストできます：

1. **初期化テスト**
   - APIキー、プロジェクトIDを入力
   - 初期化ボタンをクリック
   - 初期化状態を確認

2. **API呼び出しテスト**
   - ファネル情報取得
   - プロジェクト設定取得

3. **Webhook送信テスト**
   - ファネル完了イベント送信
   - ファネル離脱イベント送信
   - キューのフラッシュ

4. **データ管理**
   - LocalStorageの確認
   - データクリア

## 📊 パフォーマンス

- **ライブラリサイズ**:
  - UMD: 29.26 kB (gzip: 9.30 kB)
  - ES Module: 68.32 kB (gzip: 16.30 kB)

- **目標**: 50KB以下（gzip圧縮後） ✅ 達成

## 🔐 セキュリティ

- **認証**: Bearer Token（APIキー）
- **Webhook署名**: HMAC-SHA256
- **個人情報保護**: クリック座標のみ記録（個人情報は記録しない）
- **XSS対策**: 要素テキストのサニタイゼーション

## 🐛 トラブルシューティング

### APIエラー

- **NETWORK_ERROR**: ネットワーク接続を確認してください
- **UNAUTHORIZED**: APIキーを確認してください
- **QUOTA_EXCEEDED**: LocalStorageの容量が不足しています

### LocalStorageエラー

- **SecurityError**: プライベートモードでは使用できません
- **QuotaExceededError**: 古いデータを削除してください

## 📝 次のステップ

- Phase 4: ヒートマップ機能実装
- Phase 5: ファネル解析機能実装
- Phase 7: UI/UX実装（オーバーレイUI）
- Phase 8: テスト
- Phase 9: ドキュメント作成
- Phase 10: デプロイ準備

## 📚 参考資料

- [API仕様書](../docs/API_SPEC.md)
- [要件定義書](../docs/requirements/requirements.md)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
