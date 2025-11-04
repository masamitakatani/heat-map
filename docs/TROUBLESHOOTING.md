# トラブルシューティングガイド

## Claude Code CLI タイムアウトエラー

### 症状
```
Error: Claude Code CLI execution timed out
```

### 根本原因

1. **タイムアウトによる強制終了**: Claude Code CLIプロセスが応答時間内に完了しなかった
2. **不明確なプロンプト**: 曖昧な指示（例：「次は」）により処理が開始できない
3. **タイムアウト設定不足**: デフォルトのタイムアウト設定がプロジェクト処理に対して短すぎる

### 解決策

#### 1. 明確で具体的なプロンプトを使用 ✅

**良い例:**
```
- "ヒートマップライブラリのビルドを実行してください"
- "Phase 11のドキュメント作成を開始してください"
- "E2Eテストの失敗したテストケースを修正してください"
```

**悪い例:**
```
- "次は"
- "開始して"
- "続けて"
```

#### 2. タイムアウト設定の確認

本プロジェクトの `.vscode/settings.json` には以下の設定が適用されています：

```json
{
  "gambit.claudeCode.timeout": 300000,  // 5分（ミリ秒）
  "gambit.claudeCode.retryOnTimeout": true
}
```

#### 3. VS Codeの再起動

タイムアウトが頻発する場合：

```bash
# VS Code を完全に終了
killall "Visual Studio Code"

# VS Code を再起動
```

#### 4. 不要なプロセスの確認

```bash
# Claudeプロセスを確認
ps aux | grep claude

# 必要に応じて終了（慎重に実行）
# kill [PID]
```

### 予防策

- **具体的な指示を常に使用する**
- **長時間の処理が予想される場合は事前に分割する**
- **定期的にVS Codeを再起動してリソースをクリーンアップする**

## その他の一般的な問題

### ビルドエラー

```bash
# 依存関係の再インストール
npm install

# キャッシュのクリア
npm cache clean --force
```

### データベース接続エラー

```bash
# バックエンドサーバーの再起動
cd backend
python3.11 -m uvicorn app.main:app --reload
```

### E2Eテスト失敗

```bash
# Playwrightブラウザの再インストール
npx playwright install

# テストレポートの確認
npx playwright show-report
```

---

**最終更新**: 2025-11-02
