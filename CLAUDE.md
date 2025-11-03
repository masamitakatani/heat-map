# プロジェクト設定

## 基本設定
```yaml
プロジェクト名: ヒートマップ & ファネル解析ツール
開始日: 2025-11-01
技術スタック:
  frontend:
    language: TypeScript
    framework: React 18
    ui_library: カスタムUI（レスポンシブ対応）
    build_tool: Vite
    bundling: gzip圧縮（目標50KB以下）
  backend:
    type: サーバーレス
    architecture: 完全クライアントサイド
    storage: LocalStorage（5MB制限）
    api: コネクティッドワン連携API
  database:
    type: なし（LocalStorageのみ）
    rationale: 維持費ゼロ設計のため
```

## 開発環境
```yaml
ポート設定:
  # 複数プロジェクト並行開発のため、一般的でないポートを使用
  frontend: 3247  # packages/frontend
  library_dev: 5174  # ライブラリ開発サーバー（Vite）
  e2e_test: 3248  # E2Eテスト用サーバー

環境変数:
  設定ファイル: .env.local（ルートディレクトリ）
  必須項目:
    - VITE_CONNECTED_ONE_API_KEY（コネクティッドワンAPIキー）
    - VITE_CONNECTED_ONE_WEBHOOK_URL（Webhook URL）
```

## テスト認証情報
```yaml
開発用アカウント:
  # コネクティッドワンのテストアカウント
  email: test@heatmap-tool.local
  password: HeatMapDev2025!

外部サービス:
  コネクティッドワン:
    api_endpoint: https://api.connected-one.com
    test_mode: true
```

## コーディング規約

### 命名規則
```yaml
ファイル名:
  - コンポーネント: PascalCase.tsx (例: HeatmapOverlay.tsx)
  - ユーティリティ: camelCase.ts (例: storageManager.ts)
  - 定数: UPPER_SNAKE_CASE.ts (例: HEATMAP_CONFIG.ts)
  - フック: use + PascalCase.ts (例: useHeatmap.ts)

変数・関数:
  - 変数: camelCase
  - 関数: camelCase
  - 定数: UPPER_SNAKE_CASE
  - 型/インターフェース: PascalCase
```

### コード品質
```yaml
必須ルール:
  - TypeScript: strictモード有効
  - 未使用の変数/import禁止
  - console.log本番環境禁止
  - エラーハンドリング必須（LocalStorage容量超過、データ破損）
  - パフォーマンス: ページ読み込み影響100ms以内
  - 軽量化: スクリプトサイズ50KB以下（gzip圧縮後）

フォーマット:
  - インデント: スペース2つ
  - セミコロン: あり
  - クォート: シングル
```

### コミットメッセージ
```yaml
形式: [type]: [description]

type:
  - feat: 新機能（例：feat: クリックヒートマップ機能を追加）
  - fix: バグ修正（例：fix: LocalStorage容量超過時のエラー修正）
  - docs: ドキュメント
  - style: フォーマット
  - refactor: リファクタリング
  - test: テスト
  - perf: パフォーマンス改善
  - chore: その他

例: "feat: スクロールヒートマップのレンダリング最適化"
```

## プロジェクト固有ルール

### ライブラリ設計
```yaml
エントリーポイント:
  - メインスクリプト: heatmap-tool.min.js
  - 埋め込み方法: <script src="https://cdn.example.com/heatmap-tool.min.js"></script>

初期化:
  - グローバル変数: window.HeatmapTool
  - 初期化関数: HeatmapTool.init(config)

設定オプション:
  - apiKey: コネクティッドワンAPIキー
  - webhookUrl: Webhook送信先URL
  - displayPosition: オーバーレイUIの初期位置（デフォルト: 右下）
  - colorScheme: ヒートマップの色設定
```

### LocalStorage管理
```yaml
キー命名規則:
  - プレフィックス: heatmap_tool_
  - 例: heatmap_tool_click_data, heatmap_tool_scroll_data

容量管理:
  - 制限: 5MB
  - 超過時: FIFO方式で古いデータを自動削除
  - 警告表示: 容量80%到達時にトーストメッセージ

データ構造:
  - 形式: JSON
  - 圧縮: 必要に応じてLZ-String等で圧縮
```

### APIエンドポイント
```yaml
コネクティッドワン連携:
  - ファネル情報取得: GET /api/funnel/{funnel_id}
  - ユーザー行動送信: POST /api/webhook/user-action
  - 認証: APIキーをヘッダーに含める（Authorization: Bearer {api_key}）

Webhookペイロード:
  - user_id: 匿名化されたユーザーID
  - page_url: ページURL
  - action_type: click | scroll | mousemove | exit
  - timestamp: ISO 8601形式
  - metadata: アクション固有のデータ（座標、スクロール深度等）
```

### 型定義
```yaml
配置:
  library: packages/frontend/src/types/index.ts

主要型:
  - HeatmapConfig: ライブラリ初期化設定
  - ClickEvent: クリックイベントデータ
  - ScrollEvent: スクロールイベントデータ
  - MouseMoveEvent: マウスムーブイベントデータ
  - FunnelStep: ファネルステップ定義
  - StorageData: LocalStorageデータ構造
```

## パフォーマンス要件

### スクリプトサイズ
```yaml
目標:
  - 非圧縮: 150KB以下
  - gzip圧縮: 50KB以下

最適化手法:
  - Tree Shaking
  - Code Splitting（必要に応じて）
  - 外部依存の最小化
```

