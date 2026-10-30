import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, UserRole } from '@/types';
import apiClient from '@/lib/axios';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }

    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { token, user: userData } = response.data.data;

    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout errors, clear local state regardless
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setUser(null);
    }
  }, []);

  const hasRole = useCallback(
    (role: UserRole | UserRole[]) => {
      if (!user) return false;
      if (Array.isArray(role)) {
        return role.includes(user.role);
      }
      return user.role === role;
    },
    [user]
  );

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
