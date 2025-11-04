# Heatmap & Funnel Analytics Tool

> **Phase 5完了**: ファネル解析機能実装

軽量なJavaScriptライブラリとして、LPに埋め込み可能なヒートマップ&ファネル解析ツールです。

## 📦 特徴

- **軽量**: 12.36KB（gzip圧縮後）- 目標の50KB以下を達成！
- **サーバーレス**: LocalStorageのみでデータ保存（維持費ゼロ）
- **TypeScript**: 型安全な実装
- **シンプル**: scriptタグで簡単導入
- **リアルタイム**: ユーザー行動を即座に可視化
- **ファネル解析**: 複数ステップの遷移率・離脱率を可視化

## 🚀 導入方法

### CDN経由（Phase 11で実装予定）

```html
<script src="https://cdn.your-domain.com/heatmap-analytics.umd.js"></script>
<script>
  const analytics = new HeatmapAnalytics({
    debug: true, // デバッグモード
    autoStart: true, // 自動記録開始
  });
  analytics.init();
</script>
```

### npm経由

```bash
npm install @heatmap-analytics/frontend
```

```javascript
import HeatmapAnalytics from '@heatmap-analytics/frontend';

const analytics = new HeatmapAnalytics({
  debug: false,
  autoStart: true,
  api: {
    baseUrl: 'http://localhost:8000',
    apiKey: 'hm_your_api_key',
    projectId: 'proj_your_project_id',
  },
});
analytics.init();
```

### API連携（オプション）

バックエンドAPIと連携する場合、以下の設定を追加します:

```javascript
const analytics = new HeatmapAnalytics({
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    apiKey: import.meta.env.VITE_API_KEY,
    projectId: import.meta.env.VITE_PROJECT_ID,
  },
});
```

**機能**:
- APIからファネル定義を自動取得
- 1分間隔でイベントをバックエンドに送信
- オフライン時は自動キューイング、オンライン復帰時に再送信
- LocalStorage優先（API障害時も動作継続）

## 📖 API

### `new HeatmapAnalytics(config)`

インスタンスを作成します。

**設定オプション**:
```typescript
{
  autoStart?: boolean;           // 自動記録開始（デフォルト: true）
  samplingInterval?: {
    mousemove?: number;         // マウス移動サンプリング間隔（ms）
    scroll?: number;            // スクロールサンプリング間隔（ms）
  };
  debug?: boolean;              // デバッグモード
  overlay?: {
    initialVisible?: boolean;   // オーバーレイ初期表示状態
    initialMode?: 'click' | 'scroll' | 'mouse' | 'funnel';
  };
  api?: {                       // API連携設定（オプション）
    baseUrl?: string;           // バックエンドAPIのベースURL
    apiKey?: string;            // APIキー
    projectId?: string;         // プロジェクトID
  };
}
```

### `analytics.init()`

ライブラリを初期化します。

### `analytics.start()`

記録を開始します（`autoStart: false`の場合に使用）。

### `analytics.stop()`

記録を停止します。

### `analytics.clearData()`

記録したデータを削除します（確認ダイアログ表示）。

### `analytics.getSessionId()`

現在のセッションIDを取得します。

### `analytics.getAnonymousId()`

匿名ID（ブラウザ固有のUUID）を取得します。

## 🛠 開発

### セットアップ

```bash
npm install
```

### 開発サーバー起動

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### ビルドサイズ確認

```bash
npm run size
```

## 📁 ディレクトリ構造

