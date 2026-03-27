import { api, ApiClientError } from './client';

interface LibraryMediaUploadResponse {
  id?: string;
  mediaId?: string;
  libraryMediaId?: string;
}

export const libraryMediaApi = {
  uploadSnakeImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mediaType', 'Image');
    // Backend expects snakeSpeciesId as empty value when uploading standalone media.
    formData.append('snakeSpeciesId', '');

    const response = await api.post<LibraryMediaUploadResponse>('/library-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const mediaId = response.id ?? response.mediaId ?? response.libraryMediaId;
    if (!mediaId) {
      throw new ApiClientError(
        'Upload ảnh thành công nhưng không nhận được mediaId từ hệ thống.',
        0,
        null,
      );
    }

    return mediaId;
  },
};
