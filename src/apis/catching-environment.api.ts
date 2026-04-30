import type {
  CatchingEnvironment,
  CatchingEnvironmentUpsertPayload,
} from '@/types/catching-environment.type';
import { api } from './client';

export const catchingEnvironmentApi = {
  getAll: () => api.get<CatchingEnvironment[]>('/catchingenvironments'),

  getById: (id: number | string) =>
    api.get<CatchingEnvironment>(`/catchingenvironments/${id}`),

  create: (payload: CatchingEnvironmentUpsertPayload) =>
    api.post<CatchingEnvironment>('/catchingenvironments', payload),

  update: (id: number | string, payload: CatchingEnvironmentUpsertPayload) =>
    api.put<CatchingEnvironment>(`/catchingenvironments/${id}`, payload),

  remove: (id: number | string) =>
    api.delete<void>(`/catchingenvironments/${id}`),
};
