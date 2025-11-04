# Googleタグマネージャー（GTM）統合ガイド

## 概要

このドキュメントでは、コネクティッドワン（Connected One）のページビルダーでJavaScript保存制限を回避し、ヒートマップライブラリを配信するためのGTM統合方法を説明します。

## なぜGTMを使うのか？

### 問題
コネクティッドワンのページビルダーは、セキュリティ上の理由からカスタムJavaScriptの保存を制限しています。

- ❌ ヘッダー・ボディ・フッターの`<script>`タグ → 保存不可
- ❌ HTMLブロック内の`<script>`タグ → 保存不可
- ✅ Googleタグ・Facebookピクセル → 保存可能（ホワイトリスト）

### 解決策
**Googleタグマネージャー（GTM）を経由してヒートマップライブラリを配信**

GTMはコネクティッドワンで公式サポートされているため、確実に保存できます。

---

## アーキテクチャ

```
┌─────────────────────────────────────────────┐
│  コネクティッドワンLP                          │
│  (例: https://gambit.icu/odayaka)           │
│                                             │
│  <script src="GTM-XXXXXXX"></script>        │
│  ↑ これは保存可能（ホワイトリスト登録済み）    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Googleタグマネージャー                        │
│  (GTMコンテナ)                               │
│                                             │
│  ┌───────────────────────────────┐          │
│  │ カスタムHTMLタグ              │          │
│  │ ・ヒートマップライブラリ読み込み │          │
│  │ ・初期化コード実行            │          │
│  │ ・トリガー: All Pages         │          │
│  └───────────────────────────────┘          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Vercel CDN                                 │
│  https://heat-cvnvx2ln9...vercel.app/      │
│  heatmap-analytics.umd.js (9.30KB gzip)    │
└─────────────────────────────────────────────┘
                    ↓
        ✅ エンドユーザーのデータ収集
```

---

## GTM統合手順

### ステップ1: GTMアカウントの作成

1. https://tagmanager.google.com/ にアクセス
2. Googleアカウントでログイン
3. 「アカウントを作成」をクリック
4. アカウント名を入力（例: `ヒートマップ解析ツール`）
5. コンテナ名を入力（例: `顧客LP用`）
6. ターゲットプラットフォーム: **ウェブ** を選択
7. 「作成」をクリック

### ステップ2: GTMコンテナIDの取得

作成完了後、以下のような画面が表示されます:

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
```

この`GTM-XXXXXXX`部分が**コンテナID**です。

### ステップ3: コネクティッドワンにGTMを設定

1. コネクティッドワンのページ編集画面を開く
2. 「設定」→「トラッキングコード」または「Googleタグ」欄を探す
3. 以下のコードを貼り付け:

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
```

**重要:** `GTM-XXXXXXX`を実際のコンテナIDに置き換えてください。

4. 「保存」をクリック → ✅ 保存できるはず

### ステップ4: GTMでヒートマップタグを設定

#### 4-1. カスタムHTMLタグを作成

1. GTM管理画面で「タグ」→「新規」をクリック
2. タグ名: `ヒートマップライブラリ`
3. タグの種類: **カスタムHTML**を選択
4. 以下のコードを貼り付け:

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

5. 「document.writeをサポートする」: **チェックなし**（推奨）

#### 4-2. トリガーを設定

1. トリガーの選択: **All Pages**（すべてのページ）
2. これにより、すべてのページでヒートマップが自動的に動作します

#### 4-3. 保存して公開

1. 「保存」をクリック
2. 右上の「公開」→「バージョン名」を入力（例: `初回公開 - ヒートマップ統合`）
3. 「公開」をクリック

---

## カスタマイズオプション

### プロジェクトIDをカスタマイズ

デフォルトでは、ドメイン名から自動生成されます:

```javascript
projectId: window.location.hostname.replace(/\./g, '-')
// 例: gambit.icu → gambit-icu
```

固定値にしたい場合:

```javascript
projectId: 'my-custom-project-id'
```

### デバッグモードをOFF

本番環境ではデバッグログを非表示にできます:

```javascript
debug: false,  // コンソールログを非表示
```

### APIキーをカスタマイズ

お客様ごとに異なるAPIキーを設定できます:

```javascript
apiKey: 'customer-abc-12345',
```

---

## 動作確認

### 1. ページを開く

コネクティッドワンのLP（例: https://gambit.icu/odayaka）を開きます。

### 2. ブラウザの開発者ツールを開く

- **Chrome/Edge**: `F12`キー または 右クリック→「検証」
- **Safari**: 環境設定→詳細→「メニューバーに開発メニューを表示」をON → 開発→「Webインスペクタを表示」

### 3. コンソールタブを確認

以下のログが表示されればOK:

```
✅ ヒートマップライブラリ読み込み完了
✅ ヒートマップ初期化完了
📊 Session ID: sess_xxxxxxxxxxxxx
👤 Anonymous ID: anon_xxxxxxxxxxxxx
```

### 4. クリックをテスト

ページ内のボタンやリンクをクリックして、コンソールに以下が表示されることを確認:

```
🖱️ クリックイベント記録: {x: 123, y: 456, ...}
```

### 5. LocalStorageを確認

開発者ツールの「Application」→「Local Storage」→ドメインを選択

以下のキーが存在すればデータが保存されています:

```
heatmap_analytics_session
heatmap_analytics_anonymous_id
heatmap_analytics_events
```

---

## トラブルシューティング

