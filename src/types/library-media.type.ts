export type LibraryMediaType = 'Image' | 'Video' | 'Document' | 'Audio' | string;

export interface LibraryMediaItem {
  id: string;
  mediaUrl: string;
  mediaType: LibraryMediaType;
  fileName?: string | null;
  fileSizeBytes?: number | null;
  contentType?: string | null;
  isActive: boolean;
  isPublic: boolean;
  uploadedById?: string | null;
  uploadedAt?: string | null;
  snakeSpeciesId?: number | null;
}

export interface LibraryMediaListParams {
  pageNumber?: number;
  pageSize?: number;
  snakeSpeciesId?: number;
  mediaType?: LibraryMediaType;
  isActive?: boolean;
  isPublic?: boolean;
  fileName?: string;
}

export interface LibraryMediaListResult {
  items: LibraryMediaItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface CreateLibraryMediaPayload {
  file: File;
  mediaType: LibraryMediaType;
  snakeSpeciesId?: number;
}

export interface UpdateLibraryMediaPayload {
  file?: File;
  mediaType?: LibraryMediaType;
  isActive?: boolean;
  isPublic?: boolean;
  snakeSpeciesId?: number;
}
