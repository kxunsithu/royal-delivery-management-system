import apiClient from './apiClient';
import { User } from '../types';

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    const payload = response.data?.data || response.data;
    const token = payload?.token;
    const user = payload?.user;

    if (!token || !user) {
      throw new Error('ဆာဗာမှ အချက်အလက်များ မမှန်ကန်ပါ (Missing token or user)');
    }

    localStorage.setItem('auth_token', String(token));
    localStorage.setItem('auth_user', JSON.stringify(user));

    return { token, user };
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  },

  async me(): Promise<User> {
    const response = await apiClient.get('/auth/me');
    return response.data?.data || response.data;
  },

  async getStoredUser(): Promise<User | null> {
    const userStr = localStorage.getItem('auth_user');
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
    return localStorage.getItem('auth_token');
  },

  async isAuthenticated(): Promise<boolean> {
    const token = localStorage.getItem('auth_token');
    return !!token;
  },
};