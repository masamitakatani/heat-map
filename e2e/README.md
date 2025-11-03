# E2Eテストガイド

このディレクトリには、ヒートマップ&ファネル解析ツールのE2Eテストが含まれています。

## テスト構成

```
e2e/
├── fixtures/           # テストデータ
│   └── test-data.ts   # 共通テストデータ
├── helpers/           # ヘルパー関数
│   └── test-helpers.ts # テスト用ユーティリティ
├── test-pages/        # テスト用HTMLページ
│   ├── index.html     # ランディングページ
│   ├── optin.html     # オプトインページ
│   └── thanks.html    # サンクスページ
├── heatmap-click.spec.ts      # クリックヒートマップのテスト
├── heatmap-scroll.spec.ts     # スクロールヒートマップのテスト
├── heatmap-mousemove.spec.ts  # マウスムーブメントのテスト
├── funnel-analysis.spec.ts    # ファネル解析のテスト
├── ui-overlay.spec.ts         # UI/UXのテスト
├── responsive.spec.ts         # レスポンシブデザインのテスト
└── performance.spec.ts        # パフォーマンステスト
```

## テストスクリプト

### 全テスト実行

```bash
npm run test:e2e
```

### UI付きで実行(デバッグ用)

```bash
npm run test:e2e:ui
```

### ブラウザを表示して実行

```bash
npm run test:e2e:headed
```

### Chromiumのみで実行

```bash
npm run test:e2e:chromium
```

### デバッグモード

```bash
npm run test:e2e:debug
```

### テストレポート表示

```bash
npm run test:e2e:report
```

## テストカテゴリ

### 1. ヒートマップ機能

#### クリックヒートマップ (`heatmap-click.spec.ts`)
- ライブラリの初期化確認
- クリックイベントの記録
- 複数クリックの処理
- クリック座標の精度
- LocalStorage容量制限のハンドリング
- ページリロード後のデータ保持

#### スクロールヒートマップ (`heatmap-scroll.spec.ts`)
- スクロールイベントの記録
- スクロール深度の計測
- 複数スクロールイベントの処理
- スクロール率の計算
- 上下スクロールの追跡

#### マウスムーブメント (`heatmap-mousemove.spec.ts`)
- マウス移動イベントの記録
- マウス座標の精度
- 連続移動の処理
- ホバー時間の計測
- サンプリングによるデータ削減

### 2. ファネル解析機能 (`funnel-analysis.spec.ts`)
- ファネル設定の保存
- ステップ遷移の記録
- 遷移率の計算
- 離脱率の計算
- クロスドメイン追跡
- ファネル統計情報の取得

### 3. UI/UX (`ui-overlay.spec.ts`)
- オーバーレイUIの表示
- ドラッグ&ドロップ機能
- 位置情報の保存
- ON/OFF切り替え
- 表示モード切り替え
- データリセット機能

### 4. レスポンシブデザイン (`responsive.spec.ts`)
- モバイル表示(375px)
- タブレット表示(768px)
- デスクトップ表示(1920px)
- 最小幅表示(320px)
- ビューポートリサイズ
- タッチデバイス対応

### 5. パフォーマンス (`performance.spec.ts`)
- スクリプト読み込み時間
- バンドルサイズ
- 大量イベント処理
- LocalStorage書き込み速度
- メモリ使用量
- サンプリング効果

## テスト実行環境

### 対応ブラウザ
- Chromium (Desktop Chrome)
- Firefox (Desktop Firefox)
- WebKit (Desktop Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

### 要件
- Node.js >= 18.0.0
- npm >= 10.0.0

## トラブルシューティング

### テストが失敗する場合

1. **LocalStorageエラー**
   - `about:blank`ではなく実際のページURLを使用していることを確認

2. **タイムアウトエラー**
   - `playwright.config.ts`のtimeout設定を確認
   - ネットワーク速度を確認

3. **スクリーンショット確認**
   - 失敗したテストのスクリーンショットは`test-results/`に保存されます

### デバッグ方法

```bash
# UIモードで特定のテストを実行
npx playwright test --ui --grep "クリックヒートマップ"

# デバッグモードで一時停止
npx playwright test --debug

# 特定のファイルのみ実行
npx playwright test e2e/heatmap-click.spec.ts
```

## CI/CD統合

GitHub Actionsでの実行例:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
```

## テスト作成ガイドライン

1. **各テストは独立している**
   - beforeEachでLocalStorageをクリア
   - 他のテストに依存しない

2. **待機時間の使用**
   - イベント処理完了まで適切に待機
   - `page.waitForTimeout()`を適切に使用

3. **アサーション**
   - データ構造を確認
   - タイムスタンプの妥当性をチェック
   - 境界値テストを含める

4. **エラーハンドリング**
   - null/undefinedチェック
   - 空配列の考慮
   - サンプリングによるデータ欠損を考慮

## 参考リンク

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [プロジェクト要件定義](../docs/requirements/requirements.md)
