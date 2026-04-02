export type CommonLevel = 'Rare' | 'Uncommon' | 'Common' | 'VeryCommon' | 'Abundant';

export interface RegionSnakeMappingResponse {
  id: number;
  geographicRegionId: number;
  regionName: string;
  regionCode: string;
  commonLevel: CommonLevel;
  commonLevelValue: number;
  priority: number;
  distributionNotes: string | null;
  isActive: boolean;
}

export interface GeographicRegionResponse {
  id: number;
  name: string;
  code: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  boundaryCoordinates: Array<[number, number]>;
}

export interface CreateRegionSnakeMappingRequest {
  geographicRegionId: number;
  commonLevel: CommonLevel;
  priority: number;
  distributionNotes?: string | null;
}

export interface UpdateRegionSnakeMappingRequest {
  commonLevel?: CommonLevel;
  priority?: number;
  distributionNotes?: string | null;
  isActive?: boolean;
}

export interface SyncRegionSnakeMappingsRequest {
  mappings: Array<{
    geographicRegionId: number;
    commonLevel: CommonLevel;
    priority: number;
    distributionNotes?: string | null;
    isActive?: boolean;
  }>;
}
