import axios from 'axios';
import type { AxiosError } from 'axios';
import WebApp from '@twa-dev/sdk';
import { requestManager, retryWithBackoff } from './requestManager';

// Minimal config type for our use case (compatible with all axios versions)
interface RequestConfig {
  params?: Record<string, unknown>;
  signal?: AbortSignal;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// CONFIGURATION
// API Base URL from environment variables
// Default to localhost for development if not set
// ---------------------------------------------------------------------------
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://route-betty-sol-disk.trycloudflare.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// ---------------------------------------------------------------------------
// THE INTERCEPTOR
// Before sending any request, check if we are inside Telegram.
// If yes, grab the secure 'initData' string and attach it to headers.
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  // 1. Get the data from Telegram SDK - ALWAYS get fresh initData
  const initData = WebApp.initData; 

  // 2. If it exists, attach it to the Authorization header
  if (initData) {
    config.headers.Authorization = initData;
  }

  // 3. Handle FormData - let browser set Content-Type with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// ---------------------------------------------------------------------------
// RESPONSE INTERCEPTOR
// Handle 401 and 429 errors globally
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle 429 (Rate Limit) with automatic retry
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const retryDelay = retryAfter ? parseInt(retryAfter) * 1000 : 2000;
      
      // Don't auto-retry here - let the request manager handle it
      // Just enhance the error message
      const originalMessage = (error.response?.data as { message?: string })?.message || 'Too many requests. Please wait a moment.';
      (error as AxiosError & { rateLimitDelay?: number; enhancedMessage?: string }).rateLimitDelay = retryDelay;
      (error as AxiosError & { rateLimitDelay?: number; enhancedMessage?: string }).enhancedMessage = originalMessage;
      
      return Promise.reject(error);
    }
    
    // Handle 401 errors
    if (error.response?.status === 401) {
      // Check if initData is still available
      const initData = WebApp.initData;
      
      if (!initData || initData.trim() === '') {
        // initData is missing - this is a real auth problem
        return Promise.reject(error);
      }
      
      // initData exists but request failed - might be stale or backend issue
      // Enhance error message for better debugging
      const errorData = error.response?.data as { message?: string; error?: string } | undefined;
      const originalMessage = errorData?.message || errorData?.error || 'Authentication failed';
      (error as AxiosError & { enhancedMessage?: string }).enhancedMessage = `Auth error: ${originalMessage}. initData present: ${initData ? 'yes' : 'no'}`;
      
      return Promise.reject(error);
    }
    
    // For all other errors, pass through unchanged
    return Promise.reject(error);
  }
);

// Helper function to get image URL
export const getImageUrl = (mediaFileId: string) => {
  return `${BASE_URL}/products/image/${mediaFileId}`;
};

// ---------------------------------------------------------------------------
// ENHANCED API METHODS WITH REQUEST MANAGER
// ---------------------------------------------------------------------------

/**
 * Enhanced GET with deduplication, caching, and retry
 */
export const apiGet = async <T = unknown>(
  url: string,
  config?: RequestConfig,
  useCache: boolean = true
): Promise<T> => {
  // Normalize URL (remove baseURL if already included)
  const requestUrl = url.startsWith('http') ? url : url;
  
  return requestManager.executeRequest(
    'GET',
    requestUrl,
    async (signal) => {
      return retryWithBackoff(async () => {
        const response = await api.get<T>(requestUrl, { ...config, signal });
        return response.data;
      });
    },
    config?.params,
    useCache
  );
};

/**
 * Enhanced POST with retry (no caching)
 */
export const apiPost = async <T = unknown>(
  url: string,
  data?: unknown,
  config?: RequestConfig
): Promise<T> => {
  return retryWithBackoff(async () => {
    const response = await api.post<T>(url, data, config);
    return response.data;
  });
};

/**
 * Enhanced PATCH with retry (no caching)
 */
export const apiPatch = async <T = unknown>(
  url: string,
  data?: unknown,
  config?: RequestConfig
): Promise<T> => {
  return retryWithBackoff(async () => {
    const response = await api.patch<T>(url, data, config);
    return response.data;
  });
};

/**
 * Enhanced DELETE with retry (no caching)
 */
export const apiDelete = async <T = unknown>(
  url: string,
  config?: RequestConfig
): Promise<T> => {
  return retryWithBackoff(async () => {
    const response = await api.delete<T>(url, config);
    return response.data;
  });
};

// ---------------------------------------------------------------------------
// HELPER: Post FormData (for file uploads)
// ---------------------------------------------------------------------------
export const postFormData = async <T = unknown>(url: string, formData: FormData): Promise<T> => {
  return retryWithBackoff(async () => {
    const response = await api.post<T>(url, formData);
    return response.data;
  });
};

// ---------------------------------------------------------------------------
// HELPER: Patch FormData (for file uploads with updates)
// ---------------------------------------------------------------------------
export const patchFormData = async <T = unknown>(url: string, formData: FormData): Promise<T> => {
  return retryWithBackoff(async () => {
    const response = await api.patch<T>(url, formData);
    return response.data;
  });
};

// Export request manager for cleanup
export { requestManager };

export default api;