import axios from 'axios';
import { API_BASE_URL } from '../constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

function getToken(): string | null {
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

function clearTokens() {
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  } catch {
    // ignore
  }
}

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = (error.config || {}) as any;
    const isLoginEndpoint = config?.url?.includes('/auth/login');

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

    if (error.response?.status === 401 && !isLoginEndpoint) {
      clearTokens();
    }
    return Promise.reject(error);
  }
);

export default apiClient;