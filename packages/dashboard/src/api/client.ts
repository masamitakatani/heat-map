/**
 * API Client
 * バックエンドAPIとの通信を行う汎用クライアント
 */

interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      // options.headersをマージ
      if (options.headers) {
        const optHeaders = options.headers as Record<string, string>;
        Object.assign(headers, optHeaders);
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error: errorData.detail || `HTTP Error: ${response.status}`,
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('[ApiClient] Request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public async post<T>(
    endpoint: string,
    body: unknown
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async put<T>(
    endpoint: string,
    body: unknown
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// シングルトンインスタンス
let apiClient: ApiClient | null = null;

/**
 * APIクライアントを初期化
 */
export function initializeApiClient(config: ApiConfig): void {
  apiClient = new ApiClient(config);
}

/**
 * APIクライアントを取得
 */
export function getApiClient(): ApiClient {
  if (!apiClient) {
    // デフォルト設定で初期化（環境変数から取得）
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    const apiKey = import.meta.env.VITE_API_KEY;

    apiClient = new ApiClient({ baseUrl, apiKey });
  }
  return apiClient;
}
