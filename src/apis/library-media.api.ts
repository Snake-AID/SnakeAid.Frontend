import type {
  CreateLibraryMediaPayload,
  LibraryMediaItem,
  LibraryMediaListParams,
  LibraryMediaListResult,
  UpdateLibraryMediaPayload,
} from '@/types/library-media.type';
import { api, ApiClientError } from './client';

interface LibraryMediaUploadResponse {
  id?: string;
  mediaId?: string;
  libraryMediaId?: string;
}

const buildFormData = (payload: UpdateLibraryMediaPayload | CreateLibraryMediaPayload) => {
  const formData = new FormData();

  if ('file' in payload && payload.file) {
    formData.append('file', payload.file);
  }

  if (payload.mediaType != null && payload.mediaType !== '') {
    formData.append('mediaType', String(payload.mediaType));
  }

  if ('isActive' in payload && payload.isActive != null) {
    formData.append('isActive', String(payload.isActive));
  }

  if ('isPublic' in payload && payload.isPublic != null) {
    formData.append('isPublic', String(payload.isPublic));
  }

  if (payload.snakeSpeciesId != null) {
    formData.append('snakeSpeciesId', String(payload.snakeSpeciesId));
  }

  return formData;
};

const toQueryString = (params: LibraryMediaListParams) => {
  const query = new URLSearchParams();

  if (params.pageNumber != null) {
    query.set('pageNumber', String(params.pageNumber));
  }

  if (params.pageSize != null) {
    query.set('pageSize', String(params.pageSize));
  }

  if (params.snakeSpeciesId != null) {
    query.set('snakeSpeciesId', String(params.snakeSpeciesId));
  }

  if (params.mediaType) {
    query.set('mediaType', String(params.mediaType));
  }

  if (params.isActive != null) {
    query.set('isActive', String(params.isActive));
  }

  if (params.isPublic != null) {
    query.set('isPublic', String(params.isPublic));
  }

  if (params.fileName?.trim()) {
    query.set('fileName', params.fileName.trim());
  }

  return query.toString();
};

const normalizePagedResult = (raw: any): LibraryMediaListResult => {
  const items = Array.isArray(raw?.items) ? raw.items as LibraryMediaItem[] : [];
  const meta = raw?.meta;

  if (meta) {
    return {
      items,
      totalCount: Number(meta.total_items ?? items.length ?? 0),
      page: Number(meta.current_page ?? 1),
      pageSize: Number(meta.page_size ?? items.length ?? 10),
    };
  }

  return {
    items,
    totalCount: Number(raw?.totalCount ?? raw?.total_count ?? items.length ?? 0),
    page: Number(raw?.page ?? raw?.currentPage ?? 1),
    pageSize: Number(raw?.pageSize ?? raw?.page_size ?? 10),
  };
};

export const libraryMediaApi = {
  list: async (params: LibraryMediaListParams = {}): Promise<LibraryMediaListResult> => {
    const query = toQueryString(params);
    const url = query.length > 0 ? `/library-media?${query}` : '/library-media';
    const response = await api.get<any>(url);
    return normalizePagedResult(response);
  },

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

  create: async (payload: CreateLibraryMediaPayload): Promise<LibraryMediaItem> => {
    const formData = buildFormData(payload);
    return api.post<LibraryMediaItem>('/library-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getById: (id: string) => api.get<LibraryMediaItem>(`/library-media/${id}`),

  update: async (id: string, payload: UpdateLibraryMediaPayload): Promise<LibraryMediaItem> => {
    const formData = buildFormData(payload);
    return api.put<LibraryMediaItem>(`/library-media/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  remove: (id: string) => api.delete<{ message?: string }>(`/library-media/${id}`),
};
