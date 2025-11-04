/**
 * API Client for Backend Integration
 * バックエンドAPIとの連携クライアント
 */

import type { ApiConfig } from '../types';

/**
 * HTTPメソッド
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * APIレスポンス型
 */
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

/**
 * APIエラー型
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * APIクライアントクラス
 */
export class ApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl || '';
    this.apiKey = config.apiKey || '';
  }

  /**
   * 汎用HTTPリクエストメソッド
   */
  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    if (!this.baseUrl || !this.apiKey) {
      return {
        error: {
          code: 'MISSING_CONFIG',
          message: 'API設定が不完全です（baseUrlまたはapiKeyが未設定）',
        },
      };
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      // ステータスコードチェック
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = {
          code: errorData.error?.code || 'HTTP_ERROR',
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
   * PATCHリクエスト
   */
  public async patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, body);
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
    if (config.baseUrl !== undefined) {
      this.baseUrl = config.baseUrl;
    }
    if (config.apiKey !== undefined) {
      this.apiKey = config.apiKey;
    }
  }

  /**
   * 現在の設定を取得
   */
  public getConfig(): { baseUrl: string; apiKey: string } {
    return { baseUrl: this.baseUrl, apiKey: this.apiKey };
  }
}
