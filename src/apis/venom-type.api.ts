import type { VenomType, VenomTypeUpsertPayload } from '@/types/venom-type.type';
import { api } from './client';

export const venomTypeApi = {
  getAll: () => api.get<VenomType[]>('/venom-types'),
  getById: (id: number | string) => api.get<VenomType>(`/venom-types/${id}`),
  create: (payload: VenomTypeUpsertPayload) => api.post<VenomType>('/venom-types', payload),
  update: (id: number | string, payload: VenomTypeUpsertPayload) =>
    api.put<VenomType>(`/venom-types/${id}`, payload),
  remove: (id: number | string) => api.delete<void>(`/venom-types/${id}`),
};
