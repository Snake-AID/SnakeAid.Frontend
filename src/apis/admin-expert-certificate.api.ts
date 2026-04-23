import type {
  AdminCreateExpertCertificateRequest,
  AdminUpdateExpertCertificateRequest,
  ExpertCertificateResponse,
} from '@/types/expert-certificate.type';
import { api } from './client';

export const adminExpertCertificateApi = {
  getList: (params?: {
    pageNumber?: number;
    pageSize?: number;
    expertId?: string;
    verificationStatus?: string;
  }) => {
    return api.getPaginated<ExpertCertificateResponse>('/admin/expert/certificates', { params });
  },

  getDetail: (certificateId: string) => {
    return api.get<ExpertCertificateResponse>(`/admin/expert/certificates/${certificateId}`);
  },

  create: (data: AdminCreateExpertCertificateRequest) => {
    return api.post<ExpertCertificateResponse>('/admin/expert/certificates', data);
  },

  update: (certificateId: string, data: AdminUpdateExpertCertificateRequest) => {
    return api.put<ExpertCertificateResponse>(`/admin/expert/certificates/${certificateId}`, data);
  },

  delete: (certificateId: string) => {
    return api.delete<void>(`/admin/expert/certificates/${certificateId}`);
  },
};
