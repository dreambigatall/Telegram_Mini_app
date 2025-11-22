import axios from 'axios';
import WebApp from '@twa-dev/sdk';

// ---------------------------------------------------------------------------
// CONFIGURATION
// For Day 1-6: We use localhost. 
// On Day 7: We will change this to the NGROK HTTPS URL.
// ---------------------------------------------------------------------------
const BASE_URL = 'https://discharge-photos-cad-offset.trycloudflare.com/api'; // 'http://localhost:5000/api';

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
    console.warn("⚠️ No Telegram initData found. Are you opening this in a browser?");
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