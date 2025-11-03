/**
 * API Error Handling
 * エラーハンドリング・リトライロジック
 */

import type { ApiError } from '../types';

/**
 * エラーコード定義
 */
export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  SECURITY_ERROR: 'SECURITY_ERROR',
  INVALID_CONFIG: 'INVALID_CONFIG',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * エラーメッセージ定義
 */
export const ErrorMessages: Record<string, string> = {
  [ErrorCodes.NETWORK_ERROR]: 'ネットワークエラーが発生しました。接続を確認してください。',
  [ErrorCodes.UNAUTHORIZED]: 'APIキーが無効です。設定を確認してください。',
  [ErrorCodes.QUOTA_EXCEEDED]: 'LocalStorageの容量が不足しています。古いデータを削除してください。',
  [ErrorCodes.SECURITY_ERROR]: 'プライベートモードではLocalStorageを使用できません。',
  [ErrorCodes.INVALID_CONFIG]: '設定が不正です。初期化パラメータを確認してください。',
  [ErrorCodes.UNKNOWN_ERROR]: '予期しないエラーが発生しました。',
};

/**
 * エラーログを出力
 */
export function logError(error: ApiError, context?: string): void {
  const prefix = context ? `[${context}]` : '[Error]';
  console.error(`${prefix} ${error.code}: ${error.message}`, error.details);
}

/**
 * ユーザーにエラーを通知（トースト風）
 */
export function notifyError(error: ApiError): void {
  const message = ErrorMessages[error.code] || error.message;

  // シンプルなアラート（Phase 7でオーバーレイUIに統合予定）
  if (typeof window !== 'undefined') {
    const shouldRetry = confirm(`エラー: ${message}\n\n再試行しますか？`);
    if (shouldRetry) {
      // リトライロジックは呼び出し側で処理
      console.log('[ErrorHandler] ユーザーが再試行を選択しました');
    }
  }
}

/**
 * リトライ可能なエラーかどうか判定
 */
export function isRetryableError(error: ApiError): boolean {
  const retryableCodes = [
    ErrorCodes.NETWORK_ERROR,
    'TIMEOUT_ERROR',
    'SERVICE_UNAVAILABLE',
  ];
  return retryableCodes.includes(error.code);
}

/**
 * 指数バックオフ計算
 */
export function calculateBackoff(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // 最大30秒
}

/**
 * リトライ付きfetch
 */
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, onRetry } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 最後の試行なら例外を投げる
      if (attempt === maxRetries) {
        break;
      }

      // リトライコールバック
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // バックオフ
      const delay = calculateBackoff(attempt, baseDelay);
      console.warn(`[Retry] ${attempt + 1}回目のリトライを${delay}ms後に実行します...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // すべてのリトライが失敗
  throw lastError;
}

/**
 * LocalStorageエラーハンドリング
 */
export function handleLocalStorageError(error: unknown, context: string): void {
  if (error instanceof DOMException) {
    if (error.name === 'QuotaExceededError') {
      const apiError: ApiError = {
        code: ErrorCodes.QUOTA_EXCEEDED,
        message: ErrorMessages[ErrorCodes.QUOTA_EXCEEDED],
      };
      logError(apiError, context);
      notifyError(apiError);
    } else if (error.name === 'SecurityError') {
      const apiError: ApiError = {
        code: ErrorCodes.SECURITY_ERROR,
        message: ErrorMessages[ErrorCodes.SECURITY_ERROR],
      };
      logError(apiError, context);
    }
  } else {
    const apiError: ApiError = {
      code: ErrorCodes.UNKNOWN_ERROR,
      message: error instanceof Error ? error.message : String(error),
    };
    logError(apiError, context);
  }
}

/**
 * API通信エラーハンドリング
 */
export function handleApiError(error: ApiError, context: string): void {
  logError(error, context);

  // 認証エラーの場合は即座に通知
  if (error.code === ErrorCodes.UNAUTHORIZED) {
    notifyError(error);
  }

  // リトライ可能なエラーの場合は自動リトライ（呼び出し側で処理）
  if (isRetryableError(error)) {
    console.log(`[ErrorHandler] リトライ可能なエラーです: ${error.code}`);
  }
}

/**
 * グローバルエラーハンドラーを登録
 */
export function registerGlobalErrorHandler(): void {
  if (typeof window === 'undefined') return;

  // 未処理の例外をキャッチ
  window.addEventListener('error', (event) => {
    console.error('[GlobalErrorHandler] 未処理のエラー:', event.error);
  });

  // 未処理のPromise拒否をキャッチ
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[GlobalErrorHandler] 未処理のPromise拒否:', event.reason);
  });
}
