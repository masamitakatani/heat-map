# @heat-map/dashboard

ヒートマップ・ファネル解析の管理ダッシュボード

## 技術スタック

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Zustand（状態管理）
- React Router v7
- TanStack Query

## 開発

```bash
npm run dev
```

http://localhost:5173 でアクセス可能

## ビルド

```bash
npm run build
```

## ディレクトリ構造

```
src/
├── components/   # Reactコンポーネント
├── pages/        # ページコンポーネント
├── store/        # Zustand状態管理
├── types/        # TypeScript型定義
├── hooks/        # カスタムフック
└── utils/        # ユーティリティ関数
```

## Phase 4以降の実装予定

- ヒートマップ可視化コンポーネント
- ファネル設定画面
- データダッシュボード
- ルーティング設定
