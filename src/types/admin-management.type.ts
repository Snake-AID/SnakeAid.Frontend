import type { PaginationMeta } from './api-response';
import type {
  GeoPointResponse,
  SnakeAIDetectMediaResponse,
  SnakebiteIncidentStatus,
  SnakeIdentificationContext,
  SnakeSpeciesResponse,
} from './snakebite-incident.type';

export interface AdminAccountReferenceResponse {
  id?: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  role?: string | number;
  isActive?: boolean;
}

export interface AdminIncidentParticipantResponse {
  accountId?: string;
  id?: string;
  userName?: string;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  rating?: number;
  ratingCount?: number;
  emergencyContacts?: string[];
  hasUnderlyingDisease?: boolean;
  account?: AdminAccountReferenceResponse;
}

export interface AdminRescuerParticipantResponse {
  accountId?: string;
  id?: string;
  isOnline?: boolean;
  isAvailable?: boolean;
  phoneNumber?: string | null;
  rating?: number;
  ratingCount?: number;
  type?: string | number;
  lastLocationUpdate?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  totalMissions?: number;
  completedMissions?: number;
  fullName?: string | null;
  account?: AdminAccountReferenceResponse;
}

export interface AdminOperatorParticipantResponse {
  accountId?: string;
  id?: string;
  userName?: string;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  account?: AdminAccountReferenceResponse;
}

export type AdminRoleFilter = 'User' | 'Admin' | 'Expert' | 'Rescuer' | 'Operator';

export interface AdminUserSummaryResponse {
  id: string;
  userName: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  role: number | string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  reputationPoints: number;
  reputationStatus: number | string;
  suspendedUntil: string | null;
  suspensionReason: string | null;
  avatarUrl: string | null;
}

export interface AdminMemberProfileResponse {
  rating: number;
  ratingCount: number;
  hasUnderlyingDisease: boolean;
  emergencyContacts: string[];
}

export interface AdminExpertProfileResponse {
  biography: string;
  isOnline: boolean;
  consultationFee: number;
  emergencyConsultationFee: number | null;
  rating: number;
  ratingCount: number;
}

export interface AdminRescuerProfileResponse {
  isOnline: boolean;
  isAvailable: boolean;
  type: number;
  rating: number;
  ratingCount: number;
  totalMissions: number;
  completedMissions: number;
  lastLocationUpdate: string | null;
}

export interface AdminUserDetailResponse extends AdminUserSummaryResponse {
  memberProfile: AdminMemberProfileResponse | null;
  expertProfile: AdminExpertProfileResponse | null;
  rescuerProfile: AdminRescuerProfileResponse | null;
}

export interface BanUserRequest {
  reason: string;
}

