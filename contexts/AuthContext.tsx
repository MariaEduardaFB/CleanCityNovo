import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApiService } from '@/services/auth-api.service';
import type { User } from '@/services/api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_CACHE_KEY = 'cached_user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name?: string, phone?: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);

      if (!authApiService.isAuthenticated()) {
        const cachedUser = await AsyncStorage.getItem(USER_CACHE_KEY);
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }
        setLoading(false);
        return;
      }

      const response = await authApiService.getProfile();
      
      if (response.success && response.data) {
        setUser(response.data);
        await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(response.data));
      } else {
        await authApiService.logout();
        await AsyncStorage.removeItem(USER_CACHE_KEY);
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      const cachedUser = await AsyncStorage.getItem(USER_CACHE_KEY);
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApiService.login({ email, password });
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Erro ao fazer login');
      }

      setUser(response.data.user);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(response.data.user));
      
      console.log('✅ Login realizado:', response.data.user.email);
    } catch (error: any) {
      console.error('❌ Erro ao fazer login:', error);
      throw error;
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    phone?: string
  ) => {
    try {
      const response = await authApiService.signup({
        email,
        password,
        name,
        phone,
      });
      
      console.log('📊 Response completa do signup:', JSON.stringify(response, null, 2));
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Erro ao criar conta');
      }

      if (!response.data.user) {
        console.error('❌ response.data não tem user:', response.data);
        throw new Error('Resposta da API inválida');
      }

      setUser(response.data.user);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(response.data.user));
      
      console.log('✅ Conta criada:', response.data.user.email);
    } catch (error: any) {
      console.error('❌ Erro ao criar conta:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApiService.logout();
      await AsyncStorage.removeItem(USER_CACHE_KEY);
      setUser(null);
      
      console.log('✅ Logout realizado');
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
      throw error;
    }
  };

  const updateProfile = async (name?: string, phone?: string) => {
    try {
      const response = await authApiService.updateProfile({ name, phone });
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Erro ao atualizar perfil');
      }

      setUser(response.data);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(response.data));
      
      console.log('✅ Perfil atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await authApiService.getProfile();
      
      if (response.success && response.data) {
        setUser(response.data);
        await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
