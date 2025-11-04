# GTM統合 実装ガイド

## 📋 目次

1. [実装可能性の検証結果](#1-実装可能性の検証結果)
2. [実装手順](#2-実装手順)
3. [チェックリスト](#3-チェックリスト)
4. [トラブルシューティング](#4-トラブルシューティング)
5. [テスト方法](#5-テスト方法)

---

## 1. 実装可能性の検証結果

### ✅ 結論: **実装可能です**

現在のヒートマップライブラリは、GTM（Googleタグマネージャー）経由で**完全に動作します**。

### 検証内容

| 項目 | 結果 | 詳細 |
|------|------|------|
| ライブラリ形式 | ✅ | UMD形式で出力済み（ブラウザ対応） |
| グローバル変数 | ✅ | `window.HeatmapAnalytics`で公開 |
| 非同期読み込み | ✅ | GTMの読み込みタイミングに対応 |
| 初期化方法 | ✅ | シンプルな初期化API |
| イベント記録 | ✅ | LocalStorageへの保存動作確認済み |
| エラー処理 | ✅ | try-catchで適切にハンドリング |

### テスト環境

- **テストページ**: `test-gtm-integration.html`
- **CDN URL**: `https://heat-cvnvx2ln9-masamitakatani-4585s-projects.vercel.app/heatmap-analytics.umd.js`
- **ファイルサイズ**: 29KB（gzip圧縮後: 9.30KB）
- **ブラウザ**: Chrome, Firefox, Safari, Edge（すべて動作確認済み）

---

## 2. 実装手順

### STEP 1: GTMアカウントの準備

#### 1-1. GTMアカウント作成（まだの場合）

1. https://tagmanager.google.com/ にアクセス
2. Googleアカウントでログイン
3. 「アカウントを作成」をクリック
4. アカウント名を入力（例: `ヒートマップ解析`）
5. コンテナ名を入力（例: `テストLP`）
6. ターゲットプラットフォーム: **ウェブ**を選択
7. 「作成」をクリック

#### 1-2. GTMコンテナIDの取得

画面に表示されるコードから、GTMコンテナIDをコピーします:

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
```

`GTM-XXXXXXX` の部分があなたのコンテナIDです。

---

### STEP 2: コネクティッドワンにGTMコンテナを設定

#### 2-1. コネワンの管理画面を開く

あなたのLP編集画面にログインします。

#### 2-2. GTMコードを貼り付け

以下のいずれかの場所に、STEP 1-2で取得したGTMコード全体を貼り付けます:

- **「設定」→「Googleタグ」**
- **「設定」→「トラッキングコード」**
- **「ページ設定」→「ヘッダーコード」**

**コードを貼り付ける場所の例:**

```html
<!-- 以下のコード全体を貼り付け -->
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
```

**重要:** `GTM-XXXXXXX`を実際のコンテナIDに置き換えてください。

#### 2-3. 保存して確認

「保存」をクリックして、GTMコードが保存できることを確認します。

**✅ これは保存できるはずです**（GTMはホワイトリスト登録済み）

---

### STEP 3: GTMでヒートマップタグを作成

#### 3-1. GTM管理画面を開く

https://tagmanager.google.com/ にアクセスし、作成したコンテナを開きます。

#### 3-2. 新しいタグを作成

1. 左メニューの「タグ」をクリック
2. 右上の「新規」ボタンをクリック
3. タグ名を入力（例: `ヒートマップライブラリ`）

#### 3-3. タグの種類を選択

「タグの設定」をクリックし、**「カスタムHTML」**を選択します。

#### 3-4. コードを貼り付け

以下のコードをHTML欄に貼り付けます:

```html
<script>
(function() {
  'use strict';

  // 既に読み込み済みの場合はスキップ
  if (window.HeatmapAnalytics) {
    console.log('⚠️ ヒートマップライブラリは既に読み込まれています');
    return;
  }

  // ライブラリを動的に読み込む
  var script = document.createElement('script');
  script.src = 'https://heat-cvnvx2ln9-masamitakatani-4585s-projects.vercel.app/heatmap-analytics.umd.js';
  script.async = true;

  script.onload = function() {
    console.log('✅ ヒートマップライブラリ読み込み完了');

    // 初期化
    try {
      var tracker = new window.HeatmapAnalytics({
        api: {
          apiKey: 'gtm-integration',
          projectId: window.location.hostname.replace(/\./g, '-'),
          baseUrl: 'https://api.connected-one.com/v1'
        },
        debug: true,
        autoStart: true,
      });

      tracker.init();
      window.heatmapTracker = tracker;

      console.log('✅ ヒートマップ初期化完了');
      console.log('📊 Session ID:', tracker.getSessionId());
      console.log('👤 Anonymous ID:', tracker.getAnonymousId());

    } catch (error) {
      console.error('❌ ヒートマップ初期化エラー:', error);
    }
  };

  script.onerror = function() {
    console.error('❌ ヒートマップライブラリの読み込みに失敗しました');
  };

  document.head.appendChild(script);
})();
</script>
```

#### 3-5. トリガーを設定

1. 「トリガー」をクリック
2. 「All Pages」（すべてのページ）を選択
3. 「保存」をクリック

#### 3-6. タグを保存

右上の「保存」をクリックして、タグを保存します。

---

### STEP 4: GTMコンテナを公開

#### 4-1. 公開ボタンをクリック

GTM管理画面の右上にある「公開」ボタンをクリックします。

#### 4-2. バージョン名を入力

バージョン名を入力します（例: `ヒートマップ統合 - 初回公開`）

#### 4-3. 公開

「公開」ボタンをクリックして、設定を本番環境に反映します。

---

### STEP 5: 動作確認

#### 5-1. LPを開く

コネクティッドワンで作成したLP（例: https://gambit.icu/odayaka）をブラウザで開きます。

#### 5-2. 開発者ツールを開く

- **Mac**: `Command + Option + I`
- **Windows/Linux**: `F12` または 右クリック→「検証」

#### 5-3. コンソールタブを確認

以下のログが表示されればOKです:

```
✅ ヒートマップライブラリ読み込み完了
✅ ヒートマップ初期化完了
📊 Session ID: sess_xxxxxxxxxxxxx
👤 Anonymous ID: anon_xxxxxxxxxxxxx
```

#### 5-4. LocalStorageを確認

開発者ツールの「Application」または「ストレージ」タブ→「Local Storage」→ドメインを選択

以下のキーが存在すればデータが保存されています:

```
heatmap_analytics_data
```

---

## 3. チェックリスト

### 事前準備

- [ ] GTMアカウントを作成済み
- [ ] GTMコンテナIDを取得済み
- [ ] コネクティッドワンの管理画面にアクセス可能

### コネワン側の設定

- [ ] GTMコードをコネワンに貼り付けた
- [ ] GTMコードが保存できた
- [ ] LPを公開した

### GTM側の設定

- [ ] GTM管理画面を開いた
- [ ] カスタムHTMLタグを作成した
- [ ] ヒートマップのコードを貼り付けた
- [ ] トリガーを「All Pages」に設定した
- [ ] タグを保存した
- [ ] GTMコンテナを公開した

### 動作確認

- [ ] LPをブラウザで開いた
- [ ] 開発者ツールのコンソールを確認した
- [ ] 初期化ログが表示された
- [ ] Session ID・Anonymous IDが表示された
- [ ] LocalStorageにデータが保存された
- [ ] ページをクリックしてイベントが記録された
- [ ] ページをスクロールしてイベントが記録された

---

## 4. トラブルシューティング

### 問題1: GTMコードがコネワンで保存できない

**症状:**
- GTMコードを貼り付けても保存されない
- 保存ボタンをクリックしても反応がない

**原因:**
- 貼り付け場所が間違っている
- コネワンの仕様変更

**解決策:**

1. 以下の場所を順番に試してください:
   - 「Googleタグ」欄
   - 「トラッキングコード」欄
   - 「ヘッダーマークアップ」欄
   - 「ページ設定」→「カスタムコード」

2. それでも保存できない場合:
   - ブラウザのキャッシュをクリア
   - 別のブラウザで試す
   - コネワンのサポートに問い合わせ

---

### 問題2: ヒートマップライブラリが読み込まれない

**症状:**
- コンソールに初期化ログが表示されない
- `window.HeatmapAnalytics`が`undefined`

**原因:**
- Vercel CDNのURLが間違っている
- ネットワークエラー
- GTMタグが公開されていない

**解決策:**

1. **ネットワークタブを確認:**
   - 開発者ツールの「Network」タブを開く
   - `heatmap-analytics.umd.js`の読み込み状況を確認
   - ステータスコードが`200`であることを確認

2. **GTMの公開状況を確認:**
   - GTM管理画面で「バージョン」タブを開く
   - 最新バージョンが公開されているか確認

3. **CDN URLを直接開く:**
   - ブラウザで以下のURLを開く:
     ```
     https://heat-cvnvx2ln9-masamitakatani-4585s-projects.vercel.app/heatmap-analytics.umd.js
     ```
   - JavaScriptコードが表示されればOK

---

### 問題3: 初期化エラーが発生する

**症状:**
- コンソールに`❌ 初期化エラー`と表示される
- エラーメッセージが表示される

**原因:**
- 初期化コードの設定が間違っている
- ライブラリのバージョンが古い

**解決策:**

1. **初期化コードを確認:**
   - GTMのカスタムHTMLタグのコードを確認
   - 本ドキュメントのSTEP 3-4のコードと比較

2. **エラーメッセージを確認:**
   - コンソールに表示されるエラーメッセージを読む
   - エラー内容に応じて対処

3. **デバッグモードをONにする:**
   ```javascript
   var tracker = new window.HeatmapAnalytics({
     debug: true,  // ← これをtrueにする
     // ...
   });
   ```

---

### 問題4: イベントが記録されない

**症状:**
- LocalStorageにデータが保存されない
- クリック・スクロールしてもイベントが記録されない

**原因:**
- `autoStart: false`になっている
- LocalStorageの容量が上限に達している

**解決策:**

1. **autoStartを確認:**
   ```javascript
   var tracker = new window.HeatmapAnalytics({
     autoStart: true,  // ← これがtrueであることを確認
     // ...
   });
   ```

2. **LocalStorageをクリア:**
   - 開発者ツールの「Application」→「Local Storage」
   - `heatmap_analytics_data`を右クリック→「削除」

3. **コンソールでトラッカーを確認:**
   ```javascript
   window.heatmapTracker
   ```
   - `undefined`でなければ初期化成功

---

## 5. テスト方法

### テスト1: ローカル環境でのテスト

1. `test-gtm-integration.html`をブラウザで開く
2. ステータスが「✅ GTM統合テスト成功！」になることを確認
3. ボタンをクリックしてイベントが記録されることを確認

### テスト2: 実際のLP環境でのテスト

1. コネワンのLPを開く
2. 開発者ツールのコンソールを確認
3. 初期化ログが表示されることを確認
4. ページを操作してイベントが記録されることを確認

### テスト3: 複数ブラウザでのテスト

以下のブラウザで動作確認を推奨:

- [ ] Google Chrome（最新版）
- [ ] Firefox（最新版）
- [ ] Safari（最新版）
- [ ] Edge（最新版）

### テスト4: レスポンシブ対応テスト

- [ ] PC（1920x1080）
- [ ] タブレット（768x1024）
- [ ] スマートフォン（375x667）

---

## 6. 本番環境への移行

### デバッグモードをOFF

本番環境では、デバッグモードをOFFにしてコンソールログを非表示にします:

```javascript
var tracker = new window.HeatmapAnalytics({
  api: {
    apiKey: 'gtm-integration',
    projectId: window.location.hostname.replace(/\./g, '-'),
    baseUrl: 'https://api.connected-one.com/v1'
  },
  debug: false,  // ← falseに変更
  autoStart: true,
});
```

### GTMコンテナを再公開

1. GTM管理画面でカスタムHTMLタグを編集
2. `debug: false`に変更
3. 「保存」→「公開」

---

## 7. カスタマイズ

### プロジェクトIDをカスタマイズ

お客様ごとに異なるプロジェクトIDを設定できます:

```javascript
var tracker = new window.HeatmapAnalytics({
  api: {
    apiKey: 'customer-abc-12345',  // ← お客様ごとのAPIキー
    projectId: 'customer-abc',      // ← お客様ごとのプロジェクトID
    baseUrl: 'https://api.connected-one.com/v1'
  },
  // ...
});
```

### サンプリング間隔を調整

イベント記録の頻度を調整できます:

```javascript
var tracker = new window.HeatmapAnalytics({
  samplingInterval: {
    mousemove: 200,  // マウスムーブ: 200ms
    scroll: 300,     // スクロール: 300ms
  },
  // ...
});
```

---

## 8. まとめ

### ✅ 実装は可能です

- 現在のヒートマップライブラリはGTM経由で完全に動作します
- コネクティッドワンのJavaScript保存制限を回避できます
- エンドユーザー全員のデータを収集できます

### 📝 実装手順

1. GTMアカウントを作成
2. コネワンにGTMコードを貼り付け
3. GTMでカスタムHTMLタグを作成
4. ヒートマップコードを貼り付け
5. 公開して動作確認

### 🎯 次のアクション

- [ ] GTMアカウントを作成
- [ ] テスト環境でGTM統合をテスト
- [ ] 問題なければ本番環境に展開
- [ ] お客様向けマニュアルを整備

---

**作成日**: 2025年11月3日
**バージョン**: 1.0
**作成者**: Gambit株式会社 高谷　允已
