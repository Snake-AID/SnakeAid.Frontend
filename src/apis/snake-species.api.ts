import type {
  SnakeSpeciesDetail,
  SnakeSpeciesSummary,
  SnakeSpeciesUpsertPayload,
} from '@/types/snake-species.type';
import { api } from './client';

export const snakeSpeciesApi = {
  getAll: () => api.get<SnakeSpeciesSummary[]>('/snake-species'),
  getById: (id: number | string) => api.get<SnakeSpeciesDetail>(`/snake-species/${id}`),
  create: (payload: SnakeSpeciesUpsertPayload) =>
    api.post<SnakeSpeciesDetail>('/snake-species', payload),
  update: (id: number | string, payload: Partial<SnakeSpeciesUpsertPayload>) =>
    api.put<SnakeSpeciesDetail>(`/snake-species/${id}`, payload),
  remove: (id: number | string) => api.delete<void>(`/snake-species/${id}`),
};
