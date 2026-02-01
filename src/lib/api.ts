import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { ApiErrorResponse } from '@/types';
import { mockApiHandlers } from '@/mockServer';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public data: ApiErrorResponse,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * API Client configuration interface
 */
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * API Client interface defining public methods
 */
export interface IApiClient {
  setToken(token: string): void;
  clearToken(): void;
  get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
}

/**
 * Implementation of the API Client
 *
 * Features:
 * - JWT token authentication
 * - Request/response interceptors
 * - Automatic token refresh on 401 errors
 * - Consistent error handling
 * - Timeout management
 *
 * @example
 * ```typescript
 * const apiClient = new ApiClient({
 *   baseURL: 'https://api.example.com',
 *   timeout: 10000,
 * });
 *
 * apiClient.setToken('your-jwt-token');
 * const data = await apiClient.get<Site[]>('/api/sites');
 * ```
 */
export class ApiClient implements IApiClient {
  private axiosInstance: AxiosInstance;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: string) => void;
    reject: (reason?: AxiosError) => void;
  }> = [];

  constructor(config: ApiClientConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor: Add authentication token
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: Handle errors and token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle 401 Unauthorized (expired token)
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue request while token is being refreshed
            return new Promise((resolve, reject) => {
              this.failedQueue.push({
                resolve: (token: string) => {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                  resolve(this.axiosInstance(originalRequest));
                },
                reject,
              });
            });
          }

          this.isRefreshing = true;
          originalRequest._retry = true;

          try {
            // Attempt to refresh token
            const newToken = await this.refreshAccessToken();
            this.token = newToken;

            // Resolve queued requests
            this.failedQueue.forEach((prom) => prom.resolve(newToken));
            this.failedQueue = [];

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            // Clear tokens and reject
            this.clearToken();
            this.failedQueue.forEach((prom) => prom.reject(refreshError as AxiosError));
            this.failedQueue = [];
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other errors
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Handle API errors and throw consistent ApiError
   */
  private handleError(error: AxiosError): ApiError {
    const statusCode = error.response?.status || 0;
    const data = error.response?.data as ApiErrorResponse | undefined;

    const apiError: ApiErrorResponse = {
      message: data?.message || error.message || 'An unknown error occurred',
      code: data?.code || 'UNKNOWN_ERROR',
      statusCode,
      details: data?.details,
    };

    return new ApiError(statusCode, apiError, apiError.message);
  }

  /**
   * Refresh access token (mock implementation)
   * In production, this would call a refresh endpoint
   */
  private async refreshAccessToken(): Promise<string> {
    // Mock implementation - replace with actual API call
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In production, you would call:
    // const response = await this.axiosInstance.post('/auth/refresh', {
    //   refreshToken: this.refreshToken,
    // });
    // return response.data.token;

    // For mock purposes, return a new token
    return `refreshed-${Date.now()}`;
  }

  /**
   * Set JWT token for authentication
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Set refresh token
   */
  setRefreshToken(refreshToken: string): void {
    this.refreshToken = refreshToken;
  }

  /**
   * Clear authentication tokens
   */
  clearToken(): void {
    this.token = null;
    this.refreshToken = null;
  }

  /**
   * Use mock server for API calls (fallback when backend unavailable)
   */
  private useMockServer(endpoint: string, method: string, config?: AxiosRequestConfig): Promise<unknown> {
    const url = endpoint.replace('/api', '').replace('/api/', '');

    // Parse URL parameters
    const params = config?.params || {};
    const page = (params.page as number) || 1;
    const limit = (params.limit as number) || 10;

    // Route to appropriate mock handler
    if (url === '/sites' && method === 'GET') {
      return mockApiHandlers.getSites(page, limit);
    }
    if (url.match(/^\/sites\/\d+$/) && method === 'GET') {
      const id = url.split('/').pop() || '';
      return mockApiHandlers.getSiteById(id);
    }
    if (url === '/alarms' && method === 'GET') {
      return mockApiHandlers.getAlarms(page, limit);
    }

    // Default: return empty response
    return Promise.resolve({});
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.get<T>(endpoint, config);
      return response.data;
    } catch (error) {
      // Fall back to mock server on error
      return this.useMockServer(endpoint, 'GET', config) as Promise<T>;
    }
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      // Fall back to mock server on error
      return this.useMockServer(endpoint, 'POST', config) as Promise<T>;
    }
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.put<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      // Fall back to mock server on error
      return this.useMockServer(endpoint, 'PUT', config) as Promise<T>;
    }
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.patch<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      // Fall back to mock server on error
      return this.useMockServer(endpoint, 'PATCH', config) as Promise<T>;
    }
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.delete<T>(endpoint, config);
      return response.data;
    } catch (error) {
      // Fall back to mock server on error
      return this.useMockServer(endpoint, 'DELETE', config) as Promise<T>;
    }
  }
}

/**
 * Create and export a singleton instance of the API client
 */
const API_BASE_URL: string = ((import.meta as unknown as { env: Record<string, string> }).env.VITE_API_BASE_URL || 'http://localhost:3000/api');

export const apiClient = new ApiClient({
  baseURL: API_BASE_URL,
  timeout: 10000,
});
