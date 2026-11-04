import apiClient from './apiClient';
import * as SecureStore from 'expo-secure-store';

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: string;
  is_active: boolean;
  profile_image_url?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

async function safeSetItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    console.warn(`SecureStore set failed for ${key}:`, e);
  }
}

async function safeGetItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (e) {
    console.warn(`SecureStore get failed for ${key}:`, e);
    return null;
  }
}

async function safeDeleteItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    console.warn(`SecureStore delete failed for ${key}:`, e);
  }
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    // Handle both { data: { token, user } } and direct { token, user }
    const payload = response.data?.data || response.data;
    const token = payload?.token;
    const user = payload?.user;

    if (!token || !user) {
      throw new Error('ဆာဗာမှ အချက်အလက်များ မမှန်ကန်ပါ (Missing token or user)');
    }

    // Store token and user safely
    await safeSetItem('auth_token', String(token));
    await safeSetItem('auth_user', JSON.stringify(user));

    return { token, user };
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network error on logout
    } finally {
      await safeDeleteItem('auth_token');
      await safeDeleteItem('auth_user');
    }
  },

  async me(): Promise<User> {
    const response = await apiClient.get('/auth/me');
    return response.data?.data || response.data;
  },

  async getStoredUser(): Promise<User | null> {
    const userStr = await safeGetItem('auth_user');
    if (userStr && userStr !== 'undefined') {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  async getStoredToken(): Promise<string | null> {
    return safeGetItem('auth_token');
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await safeGetItem('auth_token');
    return !!token;
  },
};
