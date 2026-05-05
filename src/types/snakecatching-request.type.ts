// Types for Snake Catching Request APIs & SignalR payloads

import type { BriefRescuerProfileResponse } from './operator.type';
import type { GeoPointResponse } from './snakebite-incident.type';

export enum SnakeCatchingRequestStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Assigned = 'Assigned',
  Dispatched = 'Dispatched',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export interface SnakeCatchingRequestMediaItem {
  mediaUrl?: string | null;
  fileName?: string | null;
  contentType?: string | null;
  fileSize?: number | null;
  referenceType?: string | null;
  purpose?: string | null;
  requiresAIProcessing?: boolean | null;
}

export interface SnakeCatchingRequestDetailItem {
  id?: string | null;
  snakeCatchingRequestId?: string | null;
  snakeSpeciesId?: number | null;
  snakeSpeciesName?: string | null;
  snakeSpeciesScientificName?: string | null;
  quantity?: number | null;
}

export interface SnakeCatchingRequestUserProfile {
  userName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  account?: {
    fullName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export interface SnakeCatchingMissionEnvironmentInfo {
  name?: string | null;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
}

export interface SnakeCatchingMissionDetailInfo {
  snakeSpeciesName?: string | null;
  quantity?: number | null;
  price?: number | null;
}

export interface SnakeCatchingMissionInfo {
  id?: string | null;
  status?: string | null;
  price?: number | null;
  startedAt?: string | null;
  arrivedAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  cancellationReason?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  catchingEnvironment?: SnakeCatchingMissionEnvironmentInfo | null;
  missionDetails?: SnakeCatchingMissionDetailInfo[];
  media?: SnakeCatchingRequestMediaItem[];
}

export interface CreateSnakeCatchingRequestResponse {
  id: string;
  userId: string;
  status: SnakeCatchingRequestStatus;
  address?: string | null;
  locationCoordinates?: GeoPointResponse | null;
  additionalDetails?: string | null;
  estimatedPrice?: number | null;
  distanceKm?: number | null;
  requestDate?: string | null;
  preferredTime?: string | null;
  createdAt?: string | null;
  handlingOperatorId?: string | null;
  confirmedAt?: string | null;
  prePaidAt?: string | null;
  isPrePaid?: boolean | null;
  assignedAt?: string | null;
  assignedRescuerId?: string | null;
  assignedRescuer?: BriefRescuerProfileResponse | null;
  dispatchedAt?: string | null;
  cancellationReason?: string | null;
  lat?: number | null;
  lng?: number | null;
  details?: SnakeCatchingRequestDetailItem[];
  media?: SnakeCatchingRequestMediaItem[];
  missions?: SnakeCatchingMissionInfo[];
  user?: SnakeCatchingRequestUserProfile | null;
  // allow extension by backend
  [key: string]: unknown;
}

export interface DetailSnakeCatchingRequestResponse extends CreateSnakeCatchingRequestResponse {
  feedbacks?: unknown[];
}

export interface SnakeCatchingRequestCreatedPayload {
  id: string;
  userId: string;
  status: string;
  address?: string | null;
  lat: number;
  lng: number;
  additionalDetails?: string | null;
  estimatedPrice?: number | null;
  distanceKm?: number | null;
  createdAt?: string | null;
  user: SnakeCatchingRequestUserInfo;
}

export interface SnakeCatchingRequestUserInfo {
  userName?: string | null;
  phoneNumber?: string | null;
}

export interface SnakeCatchingRequestConfirmedPayload {
  id: string;
  status: SnakeCatchingRequestStatus;
  confirmedAt?: string | null;
  prePaidAt?: string | null;
  isPrePaid?: boolean | null;
}

export interface SnakeCatchingRequestAssignedPayload {
  id: string;
  status: SnakeCatchingRequestStatus;
  assignedAt?: string | null;
  assignedRescuerId?: string | null;
  assignedRescuerName?: string | null;
  assignedRescuerPhone?: string | null;
  AssignedRescuerName?: string;
  AssignedRescuerPhone?: string;
  AssignedRescuerId?: string;
  isAvailable?: boolean | null;
}

export interface SnakeCatchingRequestCancelledPayload {
  id: string;
  userId: string;
  status: SnakeCatchingRequestStatus;
  cancellationReason?: string | null;
}

export interface SnakeCatchingMissionAbortedPayload {
  requestId: string;
  missionId: string;
  rescuerId: string;
  operatorUserId?: string | null;
  rescuerName?: string | null;
  reason?: string | null;
  updatedAt: string;
}

export interface SnakeCatchingMissionCompletedPayload {
  requestId: string;
  missionId: string;
  memberUserId: string;
  rescuerUserId: string;
  rescuerName?: string | null;
  actualCost?: number | null;
  completedAt: string;
}

export interface AssignSnakeCatchingRequestPayload {
  rescuerId: string;
}

export interface CancelSnakeCatchingRequestPayload {
  reason: string;
}

export enum CatchingRequestStatus {
  Pending = 'Pending',
  OperatorContacting = 'OperatorContacting',
  Confirmed = 'Confirmed',
  Assigned = 'Assigned',
  Finished = 'Finished',
  Paid = 'Paid',
  Disputed = 'Disputed',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Expired = 'Expired',
}

export enum CatchingRequestPriority {
  Low = 'Low',
  Normal = 'Normal',
  High = 'High',
  Urgent = 'Urgent',
}
