import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService, User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  async function initAuth() {
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const storedUser = await authService.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          // Optionally refresh from server
          try {
            const freshUser = await authService.me();
            setUser(freshUser);
          } catch {
            // Token might be expired, clear
            await authService.logout();
            setUser(null);
          }
        }
      }
    } catch (error) {
      console.error('Auth init error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(phone: string, password: string) {
    const data = await authService.login({ phone, password });
    // Drop any cached data from a previous session before showing the new user's data.
    queryClient.clear();
    setUser(data.user);
  }

  async function logout() {
    await authService.logout();
    // Never leak one account's cached lists/details into the next login.
    queryClient.clear();
    setUser(null);
  }

  async function refreshUser() {
    const freshUser = await authService.me();
    setUser(freshUser);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
