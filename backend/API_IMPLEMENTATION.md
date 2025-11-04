# バックエンドAPI実装完了

## 実装概要

API_SPEC.mdに基づいて、以下の機能を実装しました。

### 1. データベースモデル

#### 新規追加モデル
- **APIKey** - ユーザーごとのAPIキー管理
  - 自動生成された安全なAPIキー (`hm_` プレフィックス)
  - 有効期限管理
  - 最終使用日時の追跡

- **WebhookConfig** - Webhook設定管理
  - Webhook URL
  - HMAC-SHA256署名用のシークレット
  - イベントタイプフィルタリング
  - リトライ設定
  - 配信統計

#### 既存モデルとの関連
- **User** モデルに `api_keys` と `webhook_configs` のリレーションシップを追加

### 2. 認証ミドルウェア

- データベースベースのAPIキー検証に改善
- APIキーの有効性チェック（is_active、expires_at）
- 最終使用日時の自動更新
- リクエストステートに `user_id` と `api_key_id` を保存

### 3. サービス層

#### WebhookService
- HMAC-SHA256署名生成
- Webhook送信（リトライ機能付き）
- 署名検証
- 配信ログの記録

#### ConnectedOneService
- ファネル情報取得 (`GET /v1/funnels/{project_id}`)
- プロジェクト設定取得 (`GET /v1/projects/{project_id}/settings`)
- イベント送信 (`POST /v1/webhooks/heatmap-events`)
- APIキー検証

### 4. APIエンドポイント

#### APIキー管理 (`/api/v1/api-keys`)
- `POST /api-keys` - 新しいAPIキーを作成（キーは一度だけ表示）
- `GET /api-keys` - APIキー一覧取得
- `GET /api-keys/{api_key_id}` - 特定のAPIキー詳細取得
- `PATCH /api-keys/{api_key_id}` - APIキー更新
- `DELETE /api-keys/{api_key_id}` - APIキー削除

#### Webhook設定管理 (`/api/v1/webhook-configs`)
- `POST /webhook-configs` - 新しいWebhook設定を作成（シークレットは一度だけ表示）
- `GET /webhook-configs` - Webhook設定一覧取得
- `GET /webhook-configs/{webhook_id}` - 特定のWebhook設定詳細取得
- `PATCH /webhook-configs/{webhook_id}` - Webhook設定更新
- `DELETE /webhook-configs/{webhook_id}` - Webhook設定削除
- `POST /webhook-configs/{webhook_id}/regenerate-secret` - シークレット再生成
- `POST /webhook-configs/{webhook_id}/test` - Webhookテスト送信

#### Connected Oneプロキシ (`/api/v1/connected-one`)
- `GET /connected-one/funnels/{project_id}` - ファネル情報取得
- `GET /connected-one/projects/{project_id}/settings` - プロジェクト設定取得
- `POST /connected-one/webhooks/heatmap-events` - イベント送信

### 5. データベースマイグレーション

- `alembic/versions/001_initial_schema.py` - 初期スキーマ作成
  - 全テーブルの作成（users, api_keys, webhook_configs等）

## セキュリティ機能

### APIキー
- 48バイトのランダムトークン（`secrets.token_urlsafe`使用）
- プレフィックス `hm_` で識別
- データベースに暗号化せずに保存（Bearer tokenとして使用）

### Webhook署名
- HMAC-SHA256署名
- シークレットキーは48バイトのランダムトークン
- ペイロードのJSON文字列を正規化して署名

## 使用方法

### 1. 環境変数設定

`.env` ファイルに以下を追加：

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/heatmap_db

# Connected One Integration
CONNECTED_ONE_API_URL=https://api.connected-one.com
CONNECTED_ONE_API_KEY=your-connected-one-api-key
CONNECTED_ONE_WEBHOOK_URL=https://api.connected-one.com/v1/webhooks/heatmap-events
```

### 2. データベースマイグレーション実行

```bash
cd backend
alembic upgrade head
```

### 3. サーバー起動

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. API使用例

#### APIキー作成

```bash
# 最初のAPIキーを作成するには、既存のAPIキーが必要です
# 開発環境では、直接データベースに挿入するか、認証を一時的に無効化してください

