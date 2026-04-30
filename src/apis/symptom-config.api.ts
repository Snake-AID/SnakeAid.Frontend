import type {
  SymptomConfigListFilters,
  SymptomConfigListResponse,
  SymptomConfigResponse,
  SymptomConfigUpsertPayload,
} from '@/types/symptom-config.type';
import { api } from './client';

const toQueryParams = (filters: SymptomConfigListFilters) => {
  const params: Record<string, string | number | boolean> = {
    pageNumber: filters.pageNumber ?? 1,
    pageSize: filters.pageSize ?? 10,
  };

  if (filters.groupName?.trim()) {
    params.groupName = filters.groupName.trim();
  }

  if (filters.attributeKey?.trim()) {
    params.attributeKey = filters.attributeKey.trim();
  }

  if (filters.name?.trim()) {
    params.name = filters.name.trim();
  }

  if (filters.category != null) {
    params.category = filters.category;
  }

  if (filters.isActive != null) {
    params.isActive = filters.isActive;
  }

  if (filters.isCritical != null) {
    params.isCritical = filters.isCritical;
  }

  return params;
};

export const symptomConfigApi = {
  list: (filters: SymptomConfigListFilters = {}) =>
    api.get<SymptomConfigListResponse>('/symptom-configs/filter', {
      params: toQueryParams(filters),
    }),

  getById: (id: number | string) =>
    api.get<SymptomConfigResponse>(`/symptom-configs/${id}`),

  create: (payload: SymptomConfigUpsertPayload) =>
    api.post<SymptomConfigResponse>('/symptom-configs', payload),

  update: (id: number | string, payload: SymptomConfigUpsertPayload) =>
    api.put<SymptomConfigResponse>(`/symptom-configs/${id}`, payload),

  remove: (id: number | string) =>
    api.delete<void>(`/symptom-configs/${id}`),
};
