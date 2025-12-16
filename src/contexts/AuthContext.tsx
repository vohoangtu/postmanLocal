/**
 * Authentication Context
 * Quản lý authentication state cho toàn bộ app
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/authService';
import { roleService } from '../services/roleService';
import { useUserPreferencesStore } from '../stores/userPreferencesStore';
import { useOnboardingStore } from '../stores/onboardingStore';

interface User {
  id: string;
  name: string;
  email: string;
  role?: 'user' | 'admin' | 'super_admin';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { loadPreferences } = useUserPreferencesStore();
  const { loadOnboardingStatus } = useOnboardingStore();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const userData = await authService.getUser();
        if (userData) {
          setUser(userData);
          roleService.setUser(userData);
          await loadPreferences();
          await loadOnboardingStatus();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, twoFactorCode?: string) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    
    const body: any = { email, password };
    if (twoFactorCode) {
      body.two_factor_code = twoFactorCode;
    }

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.requires_2fa) {
      throw new Error('REQUIRES_2FA');
    }

    if (!response.ok) {
      throw new Error(data.message || 'Đăng nhập thất bại');
    }

    // Save tokens
    await authService.saveTokens({
      accessToken: data.token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : undefined,
    });

    // Save user
    await authService.saveUser(data.user);
    setUser(data.user);
    roleService.setUser(data.user);

    // Load preferences
    if (data.preferences) {
      useUserPreferencesStore.getState().preferences = data.preferences;
      useUserPreferencesStore.getState().applyTheme();
    } else {
      await loadPreferences();
    }

    // Load onboarding status
    await loadOnboardingStatus();

    // Refresh user data
    await refreshUser();
  };

  const logout = async () => {
    try {
      const token = await authService.getAccessToken();
      if (token) {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await authService.clearTokens();
      roleService.clearUser();
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/auth/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        await authService.saveUser(userData);
        setUser(userData);
        roleService.setUser(userData);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
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
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
