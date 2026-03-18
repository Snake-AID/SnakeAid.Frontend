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
export interface SnakeCatchingRequestCreatedPayload {
  id: string;
  status: string;
  userId: string;
  handlingOperatorId?: string | null;
  assignedRescuerId?: string | null;
  assignedAt?: string | null;
  confirmedAt?: string | null;
  dispatchedAt?: string | null;
  cancellationReason?: string | null;
  estimatedPrice?: number | null;
  distanceKm?: number | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  priority?: string | null;
  requestDate?: string | null;
  preferredTime?: string | null;
  // additional fields may exist; allow extensional data
  [key: string]: unknown;
}

export interface SnakeCatchingRequestAcceptedPayload extends SnakeCatchingRequestCreatedPayload {}
export interface SnakeCatchingRequestAssignedPayload extends SnakeCatchingRequestCreatedPayload {}
export interface SnakeCatchingRequestCancelledPayload extends SnakeCatchingRequestCreatedPayload {
  // Cancel payload may contain additional fields (e.g. cancellationReason)
  cancellationReason?: string | null;
}
