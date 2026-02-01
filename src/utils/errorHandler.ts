import { ApiError } from '@/lib/api';

/**
 * Error types for different error scenarios
 */
export enum ErrorType {
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  WEBSOCKET_ERROR = 'WEBSOCKET_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Structured error class with type and retry capability
 */
export class AppError extends Error {
  constructor(
    public type: ErrorType,
    public statusCode?: number,
    public isRetryable: boolean = false,
    message?: string
  ) {
    super(message || 'An error occurred');
    this.name = 'AppError';
  }
}

/**
 * Convert API errors to user-friendly messages
 */
const errorMessages: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  408: 'Request timeout. Please try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Server error. Please try again later.',
  502: 'Bad gateway. Please try again later.',
  503: 'Service unavailable. Please try again later.',
  504: 'Gateway timeout. Please try again later.',
};

/**
 * Get user-friendly error message from API error
 */
export const getErrorMessage = (error: unknown): string => {
  // Handle ApiError instances
  if (error instanceof ApiError) {
    if (error.data?.message) {
      return error.data.message;
    }
    return errorMessages[error.statusCode] || 'An error occurred';
  }

  // Handle custom AppError
  if (error instanceof AppError) {
    return error.message;
  }

  // Handle standard Error
  if (error instanceof Error) {
    return error.message;
  }

  // Handle unknown errors
  return 'An unexpected error occurred';
};

/**
 * Determine if an error is retryable
 */
export const isRetryable = (error: unknown): boolean => {
  // Retryable status codes
  const retryableCodes = [408, 429, 500, 502, 503, 504];

  if (error instanceof ApiError) {
    return retryableCodes.includes(error.statusCode);
  }

  if (error instanceof AppError) {
    return error.isRetryable;
  }

  // Network errors are typically retryable
  if (error instanceof Error && error.message.includes('Network')) {
    return true;
  }

  return false;
};

/**
 * Convert unknown errors to AppError
 */
export const normalizeError = (error: unknown): AppError => {
  if (error instanceof ApiError) {
    return new AppError(
      ErrorType.API_ERROR,
      error.statusCode,
      isRetryable(error),
      error.message
    );
  }

  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    const isNetwork = error.message.includes('Network') || error.message.includes('fetch');
    return new AppError(
      isNetwork ? ErrorType.NETWORK_ERROR : ErrorType.UNKNOWN_ERROR,
      undefined,
      isNetwork,
      error.message
    );
  }

  return new AppError(ErrorType.UNKNOWN_ERROR, undefined, false, 'An unexpected error occurred');
};

/**
 * Error logger for debugging
 */
export const logError = (
  error: unknown,
  context?: Record<string, unknown>
): void => {
  const normalizedError = normalizeError(error);

  console.error('Error logged:', {
    type: normalizedError.type,
    message: normalizedError.message,
    statusCode: normalizedError.statusCode,
    isRetryable: normalizedError.isRetryable,
    context,
    timestamp: new Date().toISOString(),
  });

  // In production, send to error tracking service (e.g., Sentry)
  // sentryClient.captureException(error, { extra: context });
};

/**
 * Retry logic with exponential backoff
 */
export const retryWithBackoff = async <T,>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!isRetryable(error) || i === maxRetries - 1) {
        throw error;
      }

      const backoffDelay = delay * Math.pow(2, i);
      console.log(`Retrying after ${backoffDelay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }

  throw lastError!;
};
