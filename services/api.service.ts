import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, API_ENDPOINTS } from '@/config/api.config';

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Array<{ field: string; message: string }>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Occurrence {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  category?: string;
  userId: string;
  user?: User;
  photos?: Photo[];
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  url: string;
  occurrenceId: string;
  createdAt: string;
}

export interface Share {
  id: string;
  occurrenceId: string;
  occurrence?: Occurrence;
  sharedById: string;
  sharedBy?: User;
  sharedWithId: string;
  sharedWith?: User;
  createdAt: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.loadToken();
  }

  private async loadToken() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      this.token = token;
    } catch (error) {
      console.error('Error loading token:', error);
    }
  }

  async setToken(token: string | null) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem('auth_token', token);
    } else {
      await AsyncStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        ...API_CONFIG.HEADERS,
        ...(options.headers as Record<string, string> || {}),
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const url = `${this.baseURL}${endpoint}`;
      
      console.log('🌐 API Request:', options.method || 'GET', url);
      console.log('📦 Body:', options.body);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timeout - verifique se a API está rodando e acessível'));
        }, 10000);
      });
      
      const fetchPromise = fetch(url, {
        ...options,
        headers,
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      console.log('📥 Response status:', response.status);
      
      const data = await response.json();
      console.log('📄 Response data:', data);

      if (!response.ok) {
        return {
          success: false,
          error: {
            message: data.error || data.message || 'Erro na requisição',
            statusCode: response.status,
            errors: data.errors,
          },
        };
      }

      if (data.success !== undefined && data.data !== undefined) {
        return {
          success: data.success,
          data: data.data,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('API request error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Erro de conexão com o servidor',
        },
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadFile<T>(
    endpoint: string,
    file: {
      uri: string;
      name: string;
      type: string;
    },
    additionalData?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      
      formData.append('photo', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);

      if (additionalData) {
        Object.keys(additionalData).forEach((key) => {
          formData.append(key, additionalData[key]);
        });
      }

      const headers: Record<string, string> = {};
      
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const url = `${this.baseURL}${endpoint}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            message: data.message || 'Erro no upload',
            statusCode: response.status,
          },
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Erro ao fazer upload',
        },
      };
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.get(API_ENDPOINTS.HEALTH);
      return response.success;
    } catch {
      return false;
    }
  }
}

export const apiClient = new ApiClient();
