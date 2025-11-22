import axios from 'axios';
import WebApp from '@twa-dev/sdk';

// ---------------------------------------------------------------------------
// CONFIGURATION
// API Base URL from environment variables
// Default to localhost for development if not set
// ---------------------------------------------------------------------------
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://humanities-female-enhanced-include.trycloudflare.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// THE INTERCEPTOR
// Before sending any request, check if we are inside Telegram.
// If yes, grab the secure 'initData' string and attach it to headers.
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  // 1. Get the data from Telegram SDK
  const initData = WebApp.initData; 

  // 2. If it exists, attach it to the Authorization header
  if (initData) {
    config.headers.Authorization = initData;
  } else {
    // Only warn in development mode
    if (import.meta.env.DEV) {
      console.warn("⚠️ No Telegram initData found. Are you opening this in a browser?");
    }
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Helper function to get image URL
export const getImageUrl = (mediaFileId: string) => {
  return `${BASE_URL}/products/image/${mediaFileId}`;
};

export default api;