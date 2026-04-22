import type { OperatorSnakeCatchingRequestSummaryResponse } from '@/types/operator.type';
import type {
  AssignSnakeCatchingRequestPayload,
  CancelSnakeCatchingRequestPayload,
  CreateSnakeCatchingRequestResponse,
  DetailSnakeCatchingRequestResponse,
} from '@/types/snakecatching-request.type';
import { api } from './client';

export const snakeCatchingRequestApi = {
  getActiveRequests: (params?: {
    status?: string;
    since?: string;
    until?: string;
    page?: number;
    pageSize?: number;
  }) => api.getPaginated<OperatorSnakeCatchingRequestSummaryResponse>('/snakecatching/requests/active', { params }),

  getRequests: (params?: { status?: string; page?: number; pageSize?: number }) =>
    api.getPaginated<CreateSnakeCatchingRequestResponse>('/snakecatching/requests', { params }),

  getRequest: (requestId: string) =>
    api.get<DetailSnakeCatchingRequestResponse>(`/snakecatching/requests/${requestId}`),

  confirmRequest: (requestId: string) =>
    api.patch<CreateSnakeCatchingRequestResponse>(`/snakecatching/requests/confirm/${requestId}`),

  assignRequest: (requestId: string, payload: AssignSnakeCatchingRequestPayload) =>
    api.post<CreateSnakeCatchingRequestResponse>(`/snakecatching/requests/assign/${requestId}`, payload),

  cancelRequest: (requestId: string, payload: CancelSnakeCatchingRequestPayload) =>
    api.patch<DetailSnakeCatchingRequestResponse>(`/snakecatching/requests/cancel/${requestId}`, payload),

  abortMission: (missionId: string, payload: { reason: string }) =>
    api.patch<DetailSnakeCatchingRequestResponse>(`/snakecatching/missions/${missionId}/abort`, payload),
};
