export interface TreatmentFacilityResponse {
  id: number;
  name: string;
  address: string;
  contactNumber: string;
  distanceKm: number;
  latitude: number;
  longitude: number;
}

export interface UpdateTreatmentFacilityRequest {
  name: string;
  address: string;
  contactNumber: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
}

export interface CreateTreatmentFacilityRequest {
  name: string;
  address: string;
  contactNumber: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
}
