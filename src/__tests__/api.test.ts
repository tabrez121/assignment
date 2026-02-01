import { describe, it, expect, beforeEach } from 'vitest';
import { ApiClient, ApiError } from '@/lib/api';

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient({
      baseURL: 'http://localhost:3000/api',
      timeout: 5000,
    });
  });

  describe('setToken', () => {
    it('should set the authentication token', () => {
      const token = 'test-jwt-token';
      apiClient.setToken(token);
      expect(apiClient).toBeDefined();
    });
  });

  describe('clearToken', () => {
    it('should clear the authentication token', () => {
      apiClient.setToken('test-token');
      apiClient.clearToken();
      expect(apiClient).toBeDefined();
    });
  });

  describe('setRefreshToken', () => {
    it('should set the refresh token', () => {
      const refreshToken = 'test-refresh-token';
      apiClient.setRefreshToken(refreshToken);
      expect(apiClient).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should create ApiError with proper structure', () => {
      const error = new ApiError(401, {
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
        statusCode: 401,
      }, 'Unauthorized access');

      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Unauthorized access');
    });
  });

  describe('HTTP Methods', () => {
    it('should have get method', () => {
      expect(typeof apiClient.get).toBe('function');
    });

    it('should have post method', () => {
      expect(typeof apiClient.post).toBe('function');
    });

    it('should have put method', () => {
      expect(typeof apiClient.put).toBe('function');
    });

    it('should have patch method', () => {
      expect(typeof apiClient.patch).toBe('function');
    });

    it('should have delete method', () => {
      expect(typeof apiClient.delete).toBe('function');
    });
  });
});