```
packages/frontend/
├── src/
│   ├── types/          # 型定義
│   │   └── index.ts
│   ├── storage/        # LocalStorage管理
│   │   └── localStorage.ts
│   ├── utils/          # ユーティリティ
│   │   ├── uuid.ts
│   │   └── device.ts
│   ├── tracking/       # トラッキング機能 ✅
│   │   ├── clickTracker.ts
│   │   ├── scrollTracker.ts
│   │   └── mouseMoveTracker.ts
│   ├── funnel/         # ファネル解析 ✅
│   │   ├── funnelManager.ts
│   │   ├── funnelTracker.ts
│   │   └── funnelAnalytics.ts
│   ├── renderer/       # 描画エンジン ✅
│   │   ├── heatmapRenderer.ts
│   │   └── funnelRenderer.ts
│   ├── ui/             # オーバーレイUI ✅
│   │   └── overlay.ts
│   ├── api/            # API連携 ✅
│   │   └── webhook.ts
│   └── main.ts         # メインエントリーポイント
├── dist/               # ビルド出力（自動生成）
├── demo.html           # デモページ ✅
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 📝 Phase 5で実装した機能

### ✅ ファネル定義管理
- **ファネル作成**: 複数ステップのファネル定義を作成
- **URLマッチング**: ワイルドカード対応のURL照合
- **デフォルトファネル**: デモ用のファネルを自動生成
- **LocalStorage保存**: ファネル定義をローカルに保存

### ✅ ファネルトラッキング
- **自動検知**: 現在のURLに一致するファネルステップを自動検知
- **ステップ進行**: ファネルステップの完了を記録
- **離脱検出**: ファネルからの離脱を自動検出
- **イベント記録**: すべてのファネルイベントをLocalStorageに保存

### ✅ ファネル統計計算
- **遷移率計算**: 各ステップの完了率を計算
- **離脱率計算**: 各ステップの離脱率を計算
- **コンバージョン率**: 全体のコンバージョン率を算出
- **ボトルネック特定**: 離脱率が最も高いステップを特定

### ✅ ファネルチャート描画
- **ビジュアル表示**: ファネル形状でステップを可視化
- **統計情報**: 各ステップのユーザー数、完了率、離脱率を表示
- **インタラクティブ**: モーダルで詳細情報を表示
- **レスポンシブ**: 画面サイズに応じて調整

### ✅ Webhook送信機能
- **イベント送信**: ファネル完了/離脱イベントをコネクティッドワンに送信
- **オフライン対応**: オフライン時はキューに保存、オンライン復帰時に再送
- **リトライ機能**: 送信失敗時は最大3回リトライ
- **HMAC署名**: Webhook署名検証対応

### ✅ デモデータ生成
- **ダミーイベント**: デモ用のファネルイベントを自動生成
- **統計表示**: 実際の統計データを確認可能

## 🔜 次のPhase（Phase 6以降）

- コネクティッドワン完全統合
- リアルタイムダッシュボード
- A/Bテスト機能
- セッション録画（リプレイ機能）

## 📊 ライブラリサイズ

- **目標**: 50KB以下（gzip圧縮後）
- **現状**: 12.36KB（gzip圧縮後）✅
- **UMD版**: 27.74KB（非圧縮）
- **ESM版**: 53.84KB（非圧縮）

**Phase 4→Phase 5での増加**: +4.68KB（ファネル解析機能追加による）

## 🧪 動作確認

1. ビルド実行:
   ```bash
   npm run build
   ```

2. デモページを開く:
   ```bash
   npm run dev
   ```
   ブラウザで `http://localhost:5173/demo.html` にアクセス

3. ヒートマップを試す:
   - 画面右下の「ヒートマップ分析」パネルを使用
   - ページ内をクリック、スクロール、マウス移動
   - 「ヒートマップを表示」ボタンで可視化

4. ファネル解析を試す:
   - オーバーレイUIで「ファネル」モードを選択
   - 「ヒートマップを表示」ボタンをクリック
   - ファネルチャートが表示され、統計情報を確認可能

## 🔒 セキュリティ

- 個人情報は一切記録しません
- 匿名ID（UUID）のみ使用
- LocalStorageのみでデータ保存

## 📄 ライセンス

MIT

## 🎯 主な機能

### クリックヒートマップ
- ユーザーがクリックした場所を記録
- クリック頻度を色の濃淡で可視化（赤=高頻度、青=低頻度）
- 要素情報（タグ名、ID、クラス、テキスト）も記録
- XSS対策済み

### スクロールヒートマップ
- ページのスクロール深度を記録
- ユーザーの離脱ポイントを可視化
- デバウンス処理でパフォーマンス最適化

### マウスムーブメントヒートマップ
- マウスカーソルの移動軌跡を記録
- サンプリング（10%）+ スロットリング（100ms）で軽量化
- ユーザーの注目エリアを特定

### オーバーレイUI
- ドラッグ&ドロップで自由に移動可能
- 4つの表示モード（クリック/スクロール/マウス/ファネル）
- ヒートマップの表示/非表示切替
- データクリア機能

### ファネル解析
- 複数ステップのファネル定義
- URLベースの自動ステップ検知
- 遷移率・離脱率の自動計算
- ビジュアルなファネルチャート表示
- ボトルネックステップの特定

---

**作成日**: 2025年11月2日
**Phase**: 5（ファネル解析機能実装）✅
**次のPhase**: Phase 6以降（コネクティッドワン統合、リアルタイムダッシュボード）
