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

export interface CreateSnakeCatchingRequestResponse {
  id: string;
  userId: string;
  status: SnakeCatchingRequestStatus;
  address?: string | null;
  locationCoordinates?: GeoPointResponse | null;
  additionalDetails?: string | null;
  estimatedPrice?: number | null;
  distanceKm?: number | null;
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
  details?: string | null;
  media?: unknown[];
  missions?: unknown[];
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
  assignedRescuerId: string;
  AssignedRescuerName: string;
  AssignedRescuerPhone: string;
}

export interface SnakeCatchingRequestCancelledPayload {
  id: string;
  userId: string;
  status: SnakeCatchingRequestStatus;
  cancellationReason?: string | null;
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
