export interface VenomType {
  id: number;
  name: string;
  scientificName: string;
  description: string;
  isActive: boolean;
  severityIndex: number;
  firstAidGuidelineId: number;
  createdAt: string;
  updatedAt: string;
}

export interface VenomTypeUpsertPayload {
  name: string;
  scientificName: string;
  description: string;
  isActive: boolean;
  severityIndex: number;
  firstAidGuidelineId: number;
}
