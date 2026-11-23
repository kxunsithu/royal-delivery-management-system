import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../constants';

const isWeb = Platform.OS === 'web';

/** Cross-platform token storage — SecureStore on native, localStorage on web. */
async function getToken(): Promise<string | null> {
  try {
    if (isWeb) return localStorage.getItem('auth_token');
    return await SecureStore.getItemAsync('auth_token');
  } catch {
    return null;
  }
}

async function clearTokens(): Promise<void> {
  try {
    if (isWeb) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    } else {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_user');
    }
  } catch {
    // Ignore
  }
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Free-tier hosting can take a while to wake up / respond, so allow
  // enough time before treating the request as failed.
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor to attach token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling + retry on transient failures
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = (error.config || {}) as any;
    const isLoginEndpoint = config?.url?.includes('/auth/login');

    // Retry a few times for network/timeout errors (common on free-tier hosting).
    const retryable =
      !error.response ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ETIMEDOUT';
    config.__retryCount = config.__retryCount || 0;
    if (retryable && config.__retryCount < 2) {
      config.__retryCount += 1;
      const delay = config.__retryCount * 1500;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient(config);
    }

    // Only auto-clear auth if a protected API endpoint (not login) returned 401
    if (error.response?.status === 401 && !isLoginEndpoint) {
      await clearTokens();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
