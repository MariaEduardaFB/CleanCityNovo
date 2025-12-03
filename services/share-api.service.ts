import { apiClient, ApiResponse, Share } from './api.service';
import { API_ENDPOINTS } from '@/config/api.config';

export interface ShareOccurrenceData {
  occurrenceId: string;
  sharedWithEmail: string;
}

class ShareApiService {
  async shareOccurrence(data: ShareOccurrenceData): Promise<ApiResponse<Share>> {
    return apiClient.post<Share>(API_ENDPOINTS.SHARES.BASE, data);
  }

  async getSharedWithMe(): Promise<ApiResponse<Share[]>> {
    return apiClient.get<Share[]>(API_ENDPOINTS.SHARES.SHARED_WITH_ME);
  }

  async getSharedByMe(): Promise<ApiResponse<Share[]>> {
    return apiClient.get<Share[]>(API_ENDPOINTS.SHARES.SHARED_BY_ME);
  }

  async revokeShare(shareId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(API_ENDPOINTS.SHARES.REVOKE(shareId));
  }
}

export const shareApiService = new ShareApiService();
