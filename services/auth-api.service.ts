import { apiClient, ApiResponse, AuthResponse, User } from './api.service';
import { API_ENDPOINTS } from '@/config/api.config';

export interface SignupData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

class AuthApiService {
  async signup(data: SignupData): Promise<ApiResponse<AuthResponse>> {
    console.log('🔐 Tentando criar conta:', data.email);
    console.log('📍 Endpoint:', API_ENDPOINTS.AUTH.SIGNUP);
    
    const requestData = {
      email: data.email,
      password: data.password,
      fullName: data.name,
    };
    
    console.log('📦 Dados que serão enviados:', requestData);
    
    try {
      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.AUTH.SIGNUP,
        requestData
      );

      console.log('📝 Resultado do signup:', response.success ? '✅ Sucesso' : '❌ Erro');
      console.log('🔍 Response.data:', JSON.stringify(response.data, null, 2));
      
      if (!response.success) {
        console.error('❌ Erro no signup:', response.error);
      }

      if (response.success && response.data?.token) {
        console.log('💾 Salvando token...');
        await apiClient.setToken(response.data.token);
      }

      return response;
    } catch (error: any) {
      console.error('🚨 Exceção no signup:', error);
      throw error;
    }
  }

  async login(data: LoginData): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      data
    );

    if (response.success && response.data?.token) {
      await apiClient.setToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    await apiClient.setToken(null);
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get<User>(API_ENDPOINTS.AUTH.PROFILE);
  }

  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<User>> {
    return apiClient.put<User>(API_ENDPOINTS.AUTH.PROFILE, data);
  }

  async changePassword(data: ChangePasswordData): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      data
    );
  }

  isAuthenticated(): boolean {
    return !!apiClient.getToken();
  }

  getToken(): string | null {
    return apiClient.getToken();
  }
}

export const authApiService = new AuthApiService();