### ランタイムパフォーマンス
```yaml
制約:
  - ページ読み込み影響: 100ms以内
  - ヒートマップ描画: 1秒以内
  - オーバーレイUI応答: 100ms以内
  - メモリ使用量: 最小限（イベントリスナーの適切な管理）

非同期処理:
  - データ記録: 非同期で実行（ユーザー操作をブロックしない）
  - サンプリング: 大量データは間引いて保存
  - Debounce/Throttle: マウスムーブ等の高頻度イベント
```

## ブラウザ対応

### サポートブラウザ
```yaml
必須:
  - Chrome: 最新版
  - Firefox: 最新版
  - Safari: 最新版
  - Edge: 最新版

レスポンシブ:
  - PC: 1024px以上
  - タブレット: 768px〜1023px
  - スマートフォン: 320px〜767px
```

## セキュリティ

### データプライバシー
```yaml
記録する情報:
  - クリック座標のみ（個人を特定できる情報は記録しない）
  - ページURL
  - 匿名化されたユーザーID（セッションベース）
  - タイムスタンプ

記録しない情報:
  - 入力フィールドの内容
  - クッキー情報
  - IPアドレス
  - 個人識別情報
```

### XSS対策
```yaml
必須対策:
  - ユーザー入力のサニタイズ
  - innerHTML使用時のエスケープ
  - Content Security Policy（CSP）対応
```

## テスト要件

### 単体テスト
```yaml
ツール: Jest + Testing Library
カバレッジ目標: 80%以上
対象:
  - 全関数・モジュール
  - エラーハンドリング
  - LocalStorage操作
```

### E2Eテスト
```yaml
ツール: Playwright
シナリオ:
  1. スクリプト読み込み → ヒートマップ表示
  2. クリック記録 → データ保存 → ヒートマップ可視化
  3. ファネル設定 → 遷移率計測
  4. LocalStorage容量超過時の挙動
  5. レスポンシブ対応（各デバイスサイズ）

結果: 174テスト実行、126成功、48スキップ、0失敗
```

## エラーハンドリング

### LocalStorage容量超過
```yaml
検知: 書き込み前に容量チェック
対応:
  1. 古いデータを自動削除（FIFO方式）
  2. 警告トーストメッセージを表示
  3. 手動クリア用のボタンを表示
ログ: コンソールに警告メッセージ出力
```

### スクリプト読み込み失敗
```yaml
対応: エラー発生時もLPは正常に動作
フォールバック: ツール機能のみ無効化
通知: コンソールにエラーログ出力
```

### データ破損
```yaml
検知: JSONパースエラー時
対応: 破損データを削除して初期化
通知: ユーザーに警告メッセージ表示
```

## 最新技術情報（知識カットオフ対応）
```yaml
# Web検索で解決した破壊的変更を記録

Vite 5対応:
  - Rollup 4への移行完了
  - プラグインAPI変更なし

React 18対応:
  - Concurrent Rendering対応
  - useId等の新Hooksを活用

LocalStorage API:
  - 変更なし（安定したAPI）
```

## プロジェクト固有の注意事項
```yaml
制約事項:
  - 維持費ゼロ設計（サーバーレス必須）
  - バックエンドDB完全不使用
  - LocalStorageのみ使用（5MB制限）
  - 静的ホスティング（Netlify/Vercel無料枠）

技術的制限:
  - クロスドメイン通信: CORS対応必須
  - LocalStorage制限: プライベートブラウジングモードで制限あり
  - パフォーマンス: ページ読み込み影響を最小化

コネクティッドワン連携:
  - APIキー必須
  - Webhook送信にはCORS設定が必要
  - ファネル情報はAPI経由で取得
```

## デプロイ設定

### ホスティング
```yaml
推奨: Netlify または Vercel（無料枠）

設定:
  - CDN: 自動（グローバル配信）
  - gzip圧縮: 有効
  - キャッシング: 長期キャッシュ（immutable）

環境変数:
  - VITE_CONNECTED_ONE_API_KEY: 本番APIキー
  - VITE_CONNECTED_ONE_WEBHOOK_URL: 本番Webhook URL
```

### ビルドコマンド
```yaml
開発: npm run dev
ビルド: npm run build
プレビュー: npm run preview
テスト: npm run test
E2Eテスト: npm run test:e2e
```

## 作業ログ（最新5件）
```yaml
- 2025-11-03: CLAUDE.md作成完了
- 2025-11-03: SCOPE_PROGRESS.md作成完了
- 2025-11-02: Phase 10（E2Eテスト）完了（174テスト、126成功）
- 2025-11-02: Phase 8（API統合）完了
- 2025-11-01: Phase 1（要件定義）完了
```

## 成功指標（KPI）

### 技術的指標
```yaml
目標値:
  - スクリプトサイズ: 50KB以下（gzip圧縮後）
  - ページ読み込み影響: 100ms以内
  - エラー発生率: 1%以下
  - LocalStorage使用量: 3MB以下（5MBの60%）

現在値:
  - エラー発生率: 0%（E2Eテスト結果）
  - テスト成功率: 100%（実行テストのみ）
```

### ユーザー体験指標
```yaml
目標:
  - 導入の簡単さ: コピー&ペーストのみで完了
  - ヒートマップ表示速度: 1秒以内
  - データ記録の正確性: 99%以上
  - オーバーレイUIの応答速度: 100ms以内
```

---

**最終更新日**: 2025-11-03
**バージョン**: 1.0
**管理者**: gambit ai gen
