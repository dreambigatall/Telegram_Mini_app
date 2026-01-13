/**
 * Request Manager Utility
 * Handles request deduplication, cancellation, and rate limiting
 */

interface PendingRequest {
  abortController: AbortController;
  promise: Promise<unknown>;
  timestamp: number;
}

class RequestManager {
  private pendingRequests = new Map<string, PendingRequest>();
  private requestCache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly CACHE_TTL = 2000; // 2 seconds cache

  /**
   * Generate a unique key for a request
   */
  private getRequestKey(method: string, url: string, params?: unknown): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${method}:${url}:${paramString}`;
  }

  /**
   * Check if cached response is still valid
   */
  private getCachedResponse(key: string): unknown | null {
    const cached = this.requestCache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.CACHE_TTL) {
      this.requestCache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Store response in cache
   */
  private setCachedResponse(key: string, data: unknown): void {
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clean up old cached responses
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.requestCache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.requestCache.delete(key);
      }
    }
  }

  /**
   * Cancel a pending request
   */
  cancelRequest(key: string): void {
    const pending = this.pendingRequests.get(key);
    if (pending) {
      pending.abortController.abort();
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests(): void {
    for (const [key, pending] of this.pendingRequests.entries()) {
      pending.abortController.abort();
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Execute a request with deduplication and caching
   */
  async executeRequest<T>(
    method: string,
    url: string,
    requestFn: (signal: AbortSignal) => Promise<T>,
    params?: unknown,
    useCache: boolean = true
  ): Promise<T> {
    const key = this.getRequestKey(method, url, params);

    // Clean up old cache entries periodically
    if (Math.random() < 0.1) {
      this.cleanupCache();
    }

    // Check cache first (only for GET requests)
    if (useCache && method.toUpperCase() === 'GET') {
      const cached = this.getCachedResponse(key);
      if (cached) {
        return cached as T;
      }
    }

    // Check if same request is already pending
    const existing = this.pendingRequests.get(key);
    if (existing) {
      // Return existing promise to avoid duplicate requests
      return existing.promise as Promise<T>;
    }

    // Create new request
    const abortController = new AbortController();
    const promise = requestFn(abortController.signal)
      .then((data) => {
        // Store in cache on success (only for GET)
        if (useCache && method.toUpperCase() === 'GET') {
          this.setCachedResponse(key, data);
        }
        return data;
      })
      .finally(() => {
        // Clean up after request completes
        this.pendingRequests.delete(key);
      });

    // Store pending request
    this.pendingRequests.set(key, {
      abortController,
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * Get count of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.requestCache.clear();
  }
}

// Singleton instance
export const requestManager = new RequestManager();

/**
 * Debounce function - delays execution until after wait time
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      // Only retry on 429 (rate limit) or network errors
      const errorObj = error as { response?: { status?: number }; code?: string; request?: unknown };
      const shouldRetry =
        errorObj.response?.status === 429 ||
        errorObj.code === 'ECONNABORTED' ||
        errorObj.code === 'ERR_NETWORK' ||
        (!errorObj.response && errorObj.request);

      if (!shouldRetry || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const totalDelay = delay + jitter;

      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError;
}

