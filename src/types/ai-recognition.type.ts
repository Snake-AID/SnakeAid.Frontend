import type { PaginationMeta } from './api-response';

export type RecognitionStatus
  = 'Processing'
    | 'Completed'
    | 'Failed'
    | 'ExpertVerified'
    | 'ExpertRejected';

export type MediaReferenceType
  = 'CommunityReport'
    | 'SnakebiteIncident'
    | 'RescueMission'
    | 'SnakeCatchingRequest'
    | 'SnakeCatchingMission';

export type MediaPurpose
  = 'Evidence'
    | 'SnakeIdentification'
    | 'LocationProof'
    | 'InjuryPhoto'
    | 'BeforeAfter'
    | 'SnakeOthers';

export interface AIRecognitionSpeciesLite {
  id: number;
  commonName: string;
}

export interface AIRecognitionAdminReportMediaListItemResponse {
  recognitionResultId: string;
  reportMediaId: string;
  mediaUrl: string;
  contentType: string;
  referenceId: string;
  referenceType: MediaReferenceType | string;
  purpose: MediaPurpose | string;
  aiModelId: number;
  yoloClassName: string;
  confidence: number;
  detectedSpecies: AIRecognitionSpeciesLite | null;
  expertCorrectedSpecies: AIRecognitionSpeciesLite | null;
  expertNotes: string | null;
  expertReviewerName: string | null;
  status: RecognitionStatus | string;
  needsExpertReview: boolean;
  expertVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIRecognitionAdminListQuery {
  page?: number;
  pageSize?: number;
  status?: RecognitionStatus | string;
  minConfidence?: number;
  maxConfidence?: number;
  referenceType?: MediaReferenceType | string;
  from?: string;
  to?: string;
}

export interface PaginatedAIRecognitionAdminList {
  items: AIRecognitionAdminReportMediaListItemResponse[];
  meta: PaginationMeta;
}
