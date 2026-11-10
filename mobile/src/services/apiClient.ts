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
  timeout: 30000,
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

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Only auto-clear auth if a protected API endpoint (not login) returned 401
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginEndpoint) {
      await clearTokens();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
