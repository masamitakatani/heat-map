# バックエンドセットアップガイド

## 📋 前提条件

- Python 3.11以上
- PostgreSQL 14以上
- pip または poetry

## 🚀 セットアップ手順

### 1. 仮想環境の作成と有効化

```bash
cd backend
python -m venv venv

# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 2. 依存関係のインストール

```bash
pip install -r requirements.txt
```

または Poetry を使用する場合:

```bash
poetry install
```

### 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルを編集して、以下の値を設定してください:

```bash
# データベース接続
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/heatmap_db

# APIキー（必ず変更してください）
API_KEY=your-secret-api-key-here

# CORS設定
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 4. PostgreSQLデータベースの作成

```bash
# PostgreSQLにログイン
psql -U postgres

# データベース作成
CREATE DATABASE heatmap_db;
CREATE USER heatmap_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE heatmap_db TO heatmap_user;

# 終了
\q
```

### 5. データベースマイグレーション

```bash
# 初回マイグレーション作成
alembic revision --autogenerate -m "Initial migration"

# マイグレーション適用
alembic upgrade head
```

### 6. 開発サーバーの起動

```bash
# 方法1: uvicornで直接起動
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 方法2: Pythonモジュールとして実行
python -m app.main

# 方法3: main.pyを直接実行
python app/main.py
```

サーバーが起動すると、以下のURLでアクセスできます:

- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🧪 テスト

### ヘルスチェック

```bash
curl http://localhost:8000/health
```

レスポンス:
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

### APIキー認証のテスト

```bash
# APIキーなし（401エラー）
curl http://localhost:8000/api/v1/funnels

# APIキー付き（成功）
curl -H "Authorization: Bearer your-secret-api-key-here" \
     http://localhost:8000/api/v1/funnels
```

## 📊 データベース管理

### マイグレーション履歴の確認

```bash
alembic history
```

### 現在のバージョン確認

```bash
alembic current
```

### マイグレーションのロールバック

```bash
# 1つ前のバージョンに戻す
alembic downgrade -1

# 特定のリビジョンに戻す
alembic downgrade <revision_id>
```

### 新しいマイグレーション作成

```bash
# モデル変更後、自動でマイグレーション作成
alembic revision --autogenerate -m "Add new column to users table"

# 手動でマイグレーション作成
alembic revision -m "Custom migration"
```

## 🔧 開発ツール

### コードフォーマット

```bash
black app/
```

### 型チェック

```bash
mypy app/
```

### リント

```bash
flake8 app/
```

### テスト実行

```bash
# 全テスト実行
pytest

# カバレッジ付き
pytest --cov=app --cov-report=html

# 特定のテストファイル
pytest tests/test_users.py

# 特定のテスト関数
pytest tests/test_users.py::test_identify_user
```

## 📦 本番環境デプロイ

### 環境変数の設定

本番環境では、以下の環境変数を必ず設定してください:

```bash
DEBUG=False
LOG_LEVEL=WARNING
API_KEY=<強力なランダム文字列>
DATABASE_URL=<本番データベースURL>
ALLOWED_ORIGINS=https://yourdomain.com
```

### Dockerでの起動（推奨）

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t heatmap-backend .
docker run -p 8000:8000 --env-file .env heatmap-backend
```

### Gunicorn + Uvicorn Workers

```bash
pip install gunicorn

gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

## 🐛 トラブルシューティング

### データベース接続エラー

```
sqlalchemy.exc.OperationalError: could not connect to server
```

解決策:
1. PostgreSQLが起動しているか確認
2. DATABASE_URLが正しいか確認
3. データベースユーザーの権限を確認

### マイグレーションエラー

```
alembic.util.exc.CommandError: Target database is not up to date
```

解決策:
```bash
alembic stamp head
alembic upgrade head
```

### ImportError

```
ModuleNotFoundError: No module named 'app'
```

解決策:
1. 仮想環境が有効化されているか確認
2. 依存関係が全てインストールされているか確認
3. カレントディレクトリが `backend/` であることを確認

## 📝 API仕様

詳細なAPI仕様は以下を参照してください:

- Swagger UI: http://localhost:8000/docs
- API仕様書: `../docs/API_SPEC.md`
- データベーススキーマ: `../docs/DATABASE_SCHEMA.md`

## 🔐 セキュリティ

### APIキーの生成

```python
import secrets
print(secrets.token_urlsafe(32))
```

### HTTPS必須

本番環境では必ずHTTPSを使用してください。

### レート制限

- イベント送信: 100リクエスト/分
- ヒートマップ取得: 60リクエスト/分
- ファネル管理: 30リクエスト/分
- その他: 120リクエスト/分

## 📚 関連ドキュメント

- [README.md](./README.md) - プロジェクト概要
- [API_SPEC.md](../docs/API_SPEC.md) - API仕様
- [DATABASE_SCHEMA.md](../docs/DATABASE_SCHEMA.md) - データベーススキーマ
