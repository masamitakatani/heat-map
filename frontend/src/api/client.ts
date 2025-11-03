/**
 * API Client for Connected One Integration
 * コネクティッドワンAPIとの連携クライアント
 */

import type { ApiConfig, ApiResponse, ApiError } from '../types';

/**
 * HTTPメソッド
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * APIクライアントクラス
 */
export class ApiClient {
  private config: Required<ApiConfig>;

  constructor(config: ApiConfig) {
    this.config = {
      apiKey: config.apiKey || '',
      baseUrl: config.baseUrl || 'https://api.connected-one.com/v1',
      projectId: config.projectId || '',
    };
  }

  /**
   * 汎用HTTPリクエストメソッド
   */
  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      // ステータスコードチェック
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = {
          code: errorData.error?.code || 'UNKNOWN_ERROR',
          message: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          details: errorData.error?.details,
        };
        return { error };
      }

      // 成功レスポンス
      const data = await response.json();
      return { data };
    } catch (error) {
      // ネットワークエラー等
      const apiError: ApiError = {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'ネットワークエラーが発生しました',
      };
      return { error: apiError };
    }
  }

  /**
   * GETリクエスト
   */
  public async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint);
  }

  /**
   * POSTリクエスト
   */
  public async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body);
  }

  /**
   * PUTリクエスト
   */
  public async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, body);
  }

  /**
   * DELETEリクエスト
   */
  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }

  /**
   * 設定を更新
   */
  public updateConfig(config: Partial<ApiConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * 現在の設定を取得
   */
  public getConfig(): ApiConfig {
    return { ...this.config };
  }
}

/**
 * デフォルトAPIクライアントインスタンス
 */
let defaultClient: ApiClient | null = null;

/**
 * デフォルトクライアントを初期化
 */
export function initApiClient(config: ApiConfig): ApiClient {
  defaultClient = new ApiClient(config);
  return defaultClient;
}

/**
 * デフォルトクライアントを取得
 */
export function getApiClient(): ApiClient {
  if (!defaultClient) {
    throw new Error('APIクライアントが初期化されていません。initApiClient()を先に呼び出してください。');
  }
  return defaultClient;
}
