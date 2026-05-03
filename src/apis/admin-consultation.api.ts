import type {
  AdminConsultationDetailResponse,
  AdminConsultationFilters,
  AdminConsultationListResponse,
} from '@/types/admin-consultation.type';
import { api } from './client';

const toQueryParams = (filters: AdminConsultationFilters) => {
  const params: Record<string, string | number> = {
    pageNumber: filters.pageNumber ?? 1,
    pageSize: filters.pageSize ?? 10,
  };

  if (filters.status?.trim()) {
    params.status = filters.status.trim();
  }

  if (filters.type) {
    params.type = filters.type;
  }

  return params;
};

export const adminConsultationApi = {
  getPaged: (filters: AdminConsultationFilters = {}) =>
    api.get<AdminConsultationListResponse>('/admin/consultations', {
      params: toQueryParams(filters),
    }),

  getDetail: (consultationId: string) =>
    api.get<AdminConsultationDetailResponse>(`/admin/consultations/${consultationId}`),

  confirmExpertAbsentHandled: (consultationId: string) =>
    api.post<AdminConsultationDetailResponse>(
      `/admin/consultations/${consultationId}/expert-absent/confirm-handled`,
    ),
};
