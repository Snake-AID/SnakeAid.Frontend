import type { OperatorIncidentSummaryResponse } from '@/types/operator.type';
import type {
  CreateIncidentResponse,
  DetailSnakebiteIncidentResponse,
  DispatchIncidentRequest,
  MarkFalseAlarmRequest,
  ReportNoAnswerRequest,
} from '@/types/snakebite-incident.type';
import { api } from './client';

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

  /**
   * Cancel a dispatch request for an incident.
   * This allows the operator to cancel a rescue mission and reassign to another rescuer.
   * TODO: Backend endpoint needs to be implemented.
   */
  cancelDispatch: (incidentId: string) =>
    api.post<CreateIncidentResponse>(`/incidents/${incidentId}/cancel-dispatch`),
};