### GTMコンテナが読み込まれない

**症状:**
- ページのHTMLソースに`GTM-XXXXXXX`が見当たらない

**原因:**
- コネクティッドワンで保存できていない
- 設定欄が間違っている

**解決策:**
1. コネワンの「Googleタグ」欄に正しく貼り付けたか確認
2. ページを再保存・再公開してみる
3. それでもダメなら「ヘッダーマークアップ」欄に貼り付けてみる

### ヒートマップライブラリが読み込まれない

**症状:**
- コンソールに`❌ ヒートマップライブラリの読み込みに失敗しました`と表示

**原因:**
- Vercel CDNがダウンしている
- URLが間違っている

**解決策:**
1. 以下のURLをブラウザで直接開けるか確認:
   ```
   https://heat-cvnvx2ln9-masamitakatani-4585s-projects.vercel.app/heatmap-analytics.umd.js
   ```
2. 開けない場合はVercelのデプロイ状況を確認

### 初期化エラー

**症状:**
- コンソールに`❌ ヒートマップ初期化エラー`と表示

**原因:**
- ライブラリのバージョンが古い
- 初期化パラメータが間違っている

**解決策:**
1. GTMのカスタムHTMLタグのコードを最新版に更新
2. `apiKey`, `projectId`, `baseUrl`の値を確認

---

## 納品時のお客様向け説明

### お客様へのメール文例

```
件名: ヒートマップ解析ツール - セットアップ手順

お世話になっております。

ヒートマップ解析ツールをご利用いただくための設定手順をお送りいたします。

【所要時間】約10分

【必要なもの】
- Googleアカウント（無料）
- コネクティッドワンの管理画面アクセス権

【手順】
1. Googleタグマネージャー（GTM）アカウントを作成
   → https://tagmanager.google.com/

2. GTMコンテナIDをコピー（例: GTM-XXXXXXX）

3. コネクティッドワンの「Googleタグ」欄に以下を貼り付け:
   [GTMコードを記載]

4. 弊社がGTM側でヒートマップの設定を行います
   （お客様の作業は不要です）

5. 完了！LPに訪れたユーザーの行動が自動記録されます

詳細な手順書は添付ファイルをご確認ください。

ご不明点がございましたらお気軽にお問い合わせください。
```

---

## メリット・デメリット

### メリット

✅ **コネクティッドワンで確実に保存できる**
- GTMは公式サポート済みのホワイトリストツール

✅ **エンドユーザー全員のデータを収集**
- LPに訪れた全ユーザーを自動追跡

✅ **維持費ゼロ**
- GTMは完全無料
- Vercel CDNも無料枠内

✅ **規約違反リスクなし**
- 技術的回避策ではなく正攻法

✅ **柔軟なカスタマイズ**
- GTM側でコードを自由に変更可能
- お客様ごとに設定を変えられる

### デメリット

⚠ **初回セットアップが必要**
- GTMアカウント作成（5分）
- カスタムHTMLタグ設定（5分）

⚠ **お客様への説明コスト**
- 「GTMって何？」と聞かれる可能性
- マニュアルを丁寧に作る必要あり

⚠ **GTMの知識が必要**
- トラブル時にGTMの仕組みを理解している必要あり

---

## よくある質問（FAQ）

### Q1: GTMアカウントは誰が作るのですか？

**A:** お客様ごとに作成していただきます。理由は以下の通りです:

- GTMアカウントはGoogleアカウントに紐づく
- お客様が自分で管理できる方が長期的に安全
- 弊社が一括管理すると、アカウント数上限に引っかかる可能性

### Q2: GTMの設定は誰が行うのですか？

**A:** 以下の分担を推奨します:

- **お客様**: GTMアカウント作成、コンテナID取得、コネワンへの貼り付け
- **あなた（納品者）**: GTMでのカスタムHTMLタグ設定、動作確認

お客様にGTMへのアクセス権を付与してもらえば、あなたが代わりに設定できます。

### Q3: 複数のLPで使いまわせますか？

**A:** はい、可能です。

- GTMのトリガーを「All Pages」にすれば、同じドメイン配下のすべてのページで動作
- 異なるドメインの場合は、GTMコンテナIDをそれぞれのLPに貼り付ける必要あり

### Q4: データはどこに保存されますか？

**A:** 現在はブラウザのLocalStorage（クライアント側）に保存されます。

将来的にサーバー送信機能を追加する場合は、`baseUrl`のエンドポイントに送信されます。

### Q5: GTM以外の方法はありませんか？

**A:** 以下の代替案があります:

1. **リバースプロキシ（Cloudflare Workers）**: お客様の独自ドメインをプロキシ経由にする
   - ⚠ DNS設定が必要、規約リスクあり

2. **Chrome拡張機能**: ブラウザ拡張でスクリプト注入
   - ❌ エンドユーザーのデータが取れない（お客様自身のプレビューのみ）

GTMが最もバランスの取れた解決策です。

---

## 次のステップ

1. ✅ このドキュメントを読む
2. ⬜ GTMアカウントを作成してテスト
3. ⬜ コネワンのテストLPにGTMコンテナIDを貼り付け
4. ⬜ GTMでカスタムHTMLタグを設定
5. ⬜ 動作確認（コンソールログ、LocalStorageチェック）
6. ⬜ お客様向けマニュアルを作成
7. ⬜ 納品開始

---

**最終更新日**: 2025-11-03
**バージョン**: 1.0
**管理者**: gambit ai gen
