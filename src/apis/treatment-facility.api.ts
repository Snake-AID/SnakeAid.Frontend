import type { CreateTreatmentFacilityRequest, TreatmentFacilityResponse, UpdateTreatmentFacilityRequest } from '@/types/treatment-facility.type';
import { api } from './client';

// Treatment Facility API endpoints
export const treatmentFacilityApi = {
  getAllTreatmentFacilities: () => api.get<TreatmentFacilityResponse[]>('/treatment-facilities'),

  createTreatmentFacility: (data: CreateTreatmentFacilityRequest) => api.post<TreatmentFacilityResponse>('/treatment-facilities', { body: data }),

  updateTreatmentFacility: (id: number, data: Partial<UpdateTreatmentFacilityRequest>) => api.put<TreatmentFacilityResponse>(`/treatment-facilities/${id}`, { body: data }),

  deleteTreatmentFacility: (id: number) => api.delete(`/treatment-facilities/${id}`),
};