export interface AdminUserListQuery {
  role?: AdminRoleFilter;
  isActive?: boolean;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminIncidentSummaryResponse {
  id: string;
  status: SnakebiteIncidentStatus;
  locationCoordinates: GeoPointResponse;
  createdAt: string;
  address: string | null;
  assignedRescuerId: string | null;
  assignedRescuerName?: string | null;
  activeMissionStatus: string | null;
  needsRedispatch: boolean;
  handlingOperatorId: string | null;
  handlingOperatorName?: string | null;
}

export interface ReportMediaResponse {
  id: string;
  mediaUrl: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  referenceType: number | string;
  purpose: number | string;
  requiresAIProcessing: boolean;
}

export interface RescueMissionMediaGroupResponse {
  missionId: string;
  missionStatus: number | string;
  media: ReportMediaResponse[];
}

export interface AdminIncidentDispatchRequestResponse {
  requestId: string;
  rescuerId: string;
  rescuerName?: string | null;
  rescuerPhone?: string | null;
  operatorId?: string | null;
  operatorName?: string | null;
  status: string | number;
  dispatchedAt: string;
  responseAt: string | null;
  declineReason: string | null;
}

export interface AdminIncidentMissionHistoryResponse {
  missionId: string;
  rescuerId: string;
  rescuerName?: string | null;
  rescuerPhone?: string | null;
  status: string | number;
  price: number;
  actualCost: number | null;
  createdAt: string;
  startedAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  cancellationReason: string | null;
  media: ReportMediaResponse[];
}

export interface AdminIncidentPaymentSummaryResponse {
  payOsOrderCode: number | string | null;
  paymentState: string | number | null;
  paidAmount: number | null;
  paidAt: string | null;
  paymentMethod: string | null;
  paymentExternalTransactionId: string | null;
  totalRefundedAmount: number | null;
  latestRefundedAt: string | null;
}

export interface AdminDetailSnakebiteIncidentResponse {
  id: string;
  createdAt?: string | null;
  locationCoordinates: GeoPointResponse;
  address: string | null;
  status: SnakebiteIncidentStatus | number;
  symptomsReport: Array<{ symptomId: number; symptomName: string; symptomDescription?: string }> | null;
  severityLevel: number | null;
  incidentOccurredAt: string | null;
  assignedAt: string | null;
  assignedRescuerId?: string | null;
  assignedRescuerName?: string | null;
  handlingOperatorId?: string | null;
  handlingOperatorName?: string | null;
  operatorNotes?: string | null;
  confirmedAt?: string | null;
  dispatchedAt?: string | null;
  cancellationReason?: string | null;
  identifiedSnake: SnakeSpeciesResponse | null;
  // Some backend payloads return aiConfidence instead of aIConfidence.
  identificationContext: (SnakeIdentificationContext & { aiConfidence?: number | null }) | null;
  totalDispatchRequests?: number;
  acceptedDispatchCount?: number;
  declinedDispatchCount?: number;
  cancelledDispatchCount?: number;
  user?: AdminIncidentParticipantResponse | null;
  assignedRescuer?: AdminRescuerParticipantResponse | null;
  activeMission?: {
    id: string;
    incidentId: string;
    rescuerId: string;
    status: string | number;
    price: number;
    costFromCenter?: number | null;
    distanceFromCenterKm?: number | null;
    startedAt: string | null;
    arrivedAt: string | null;
    completedAt: string | null;
    notes: string | null;
    cancellationReason: string | null;
    actualCost: number | null;
  } | null;
  totalRescueAttempts?: number;
  failedAttemptsCount?: number;
  incidentMedia?: SnakeAIDetectMediaResponse[];
  media: SnakeAIDetectMediaResponse[];
  missionHistory?: AdminIncidentMissionHistoryResponse[];
  dispatchRequests?: AdminIncidentDispatchRequestResponse[];
  paymentSummary?: AdminIncidentPaymentSummaryResponse | null;
  rescueMissionMedia: RescueMissionMediaGroupResponse[];
}

export interface AdminMissionSummaryResponse {
  id: string;
  incidentId: string;
  rescuerId: string;
  status: string;
  price: number;
  actualCost: number | null;
  costFromCenter: number | null;
  createdAt: string;
  updatedAt: string | null;
  startedAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  incidentStatus: string;
  incidentAddress: string | null;
  rescuerName: string | null;
}

export interface AdminMissionDetailResponse {
  id: string;
  incidentId: string;
  rescuerId: string;
  status: number | string;
  price: number;
  createdAt: string;
  startedAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  updatedAt: string | null;
  notes: string | null;
  cancellationReason: string | null;
  distanceFromCenterKm: number | null;
  costFromCenter: number | null;
  actualCost: number | null;
  distanceKm: number | null;
  missionMedia: ReportMediaResponse[];
  incident: {
    id: string;
    locationCoordinates: GeoPointResponse;
    address: string | null;
    status: number | string;
    symptomsReport: Array<{ symptomId: number; symptomName: string }> | null;
    severityLevel: number | null;
    incidentOccurredAt: string | null;
    assignedAt: string | null;
    identifiedSnake: SnakeSpeciesResponse | null;
    identificationContext: SnakeIdentificationContext | null;
    media: SnakeAIDetectMediaResponse[];
  };
  rescuer: {
    accountId?: string;
    id?: string;
    fullName?: string | null;
    isOnline: boolean;
    isAvailable: boolean;
    phoneNumber: string | null;
    rating: number;
    ratingCount: number;
    type: number | string;
    lastLocationUpdate: string | null;
    latitude: number | null;
    longitude: number | null;
    totalMissions: number;
    completedMissions: number;
    account?: {
      fullName?: string | null;
      avatarUrl?: string | null;
      email?: string | null;
    };
  };
  user: {
    accountId?: string;
    id?: string;
    userName?: string;
    fullName?: string | null;
    email: string | null;
    phoneNumber: string | null;
    rating: number;
    ratingCount: number;
    emergencyContacts: string[];
    hasUnderlyingDisease: boolean;
    account?: {
      fullName?: string | null;
      avatarUrl?: string | null;
      email?: string | null;
    };
  };
}

export interface AdminIncidentListQuery {
  status?: string;
  since?: string;
  until?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminMissionListQuery {
  status?: string;
  since?: string;
  until?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedAdminUsers {
  items: AdminUserSummaryResponse[];
  meta: PaginationMeta;
}

export interface PaginatedAdminIncidents {
  items: AdminIncidentSummaryResponse[];
  meta: PaginationMeta;
}

export interface PaginatedAdminMissions {
  items: AdminMissionSummaryResponse[];
  meta: PaginationMeta;
}
