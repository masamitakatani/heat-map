# Railway デプロイガイド

## 概要

このガイドでは、ヒートマップ解析ツールのバックエンドAPIをRailwayにデプロイする手順を説明します。

## 前提条件

- Railwayアカウント（https://railway.app でサインアップ）
- GitHubアカウント（リポジトリ連携用）
- PostgreSQLデータベース（Railway上で作成可能）

## デプロイ手順

### 1. Railwayプロジェクト作成

1. Railway（https://railway.app）にログイン
2. 「New Project」をクリック
3. 「Deploy from GitHub repo」を選択
4. 本リポジトリを選択（または「Deploy from repo」→ GitHubリポジトリURLを入力）

### 2. PostgreSQLデータベース追加

1. プロジェクトダッシュボードで「New」→「Database」→「Add PostgreSQL」をクリック
2. 自動的にPostgreSQLインスタンスが作成される
3. データベースの接続情報が環境変数として自動設定される（`DATABASE_URL`）

### 3. 環境変数の設定

Railwayプロジェクトの「Variables」タブで以下の環境変数を設定:

```bash
# データベース接続（Railway PostgreSQLを追加すると自動設定される）
DATABASE_URL=postgresql+asyncpg://user:password@host:port/database

# アプリケーション設定
PROJECT_NAME=Heatmap Analytics API
VERSION=1.0.0
DEBUG=false
LOG_LEVEL=INFO

# セキュリティ
SECRET_KEY=<ランダムな文字列（64文字以上推奨）>
JWT_SECRET_KEY=<ランダムな文字列（64文字以上推奨）>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS設定（フロントエンドのドメインを指定）
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com

# API設定
API_V1_PREFIX=/api/v1
```

#### SECRET_KEYの生成方法

```bash
# OpenSSLを使用
openssl rand -hex 64

# またはPythonを使用
python -c "import secrets; print(secrets.token_hex(64))"
```

### 4. ビルド設定

Railway上で自動的に`backend/Dockerfile`が検出されます。

**重要**: プロジェクトルートではなく、`backend`ディレクトリをルートとして設定する必要があります。

1. プロジェクト設定（Settings）を開く
2. 「Source」セクションで「Root Directory」を`backend`に設定
3. 「Builder」が「Dockerfile」になっていることを確認

### 5. デプロイの実行

1. 環境変数とビルド設定が完了したら、自動的にデプロイが開始される
2. デプロイログを確認して、エラーがないことを確認
3. デプロイ完了後、Railway が生成する公開URLをメモする
   - 例: `https://your-app-name.railway.app`

### 6. データベースマイグレーションの実行

初回デプロイ後、データベーステーブルを作成する必要があります。

#### 方法1: Railway CLI経由（推奨）

```bash
# Railway CLIのインストール
npm install -g @railway/cli

# Railwayにログイン
railway login

# プロジェクトにリンク
railway link

# マイグレーション実行
railway run alembic upgrade head
```

#### 方法2: 手動でPostgreSQLに接続

```bash
# DATABASE_URLを使用してローカルから接続
DATABASE_URL="<RailwayのDATABASE_URL>" alembic upgrade head
```

#### 方法3: Railway Dashboard経由

1. Railwayダッシュボードでバックエンドサービスを選択
2. 「Settings」→「Deploy」→「Custom Start Command」
3. 一時的に以下のコマンドを設定してデプロイ:
   ```bash
   alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1
   ```
4. デプロイが成功したら、元のコマンドに戻す

### 7. ヘルスチェック確認

デプロイ完了後、APIが正常に動作していることを確認:

```bash
curl https://your-app-name.railway.app/health
```

**期待されるレスポンス:**
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

### 8. API仕様の確認

Swagger UIでAPI仕様を確認:

```
https://your-app-name.railway.app/docs
```

## トラブルシューティング

### ビルドエラー

**問題**: `ERROR: failed to solve: failed to read dockerfile`

**解決策**:
- Railway設定で「Root Directory」が`backend`になっているか確認
- Dockerfileが`backend/Dockerfile`に存在するか確認

### データベース接続エラー

**問題**: `sqlalchemy.exc.OperationalError: connection refused`

**解決策**:
- `DATABASE_URL`環境変数が正しく設定されているか確認
- PostgreSQLサービスが起動しているか確認
- 接続文字列が`postgresql+asyncpg://`で始まっているか確認（`postgresql://`ではなく）

### CORS エラー

**問題**: フロントエンドからのリクエストが`403 Forbidden`になる

**解決策**:
- `ALLOWED_ORIGINS`環境変数にフロントエンドのドメインが含まれているか確認
- プロトコル（`https://`）も含めて完全なURLを指定

### マイグレーションエラー

**問題**: `alembic.util.exc.CommandError: Target database is not up to date`

**解決策**:
```bash
# マイグレーション履歴の確認
railway run alembic current

# 強制的に最新状態に移行
railway run alembic upgrade head
```

## カスタムドメインの設定（オプション）

1. Railwayダッシュボードで「Settings」→「Domains」を開く
2. 「Custom Domain」をクリック
3. 自分のドメインを入力（例: `api.your-domain.com`）
4. DNSプロバイダーでCNAMEレコードを追加:
   ```
   api.your-domain.com CNAME your-app-name.railway.app
   ```
5. SSL証明書が自動的に発行される（Let's Encrypt）

## 環境変数の更新

アプリケーション設定を変更する場合:

1. Railwayダッシュボードで「Variables」タブを開く
2. 環境変数を編集
3. 保存すると自動的に再デプロイされる

## モニタリングとログ

### ログの確認

1. Railwayダッシュボードでサービスを選択
2. 「Logs」タブでリアルタイムログを確認
3. フィルタリングやエクスポートも可能

### メトリクスの確認

1. 「Metrics」タブでCPU・メモリ使用率を確認
2. レスポンスタイムやリクエスト数も表示される

## コスト管理

Railwayの無料枠:
- 500時間/月の実行時間
- 100GBのアウトバウンド帯域幅
- PostgreSQL: 1GBストレージ

超過した場合は従量課金となります。詳細: https://railway.app/pricing

## セキュリティ推奨事項

1. **環境変数を安全に管理**
   - `SECRET_KEY`と`JWT_SECRET_KEY`は強力なランダム文字列を使用
   - GitHub等にコミットしない

2. **CORS設定を厳格に**
   - 本番環境では`*`を使用しない
   - 信頼できるドメインのみ許可

3. **HTTPS強制**
   - Railwayは自動的にHTTPSを使用
   - カスタムドメインでもSSL証明書が自動発行される

4. **レート制限**
   - アプリケーションにレート制限ミドルウェアが実装されている
   - 必要に応じて設定を調整

## バックアップ

PostgreSQLデータベースのバックアップ:

```bash
# Railway CLIでバックアップ
railway run pg_dump -Fc > backup.dump

# リストア
railway run pg_restore -d $DATABASE_URL backup.dump
```

## デプロイの自動化

GitHubにプッシュすると自動的にデプロイされます:

1. `main`ブランチにプッシュ
2. Railwayが自動的にビルド・デプロイを開始
3. デプロイ完了後、新しいバージョンが公開される

## 次のステップ

- [ ] フロントエンドライブラリのAPI URLを更新
- [ ] 管理画面のAPI URLを更新
- [ ] E2Eテストで本番APIの動作を確認
- [ ] カスタムドメインの設定（必要に応じて）
- [ ] モニタリング設定
- [ ] バックアップスケジュールの設定

## サポート

問題が発生した場合:
- Railway公式ドキュメント: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: 本リポジトリのIssuesページ
