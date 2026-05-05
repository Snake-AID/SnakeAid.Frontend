import type { CreateTreatmentFacilityRequest, TreatmentFacilityResponse, UpdateTreatmentFacilityRequest } from '@/types/treatment-facility.type';
import { api, ApiClientError } from './client';

const endpointCandidates = [
  '/treatment-facilities',
  '/treatmemt-facilities',
] as const;

const withFallback = async <T>(run: (basePath: string) => Promise<T>): Promise<T> => {
  try {
    return await run(endpointCandidates[0]);
  } catch (error) {
    if (!(error instanceof ApiClientError)) {
      throw error;
    }

    // Some environments expose different route spellings or method wiring.
    // Retry the secondary endpoint for route/method/server failures.
    if (![404, 405, 500].includes(error.statusCode)) {
      throw error;
    }

    return run(endpointCandidates[1]);
  }
};

// Treatment Facility API endpoints
export const treatmentFacilityApi = {
  getAllTreatmentFacilities: () => withFallback(path => api.get<TreatmentFacilityResponse[]>(path)),

  getTreatmentFacilityById: (id: number | string) =>
    withFallback(path => api.get<TreatmentFacilityResponse>(`${path}/${id}`)),

  createTreatmentFacility: (data: CreateTreatmentFacilityRequest) =>
    withFallback(path => api.post<TreatmentFacilityResponse>(path, data)),

  updateTreatmentFacility: (id: number | string, data: UpdateTreatmentFacilityRequest) =>
    withFallback(path => api.put<TreatmentFacilityResponse>(`${path}/${id}`, data)),

  deleteTreatmentFacility: (id: number | string) => withFallback(path => api.delete<void>(`${path}/${id}`)),

  findNearestHospitals: (latitude: number, longitude: number) =>
    api.get<TreatmentFacilityResponse[]>('/treatment-facilities/find-hospital', {
      params: { latitude, longitude },
    }),
};
