# デプロイメントガイド

**プロジェクト**: ヒートマップ & ファネル解析ツール（JavaScriptライブラリ）
**作成日**: 2025年11月3日
**バージョン**: 2.0

---

## 目次

1. [アーキテクチャ概要](#1-アーキテクチャ概要)
2. [事前準備](#2-事前準備)
3. [Vercelデプロイ手順](#3-vercelデプロイ手順)
4. [動作確認](#4-動作確認)
5. [トラブルシューティング](#5-トラブルシューティング)
6. [CDN URLの使用方法](#6-cdn-urlの使用方法)

---

## 1. アーキテクチャ概要

このプロジェクトは**JavaScriptライブラリ**として提供され、完全にクライアントサイドで動作します。

```
┌─────────────────┐
│     Vercel      │  静的ホスティング（CDN配信）
│   (CDN配信)     │
└────────┬────────┘
         │
         │ HTTPS (CDN)
         │
         ▼
┌─────────────────┐
│  ユーザーのLP    │
│  (LP内埋め込み)  │  <script src="https://cdn.../heatmap-analytics.umd.js"></script>
│                 │
│  LocalStorage   │  ← データ保存（5MB制限）
└─────────────────┘
```

### 特徴
- **✅ 完全サーバーレス**: バックエンドAPIなし
- **✅ データベース不要**: LocalStorageのみ使用
- **✅ 維持費ゼロ**: Vercel無料枠で運用可能
- **✅ 軽量**: gzip圧縮後9.30KB（目標50KB以下を大幅達成）

---

## 2. 事前準備

### 2.1 必要なアカウント

- **Vercel** - https://vercel.com/signup
  - GitHubアカウントでサインアップ推奨
  - 無料枠で十分運用可能

### 2.2 必要なCLIツール（オプション）

Vercel CLIを使用する場合（推奨はGitHub連携）:

```bash
# Vercel CLI（オプション）
npm install -g vercel

# インストール確認
vercel --version
```

### 2.3 GitHubリポジトリの準備

```bash
# リモートリポジトリが設定されていることを確認
git remote -v

# 未設定の場合
git remote add origin git@github.com:your-username/heat-map.git

# 最新コミットをプッシュ
git push origin main
```

---

## 3. Vercelデプロイ手順

### 3.1 ビルド確認

デプロイ前に、ローカルでビルドが成功することを確認します:

```bash
cd frontend
npm run build
```

**期待される出力**:
```
✓ built in 9.83s
dist/heatmap-analytics.umd.js  29.26 kB │ gzip: 9.30 kB
dist/heatmap-analytics.es.js   68.32 kB │ gzip: 16.30 kB
```

### 3.2 Vercelプロジェクト作成（GitHub連携）

1. https://vercel.com/ にアクセスしてログイン
2. **Add New** → **Project** をクリック
3. GitHubリポジトリを選択: `your-username/heat-map`
4. **Import** をクリック

### 3.3 プロジェクト設定

**Framework Preset**: Other（または「Other」を選択）

**Build and Output Settings**:
```yaml
Build Command: cd frontend && npm install && npm run build
Output Directory: frontend/dist
Install Command: npm install
```

**Root Directory**: `.` (ルートディレクトリのまま)

### 3.4 環境変数の設定

このプロジェクトは完全クライアントサイドのため、**環境変数設定は不要**です。

コネクティッドワンAPIキーは、ライブラリを利用するユーザーが各自のLPで設定します:

```html
<script src="https://your-cdn-url.vercel.app/heatmap-analytics.umd.js"></script>
<script>
  HeatmapTool.init({
    apiKey: 'USER_PROVIDED_API_KEY',
    webhookUrl: 'USER_PROVIDED_WEBHOOK_URL'
  });
</script>
```

### 3.5 デプロイ実行

**Deploy** ボタンをクリック

Vercelが自動的に以下を実行します:
1. リポジトリのクローン
2. 依存関係のインストール
3. ビルド実行
4. CDNへのデプロイ

**デプロイ時間**: 約1-2分

### 3.6 デプロイURL確認

デプロイ完了後、以下のURLが発行されます:

- **本番URL**: `https://your-project.vercel.app`
- **ライブラリURL（UMD）**: `https://your-project.vercel.app/heatmap-analytics.umd.js`
- **ライブラリURL（ES）**: `https://your-project.vercel.app/heatmap-analytics.es.js`

---

## 4. 動作確認

### 4.1 デモページアクセス

```
https://your-project.vercel.app/
```

ブラウザでアクセスして、デモページが表示されることを確認します。

### 4.2 ライブラリURL確認

```bash
# UMD版の確認
curl -I https://your-project.vercel.app/heatmap-analytics.umd.js

# 期待されるレスポンス
HTTP/2 200
content-type: application/javascript; charset=utf-8
cache-control: public, max-age=31536000, immutable
content-encoding: gzip
```

### 4.3 ブラウザDevToolsで確認

1. デモページを開く
2. DevTools（F12）を開く
3. **Network** タブを確認
4. `heatmap-analytics.umd.js` のサイズを確認（gzip圧縮後9.30KB）

### 4.4 ライブラリ動作確認

デモページで以下を確認:
- ✅ オーバーレイUIが表示される
- ✅ クリックイベントが記録される
- ✅ ヒートマップが表示される
- ✅ LocalStorageにデータが保存される

---

## 5. トラブルシューティング

### 5.1 ビルドエラー

**症状**: Vercelデプロイ時に `Build failed` エラー

**解決策**:
```bash
# ローカルでビルドを確認
cd frontend
npm install
npm run build

# エラーが出た場合、TypeScriptエラーを修正
npm run build 2>&1 | tee build.log
```

### 5.2 404 Not Found

**症状**: `https://your-project.vercel.app/heatmap-analytics.umd.js` が404

**原因**: `frontend/dist/` にファイルが存在しない

**解決策**:
1. `vercel.json` の `outputDirectory` を確認
2. ローカルで `npm run build` を実行して `dist/` にファイルが生成されることを確認
3. 再デプロイ

### 5.3 CORS エラー

**症状**: 外部サイトから読み込むと CORS エラー

**解決策**: `vercel.json` に CORS ヘッダーが設定済み（自動対応）

```json
{
  "headers": [
    {
      "source": "/heatmap-analytics.(.*).js",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

### 5.4 スクリプトサイズが大きい

**症状**: gzip圧縮後のサイズが50KBを超える

**現在のサイズ**: 9.30KB ✅ （目標50KB以下を大幅達成）

**さらに最適化したい場合**:
```bash
# Vite設定でminifyを強化
# frontend/vite.config.ts
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true
    }
  }
}
```

---

## 6. CDN URLの使用方法

### 6.1 基本的な埋め込み（UMD版）

```html
<!DOCTYPE html>
<html>
<head>
  <title>マイLP</title>
</head>
<body>
  <h1>ランディングページ</h1>

  <!-- ヒートマップツールを埋め込み -->
  <script src="https://your-project.vercel.app/heatmap-analytics.umd.js"></script>
  <script>
    // 初期化
    HeatmapTool.init({
      apiKey: 'YOUR_CONNECTED_ONE_API_KEY',
      webhookUrl: 'https://api.connected-one.com/webhook',
      displayPosition: 'bottom-right'
    });
  </script>
</body>
</html>
```

### 6.2 ES Modulesでの使用

```javascript
import HeatmapTool from 'https://your-project.vercel.app/heatmap-analytics.es.js';

HeatmapTool.init({
  apiKey: 'YOUR_CONNECTED_ONE_API_KEY',
  webhookUrl: 'https://api.connected-one.com/webhook'
});
```

### 6.3 npm パッケージとして配布（将来対応）

```bash
# 将来的にnpmパッケージとして公開予定
npm install @heatmap-analytics/core

# 使用方法
import HeatmapTool from '@heatmap-analytics/core';
```

---

## 7. 継続的デプロイ（CI/CD）

Vercelは自動的にCI/CDを設定します:

- **mainブランチへのpush**: 本番環境へ自動デプロイ
- **プルリクエスト**: プレビュー環境を自動作成
- **コミット**: ビルド + テスト + デプロイ

### 7.1 デプロイフロー

```bash
# 開発
git checkout -b feature/new-feature
# コードを変更
git add .
git commit -m "feat: 新機能追加"
git push origin feature/new-feature

# プルリクエスト作成 → Vercelがプレビュー環境を自動生成

# マージ
git checkout main
git merge feature/new-feature
git push origin main

# → Vercelが本番環境へ自動デプロイ
```

---

## 8. 本番環境のURL

デプロイ完了後、以下のURLを `CLAUDE.md` と `SCOPE_PROGRESS.md` に記録してください:

```yaml
本番環境:
  CDN URL: https://your-project.vercel.app
  ライブラリURL（UMD）: https://your-project.vercel.app/heatmap-analytics.umd.js
  ライブラリURL（ES）: https://your-project.vercel.app/heatmap-analytics.es.js
  デモページ: https://your-project.vercel.app/
```

---

**最終更新日**: 2025年11月3日
**作成者**: gambit ai gen
**バージョン**: 2.0（JavaScriptライブラリ対応版）
