import type {
  AdminDetailSnakebiteIncidentResponse,
  AdminIncidentListQuery,
  AdminIncidentSummaryResponse,
  AdminMissionDetailResponse,
  AdminMissionListQuery,
  AdminMissionSummaryResponse,
} from '@/types/admin-management.type';
import type { OperatorIncidentSummaryResponse } from '@/types/operator.type';
import type {
  CreateIncidentResponse,
  DetailSnakebiteIncidentResponse,
  DispatchIncidentRequest,
  DispatchRequestItem,
  MarkFalseAlarmRequest,
  ReportNoAnswerRequest,
} from '@/types/snakebite-incident.type';
import { api, ApiClientError } from './client';

export const incidentApi = {
  /**
   * Back-end endpoint for operator dashboard: active (non-finished) incidents.
   * Supports optional filtering via query params (status, since, until, pagination).
   */
  getActiveIncidents: (params?: {
    status?: string;
    since?: string;
    until?: string;
    page?: number;
    pageSize?: number;
  }) => api.getPaginated<OperatorIncidentSummaryResponse>('/incidents/active', { params }),

  getIncidents: () => api.get<DetailSnakebiteIncidentResponse[]>('/incidents'),

  getIncident: (incidentId: string) =>
    api.get<DetailSnakebiteIncidentResponse>(`/incidents/${incidentId}`),

  confirmIncident: (incidentId: string) =>
    api.post<CreateIncidentResponse>(`/incidents/${incidentId}/confirm`),

  markFalseAlarm: (incidentId: string, payload: MarkFalseAlarmRequest) =>
    api.post<CreateIncidentResponse>(`/incidents/${incidentId}/false-alarm`, payload),

  reportNoAnswer: (incidentId: string, payload: ReportNoAnswerRequest) =>
    api.post<CreateIncidentResponse>(`/incidents/${incidentId}/no-answer`, payload),

  dispatchIncident: (incidentId: string, payload: DispatchIncidentRequest) =>
    api.post<CreateIncidentResponse>(`/incidents/${incidentId}/dispatch`, payload),

  getDispatchRequests: (incidentId: string) =>
    api.get<DispatchRequestItem[]>(`/incidents/${incidentId}/dispatch-requests`),

  cancelDispatchRequest: (requestId: string) =>
    api.post<{ requestId: string; rejectedAt: string; message: string }>(
      `/incidents/dispatch-requests/${requestId}/cancel`,
    ),

  getAdminIncidentList: (params?: AdminIncidentListQuery) =>
    api.getPaginated<AdminIncidentSummaryResponse>('/incidents/admin/list', { params }),

  getAdminMissionList: (params?: AdminMissionListQuery) =>
    api.getPaginated<AdminMissionSummaryResponse>('/rescue-missions/admin/list', { params }),

  getAdminMissionDetail: (missionId: string, params?: { rescuerLat?: number; rescuerLng?: number }) =>
    api.get<AdminMissionDetailResponse>(`/rescue-missions/${missionId}`, { params }),

  getAdminIncidentDetail: async (incidentId: string) => {
    try {
      return await api.get<AdminDetailSnakebiteIncidentResponse>(`/incidents/admin/${incidentId}`);
    } catch (error) {
      if (error instanceof ApiClientError && (error.statusCode === 404 || error.statusCode === 405)) {
        try {
          return await api.get<AdminDetailSnakebiteIncidentResponse>(`/incidents/${incidentId}`);
        } catch (legacyError) {
          if (!(legacyError instanceof ApiClientError) || legacyError.statusCode !== 404) {
            throw legacyError;
          }

          return api.get<AdminDetailSnakebiteIncidentResponse>(`/snakebite-incidents/${incidentId}`);
        }
      }

      if (error instanceof ApiClientError && error.statusCode === 400) {
        return api.get<AdminDetailSnakebiteIncidentResponse>(`/snakebite-incidents/${incidentId}`);
      }

      throw error;
    }
  },

  /**
   * Operator forcefully aborts an active rescue mission (Preparing or EnRoute).
   * PATCH /api/rescue-missions/{missionId}/operator-abort
   * Backend sẽ: set Mission -> MissionAborted, Incident -> Verified, clear AssignedRescuerId.
   */
  operatorAbortMission: (missionId: string, payload: { cancellationReason: string }) =>
    api.patch<void>(`/rescue-missions/${missionId}/operator-abort`, payload),
};
