import type {
  CreateRegionSnakeMappingRequest,
  GeographicRegionResponse,
  RegionSnakeMappingResponse,
  SyncRegionSnakeMappingsRequest,
  UpdateRegionSnakeMappingRequest,
} from '@/types/geographic-region.type';
import { api } from './client';

export const geographicRegionApi = {
  getAll: () => api.get<GeographicRegionResponse[]>('/geographic-regions'),

  getMappedBySnakeSpeciesId: (snakeSpeciesId: number | string) =>
    api.get<RegionSnakeMappingResponse[]>(`/snake-species/${snakeSpeciesId}/region-mappings`),

  createMapping: (snakeSpeciesId: number | string, payload: CreateRegionSnakeMappingRequest) =>
    api.post<RegionSnakeMappingResponse>(`/snake-species/${snakeSpeciesId}/region-mappings`, payload),

  updateMapping: (
    snakeSpeciesId: number | string,
    mappingId: number | string,
    payload: UpdateRegionSnakeMappingRequest,
  ) => api.patch<RegionSnakeMappingResponse>(`/snake-species/${snakeSpeciesId}/region-mappings/${mappingId}`, payload),

  deleteMapping: (snakeSpeciesId: number | string, mappingId: number | string) =>
    api.delete<void>(`/snake-species/${snakeSpeciesId}/region-mappings/${mappingId}`),

  syncMappings: (snakeSpeciesId: number | string, payload: SyncRegionSnakeMappingsRequest) =>
    api.put<RegionSnakeMappingResponse[]>(`/snake-species/${snakeSpeciesId}/region-mappings`, payload),
};
