import { apiClient, ApiResponse, Photo } from './api.service';
import { API_ENDPOINTS } from '@/config/api.config';

export interface PhotoFile {
  uri: string;
  name: string;
  type: string;
}

class PhotoApiService {
  async uploadPhoto(
    occurrenceId: string,
    photo: PhotoFile
  ): Promise<ApiResponse<Photo>> {
    return apiClient.uploadFile<Photo>(
      API_ENDPOINTS.PHOTOS.UPLOAD(occurrenceId),
      photo
    );
  }

  async getOccurrencePhotos(occurrenceId: string): Promise<ApiResponse<Photo[]>> {
    return apiClient.get<Photo[]>(API_ENDPOINTS.PHOTOS.GET(occurrenceId));
  }

  async downloadPhoto(photoId: string): Promise<ApiResponse<Blob>> {
    return apiClient.get<Blob>(API_ENDPOINTS.PHOTOS.DOWNLOAD(photoId));
  }

  async deletePhoto(photoId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(API_ENDPOINTS.PHOTOS.DELETE(photoId));
  }

  getPhotoUrl(photoId: string): string {
    return `${API_ENDPOINTS.PHOTOS.DOWNLOAD(photoId)}`;
  }
}

export const photoApiService = new PhotoApiService();
