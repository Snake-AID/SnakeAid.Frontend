// SignalR event payload types used by the frontend

export interface RescuerOnlineStatusPayload {
  rescuerId: string;
  isOnline: boolean;
  isAvailable: boolean;
  updatedAt: string; // ISO date string
}

export interface RescuerIdleLocationUpdatedPayload {
  rescuerId: string;
  latitude: number;
  longitude: number;
  updatedAt: string; // ISO date string
}

export interface RescuerAcceptedPayload {
  // Expected fields from AcceptDispatchRequestAsync result (likely camelCase)
  requestId?: string;
  rescuerId?: string;
  missionId?: string;
  // Additional fields may exist depending on backend response
  [key: string]: unknown;
}

export interface RescuerDeclinedPayload {
  requestId?: string;
  rescuerId?: string;
  reason?: string;
  declinedAt?: string; // ISO date string
  [key: string]: unknown;
}

export interface NewIncidentCreatedPayload {
  incidentId: string;
  memberId: string;
  latitude: number;
  longitude: number;
  isNewIncident: boolean;
  updatedAt: string; // ISO date string
}

export interface OperatorOnlineStatusPayload {
  operatorId: string;
  isOnDuty: boolean;
  updatedAt: string; // ISO date string
}

export interface AdminLogPayload {
  type: string;
  userId?: string;
  rescuer?: Record<string, unknown>;
  message: string;
  timestamp: string; // ISO date string
}

export interface IncidentClaimedPayload {
  incidentId: string;
  operatorId: string;
  updatedAt: string;
}

export interface OperatorContactingPayload {
  incidentId: string;
  operatorId: string;
  updatedAt: string;
}

export interface DispatchRequestedPayload {
  incidentId: string;
  rescuerId: string;
  operatorId: string;
  requestedAt: string;
}

export interface IncidentFalseAlarmPayload {
  incidentId: string;
  operatorId: string;
  reason?: string;
  updatedAt: string;
}

export interface IncidentNoAnswerPayload {
  incidentId: string;
  operatorId: string;
  reason?: string;
  continueCalling: boolean;
  updatedAt: string;
}

export interface RescuerDispatchedPayload {
  incidentId: string;
  rescuerId: string;
  updatedAt: string;
}

export interface IncidentCancelledPayload {
  incidentId: string;
  reason?: string;
  updatedAt: string;
}

export interface RescuerAbortedPayload {
  incidentId: string;
  rescuerId: string;
  reason?: string;
  updatedAt: string;
}

// Snake catching request event payloads (RescuerHub)
export interface SnakeCatchingRequestUserInfo {
  userName?: string | null;
  phoneNumber?: string | null;
}

export interface SnakeCatchingRequestCreatedPayload {
  id: string;
  userId: string;
  status: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  additionalDetails?: string | null;
  estimatedPrice?: number | null;
  distanceKm?: number | null;
  createdAt?: string | null;
  user?: SnakeCatchingRequestUserInfo | null;
  // additional fields may exist; allow extensional data
  [key: string]: unknown;
}

export interface SnakeCatchingRequestAcceptedPayload {
  id: string;
  status: string;
  confirmedAt?: string | null;
  prePaidAt?: string | null;
  isPrePaid: boolean;
  // additional fields may exist
  [key: string]: unknown;
}

export interface SnakeCatchingRequestAssignedPayload {
  id: string;
  status: string;
  assignedAt?: string | null;
  assignedRescuerId?: string | null;
  assignedRescuerName?: string | null;
  assignedRescuerPhone?: string | null;
  // additional fields may exist
  [key: string]: unknown;
}

export interface SnakeCatchingRequestCancelledPayload {
  id: string;
  userId: string;
  status: string;
  cancellationReason?: string | null;
}
