import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 8000;

/**
 * Extract the host from Expo's dev-server URI.
 *
 * Examples:
 *   "192.168.1.20:8081"      -> "192.168.1.20"
 *   "http://192.168.1.20:8081" -> "192.168.1.20"
 *   "[::1]:8081"             -> "::1"
 */
function extractHost(hostUri?: string | null): string | null {
  if (!hostUri) return null;

  const withoutProtocol = hostUri.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').split('/')[0];

  if (withoutProtocol.startsWith('[')) {
    const closingBracket = withoutProtocol.indexOf(']');
    return closingBracket > 1 ? withoutProtocol.slice(1, closingBracket) : null;
  }

  return withoutProtocol.split(':')[0] || null;
}

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

/**
 * Resolve the backend URL.
 *
 * Order of precedence:
 *   1. EXPO_PUBLIC_API_BASE_URL (put it in mobile/.env)
 *   2. The same host Metro/Expo is served from, so physical devices can reach
 *      the development machine over the LAN.
 *   3. Platform fallbacks (Android emulator uses 10.0.2.2 to reach the host).
 */
function resolveApiBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (configuredUrl) {
    return normalizeBaseUrl(configuredUrl);
  }

  if (__DEV__) {
    const devHost = extractHost(Constants.expoConfig?.hostUri);

    if (devHost && devHost !== 'localhost' && devHost !== '127.0.0.1' && devHost !== '::1') {
      const host = devHost.includes(':') ? `[${devHost}]` : devHost;
      return `http://${host}:${API_PORT}/api/v1`;
    }
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}/api/v1`;
  }

  return `http://localhost:${API_PORT}/api/v1`;
}

export const API_BASE_URL = resolveApiBaseUrl();

export const TOKEN_KEY = 'auth_token';
export const USER_KEY = 'auth_user';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Do not force a JSON Content-Type here: axios sets it for object bodies,
  // while FormData requests need axios/the platform to add the multipart
  // boundary. Forcing application/json breaks image uploads.
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let unauthorizedHandler: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  unauthorizedHandler = fn;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
