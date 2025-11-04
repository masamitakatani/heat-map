# ========================================
# Heatmap & Funnel Analytics - Backend Dockerfile
# Cloud Run デプロイ用
# ========================================

FROM python:3.11-slim

# 作業ディレクトリの設定
WORKDIR /app

# 環境変数の設定
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# システムパッケージの更新とPostgreSQL用ライブラリのインストール
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# 依存関係ファイルのコピー
COPY requirements.txt .

# Python依存関係のインストール
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードのコピー
COPY . .

# Cloud Runはポート番号を環境変数 $PORT で指定する
# デフォルトは8080
ENV PORT=8080
EXPOSE 8080

# ヘルスチェック用エンドポイント
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/health')"

# 非rootユーザーでの実行（セキュリティ強化）
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Uvicornサーバーの起動
# --host 0.0.0.0: すべてのネットワークインターフェースでリッスン
# --port $PORT: Cloud Runが指定するポート
# --workers 1: Cloud Runは自動スケーリングするため、ワーカーは1つでOK
CMD uvicorn app.main:app \
    --host 0.0.0.0 \
    --port ${PORT} \
    --workers 1 \
    --log-level info \
    --no-access-log
