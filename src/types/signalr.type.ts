// SignalR event payload types used by the frontend

export interface RescuerOnlineStatusPayload {
  rescuerId: string;
  isOnline: boolean;
  isAvailable: boolean;
  inMission?: boolean; // Added to track when rescuer is in active mission
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
  address?: string | null;
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
  operatorId?: string | null;
  reason?: string;
  updatedAt: string;
}

export interface RescuerMissionLocationUpdatedPayload {
  incidentId: string;
  rescuerId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export interface MissionCompletedPayload {
  incidentId: string;
  rescuerId: string;
  completedAt: string;
}

export interface IncidentCompletedPayload {
  incidentId: string;
  rescuerId: string;
  completedAt: string;
}
