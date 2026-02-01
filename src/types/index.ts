/**
 * Type definitions for API responses and data models
 */

/**
 * Site data model
 */
export interface Site {
  id: string;
  name: string;
  capacity?: number;
  location?: string;
  status?: 'active' | 'inactive' | 'maintenance' | 'operational';
  temperature?: number;
  humidity?: number;
  alarmCount?: number;
  lastUpdated?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * API Error response
 */
export interface ApiErrorResponse {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

/**
 * Alarm data model
 */
export interface Alarm {
  id: string;
  siteId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  timestamp: string;
  type?: 'temperature' | 'humidity' | 'system' | 'power' | string;
  acknowledgedBy?: string;
  resolvedAt?: string;
}

/**
 * WebSocket message type
 */
export interface WebSocketMessage {
  event: string;
  data: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Auth token response
 */
export interface AuthTokenResponse {
  token: string;
  refreshToken?: string;
  expiresIn: number;
}

/**
 * Auth state
 */
export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * API Request config
 */
export interface ApiRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  data?: unknown;
  timeout?: number;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiErrorResponse;
}
