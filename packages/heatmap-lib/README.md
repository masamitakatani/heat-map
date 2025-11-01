# @heat-map/heatmap-lib

軽量なヒートマップ・ファネル解析ライブラリ（埋め込み用）

## 特徴

- 超軽量: 0.18KB (gzip)
- TypeScript完全対応
- ES modules + UMD両対応
- LocalStorageベースのデータ保存

## インストール（Phase 4以降）

```bash
npm install @heat-map/heatmap-lib
```

または CDN経由:

```html
<script src="https://cdn.example.com/heatmap-lib.umd.js"></script>
```

## 使用方法（Phase 4で実装予定）

```typescript
import { HeatmapTracker } from '@heat-map/heatmap-lib';

const tracker = new HeatmapTracker();
tracker.initialize();
```

## ビルド

```bash
npm run build
```

## ディレクトリ構造

```
src/
├── core/         # ヒートマップコアロジック
├── overlay/      # LP上のUI
├── storage/      # LocalStorage管理
├── types/        # TypeScript型定義
└── utils/        # ユーティリティ関数
```

## 目標サイズ

50KB以下（現在: 0.18KB）✅
