export type SymptomConfigGroupName = 'BACKGROUND' | 'LOCAL' | 'CRITICAL';

export type SymptomConfigAttributeKey
  = | 'AGE_GROUP'
    | 'MEDICAL_HISTORY'
    | 'BITE_LOCATION'
    | 'SYMPTOM_LOCAL'
    | 'CORE_SIGNS';

export type SymptomCategory = 1 | 2;

export interface TimeScorePoint {
  minMinutes: number;
  maxMinutes: number;
  score: number;
}

export interface SymptomOptionResponse {
  id: number;
  name: string;
  description?: string | null;
  isCritical: boolean;
  alertMessage?: string | null;
  category: SymptomCategory;
  categoryDisplay?: string | null;
  timeScoreList?: TimeScorePoint[] | null;
  isActive: boolean;
}

export interface GroupedSymptomConfigResponse {
  groupName: SymptomConfigGroupName;
  attributeKey: SymptomConfigAttributeKey;
  attributeLabel: string;
  displayOrder: number;
  options: SymptomOptionResponse[];
}

export interface SymptomConfigResponse {
  id: number;
  groupName: SymptomConfigGroupName;
  attributeKey: SymptomConfigAttributeKey;
  attributeLabel: string;
  displayOrder: number;
  name: string;
  description?: string | null;
  isCritical: boolean;
  alertMessage?: string | null;
  category: SymptomCategory;
  categoryDisplay?: string | null;
  timeScoreList?: TimeScorePoint[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SymptomConfigUpsertPayload {
  groupName: SymptomConfigGroupName;
  attributeKey: SymptomConfigAttributeKey;
  attributeLabel: string;
  displayOrder: number;
  name: string;
  description?: string | null;
  isCritical?: boolean;
  alertMessage?: string | null;
  category: SymptomCategory;
  timeScoreList?: TimeScorePoint[] | null;
  isActive?: boolean;
}

export interface SymptomConfigListMeta {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface SymptomConfigListResponse {
  items: SymptomConfigResponse[];
  meta: SymptomConfigListMeta;
}

export interface SymptomConfigListFilters {
  groupName?: string;
  attributeKey?: string;
  name?: string;
  category?: number;
  isActive?: boolean;
  isCritical?: boolean;
  pageNumber?: number;
  pageSize?: number;
}