curl -X POST http://localhost:8000/api/v1/api-keys \
  -H "Authorization: Bearer YOUR_EXISTING_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production API Key",
    "expires_at": null
  }'

# レスポンス（keyは一度だけ表示されます）
{
  "id": "uuid-here",
  "key": "hm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "name": "Production API Key",
  "user_id": "user-uuid",
  "is_active": true,
  "last_used_at": null,
  "expires_at": null,
  "created_at": "2025-11-02T10:00:00Z",
  "updated_at": "2025-11-02T10:00:00Z"
}
```

#### Webhook設定作成

```bash
curl -X POST http://localhost:8000/api/v1/webhook-configs \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Webhook",
    "url": "https://your-domain.com/webhook",
    "event_types": ["funnel.completed", "funnel.dropped_off"],
    "max_retries": 3,
    "retry_delay_seconds": 60
  }'

# レスポンス（secretは一度だけ表示されます）
{
  "id": "uuid-here",
  "secret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "name": "My Webhook",
  "url": "https://your-domain.com/webhook",
  "user_id": "user-uuid",
  "is_active": true,
  "event_types": ["funnel.completed", "funnel.dropped_off"],
  "max_retries": 3,
  "retry_delay_seconds": 60,
  ...
}
```

#### Connected One API経由でファネル取得

```bash
curl -X GET "http://localhost:8000/api/v1/connected-one/funnels/proj_abc123" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "X-Connected-One-API-Key: YOUR_CONNECTED_ONE_API_KEY"
```

## API仕様書との対応

| API_SPEC.md | 実装状況 | エンドポイント |
|-------------|---------|--------------|
| ファネル情報取得 | ✅ | `GET /api/v1/connected-one/funnels/{project_id}` |
| プロジェクト設定取得 | ✅ | `GET /api/v1/connected-one/projects/{project_id}/settings` |
| Webhook送信 | ✅ | `POST /api/v1/connected-one/webhooks/heatmap-events` |
| APIキー管理 | ✅ | `/api/v1/api-keys/*` |
| Webhook設定管理 | ✅ | `/api/v1/webhook-configs/*` |

## OpenAPI仕様

サーバー起動後、以下のURLでAPI仕様を確認できます：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

## 次のステップ（Phase 8: API統合）

1. フロントエンドからのAPI呼び出し実装
2. イベント記録時の自動Webhook送信
3. エラーハンドリングとリトライロジック
4. パフォーマンス最適化

## トラブルシューティング

### 認証エラー

最初のAPIキーを作成するには、以下の方法があります：

1. **開発環境**: 認証ミドルウェアを一時的に無効化
2. **データベース直接挿入**:

```sql
-- SQLでAPIキーを直接挿入
INSERT INTO api_keys (id, key, name, user_id, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'hm_your_initial_api_key_here',
  'Initial API Key',
  (SELECT id FROM users LIMIT 1),
  true,
  NOW(),
  NOW()
);
```

3. **初期化スクリプト**: `scripts/create_initial_api_key.py` を作成（推奨）

## 実装ファイル一覧

### モデル
- `app/models/api_key.py` - APIキーモデル
- `app/models/webhook_config.py` - Webhook設定モデル
- `app/models/user.py` - Userモデル（更新）

### サービス
- `app/services/webhook_service.py` - Webhook送信サービス
- `app/services/connected_one_service.py` - Connected One連携サービス

### ルーター
- `app/routes/api_keys.py` - APIキー管理エンドポイント
- `app/routes/webhook_configs.py` - Webhook設定管理エンドポイント
- `app/routes/connected_one.py` - Connected Oneプロキシエンドポイント

### スキーマ
- `app/schemas/api_key.py` - APIキースキーマ
- `app/schemas/webhook_config.py` - Webhook設定スキーマ
- `app/schemas/connected_one.py` - Connected Oneスキーマ

### ミドルウェア
- `app/middlewares/auth.py` - 認証ミドルウェア（更新）

### マイグレーション
- `alembic/versions/001_initial_schema.py` - 初期スキーマ

### 設定
- `app/config.py` - 設定（更新）
- `app/main.py` - メインアプリケーション（更新）
