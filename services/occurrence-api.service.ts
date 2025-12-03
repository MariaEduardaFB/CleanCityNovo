import { apiClient, ApiResponse, Occurrence } from './api.service';
import { API_ENDPOINTS } from '@/config/api.config';

export interface CreateOccurrenceData {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  category?: string;
}

export interface UpdateOccurrenceData {
  title?: string;
  description?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  category?: string;
}

export interface OccurrenceStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
}

export interface GetOccurrencesParams {
  status?: string;
  category?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface GetByBoundsParams {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  status?: string;
  category?: string;
}

class OccurrenceApiService {
  async create(data: CreateOccurrenceData): Promise<ApiResponse<Occurrence>> {
    return apiClient.post<Occurrence>(API_ENDPOINTS.OCCURRENCES.BASE, data);
  }

  async getAll(params?: GetOccurrencesParams): Promise<ApiResponse<Occurrence[]>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const endpoint = params 
      ? `${API_ENDPOINTS.OCCURRENCES.BASE}?${queryParams.toString()}`
      : API_ENDPOINTS.OCCURRENCES.BASE;

    return apiClient.get<Occurrence[]>(endpoint);
  }

  async getByBounds(params: GetByBoundsParams): Promise<ApiResponse<Occurrence[]>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });

    return apiClient.get<Occurrence[]>(
      `${API_ENDPOINTS.OCCURRENCES.BOUNDS}?${queryParams.toString()}`
    );
  }

  async getById(id: string): Promise<ApiResponse<Occurrence>> {
    return apiClient.get<Occurrence>(API_ENDPOINTS.OCCURRENCES.BY_ID(id));
  }

  async getMyOccurrences(): Promise<ApiResponse<Occurrence[]>> {
    return apiClient.get<Occurrence[]>(API_ENDPOINTS.OCCURRENCES.MY_OCCURRENCES);
  }

  async update(id: string, data: UpdateOccurrenceData): Promise<ApiResponse<Occurrence>> {
    return apiClient.put<Occurrence>(API_ENDPOINTS.OCCURRENCES.BY_ID(id), data);
  }

  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(API_ENDPOINTS.OCCURRENCES.BY_ID(id));
  }

  async getStats(): Promise<ApiResponse<OccurrenceStats>> {
    return apiClient.get<OccurrenceStats>(API_ENDPOINTS.OCCURRENCES.STATS);
  }
}

export const occurrenceApiService = new OccurrenceApiService();
