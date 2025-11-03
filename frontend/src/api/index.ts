/**
 * API Module Export
 * APIモジュールの統一エクスポート
 */

// Client
export { ApiClient, initApiClient, getApiClient } from './client';

// Connected One API
export { fetchFunnels, fetchProjectSettings } from './connectedOne';
export type { ProjectSettings, FunnelsResponse } from './connectedOne';

// Webhook
export {
  sendWebhook,
  queueWebhook,
  flushWebhookQueue,
  registerOnlineListener,
} from './webhook';
export type {
  WebhookEventType,
  WebhookPayload,
  FunnelCompletedPayload,
  FunnelDroppedOffPayload,
  HighFrequencyClickPayload,
  LowScrollEngagementPayload,
} from './webhook';

// Queries (TanStack Query)
export {
  initQueryClient,
  getQueryClient,
  useFunnels,
  useProjectSettings,
  invalidateQueries,
  clearCache,
  queryKeys,
} from './queries';
export type { UseFunnelsOptions, UseProjectSettingsOptions } from './queries';

// Error Handler
export {
  ErrorCodes,
  ErrorMessages,
  logError,
  notifyError,
  isRetryableError,
  calculateBackoff,
  fetchWithRetry,
  handleLocalStorageError,
  handleApiError,
  registerGlobalErrorHandler,
} from './errorHandler';
