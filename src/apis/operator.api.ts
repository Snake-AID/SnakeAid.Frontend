import type {
  BriefRescuerProfileResponse,
  OffDutyRescuerSnapshotResponse,
  OnDutyRescuerSnapshotResponse,
  ShiftAssignmentResponse,
} from '@/types/operator.type';
import { api } from './client';

// Operator API endpoints
export const operatorApi = {
  getOnDutyRescuers: (params?: {
    date?: string;
    incidentId?: string;
    catchingRequestId?: string;
    onlyAvailable?: boolean;
    maxDistanceKm?: number;
  }) => api.get<OnDutyRescuerSnapshotResponse>('/monitoring/on-duty', { params }),

  getOffDutyRescuers: (params?: {
    incidentId?: string;
    catchingRequestId?: string;
    maxDistanceKm?: number;
  }) => api.get<OffDutyRescuerSnapshotResponse>('/monitoring/off-duty', { params }),

  getOnlineRescuers: () => api.get<BriefRescuerProfileResponse[]>('/monitoring/online-rescuers'),

  getRescuerRegistry: () => api.get<BriefRescuerProfileResponse[]>('/monitoring/rescuers'),

  getRescuerById: (rescuerId: string) => api.get<BriefRescuerProfileResponse>(`/monitoring/rescuers/${rescuerId}`),

  getTodayShiftAssignments: () => api.get<ShiftAssignmentResponse[]>('/monitoring/shift-assignments/today'),
};
