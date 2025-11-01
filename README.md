# Heat Map & Funnel Analysis Tool

ヒートマップとファネル解析を統合したツール。コネクティッドワンの拡張機能として開発。

## 📦 プロジェクト構成

このプロジェクトはTurborepoを使用したモノレポ構成です。

```
heat-map/
├── packages/
│   ├── heatmap-lib/          # 埋め込み用JavaScriptライブラリ
│   │   ├── src/
│   │   │   ├── core/         # ヒートマップコアロジック
│   │   │   ├── overlay/      # LP上のUI（Phase 4で実装）
│   │   │   ├── storage/      # LocalStorage管理（Phase 4で実装）
│   │   │   ├── types/        # TypeScript型定義
│   │   │   └── utils/        # ユーティリティ関数
│   │   └── dist/             # ビルド成果物
│   │
│   └── dashboard/            # React管理画面
│       ├── src/
│       │   ├── components/   # Reactコンポーネント
│       │   ├── pages/        # ページコンポーネント（Phase 4で実装）
│       │   ├── store/        # Zustand状態管理
│       │   ├── types/        # TypeScript型定義
│       │   ├── hooks/        # カスタムフック（Phase 4で実装）
│       │   └── utils/        # ユーティリティ関数
│       └── dist/             # ビルド成果物
│
├── docs/                     # ドキュメント
├── package.json              # モノレポルート設定
└── turbo.json               # Turborepo設定
```

## 🚀 技術スタック

### heatmap-lib（埋め込みライブラリ）
- **言語**: TypeScript
- **ビルドツール**: Vite
- **目標サイズ**: 50KB以下（現在: 0.18KB gzip）
- **フォーマット**: ES modules + UMD

### dashboard（管理画面）
- **フレームワーク**: React 19 + TypeScript
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS v4
- **状態管理**: Zustand
- **ルーティング**: React Router v7
- **データ取得**: TanStack Query (React Query)

### モノレポ管理
- **ツール**: Turborepo v2.6

## 🛠️ セットアップ

### 必要要件
- Node.js >= 18.0.0
- npm >= 10.2.4

### インストール

```bash
# 依存関係のインストール
npm install

# すべてのパッケージをビルド
npm run build

# 開発サーバー起動
npm run dev
```

## 📝 NPMスクリプト

### ルート
```bash
npm run dev       # すべてのパッケージの開発サーバー起動
npm run build     # すべてのパッケージをビルド
npm run lint      # すべてのパッケージをLint
npm run clean     # すべてのビルド成果物を削除
```

### heatmap-lib
```bash
cd packages/heatmap-lib
npm run dev       # 開発サーバー起動
npm run build     # ライブラリをビルド（ES + UMD）
npm run preview   # ビルド結果をプレビュー
npm run clean     # ビルド成果物を削除
```

### dashboard
```bash
cd packages/dashboard
npm run dev       # 開発サーバー起動（デフォルト: http://localhost:5173）
npm run build     # アプリケーションをビルド
npm run preview   # ビルド結果をプレビュー
npm run lint      # ESLintでコードチェック
npm run clean     # ビルド成果物を削除
```

## 📊 ビルドサイズ

### heatmap-lib（現在）
- ES module: 0.18 KB (gzip: 0.14 KB)
- UMD: 0.38 KB (gzip: 0.27 KB)

**目標**: 50KB以下 ✅

### dashboard（現在）
- 総サイズ: 195.25 KB (gzip: 61.13 KB)

## 🎯 主要機能（要件定義より）

### Phase 3（完了）
- ✅ React/TypeScript/Viteプロジェクト初期化
- ✅ Turborepoモノレポ構成
- ✅ Tailwind CSS設定
- ✅ 必要なパッケージインストール（Zustand、React Router、TanStack Query）
- ✅ TypeScript strict mode設定
- ✅ ディレクトリ構造作成

### Phase 4以降（未実装）
- ヒートマップ機能（クリック、スクロール、マウスムーブメント）
- ファネル解析機能
- コネクティッドワン連携
- LocalStorageデータ管理

## 🔒 技術要件

### フロントエンド
- ✅ TypeScript strict mode
- ✅ 軽量化優先（目標: 50KB以下）
- ブラウザ対応: Chrome, Firefox, Safari, Edge（最新版）

### データ保存
- LocalStorage（5MB以内）
- JSON形式
- サーバー側DBは不使用

### パフォーマンス
- ページ読み込み速度への影響: 100ms以下（目標）
- 非同期データ記録
- 大量データのサンプリング

### セキュリティ
- 個人情報は記録しない（クリック座標のみ）
- CORS対応
- XSS対策

## 📦 デプロイ

### 維持費ゼロ設計
- 静的ホスティング（Netlify、Vercel等の無料枠）
- サーバーレス構成
- 月額課金サービス不使用

## 📖 ドキュメント

- [要件定義書](./docs/requirements/requirements.md)
- Phase 3 ガイド（作成予定）

## 🤝 開発フロー

1. Phase 3: フロントエンド基盤構築 ✅
2. Phase 4: ヒートマップ機能実装
3. Phase 5: ファネル解析機能実装
4. Phase 6: コネクティッドワン連携実装
5. Phase 7: テスト
6. Phase 8: ドキュメント作成
7. Phase 9: デプロイ準備

## 📄 ライセンス

未定

## 👤 作成者

AIエンジニア

## 🔗 参考ツール

- [Howuku](https://howuku.com/) - ヒートマップ、ファネル解析ツール
