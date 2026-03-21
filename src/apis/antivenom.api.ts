import type { Antivenom, AntivenomUpsertPayload } from '@/types/antivenom.type';
import { api } from './client';

export const antivenomApi = {
  getAll: () => api.get<Antivenom[]>('/antivenoms'),
  getById: (id: number | string) => api.get<Antivenom>(`/antivenoms/${id}`),
  create: (payload: AntivenomUpsertPayload) => api.post<Antivenom>('/antivenoms', payload),
  update: (id: number | string, payload: AntivenomUpsertPayload) =>
    api.put<Antivenom>(`/antivenoms/${id}`, payload),
  remove: (id: number | string) => api.delete<void>(`/antivenoms/${id}`),
};
