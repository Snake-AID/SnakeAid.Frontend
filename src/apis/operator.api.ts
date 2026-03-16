import type {
  BriefRescuerProfileResponse,
  OnDutyRescuerSnapshotResponse,
  ShiftAssignmentResponse,
} from '@/types/operator.type';
import { api } from './client';

// Operator API endpoints
export const operatorApi = {
  getOnDutyRescuers: (params?: {
    date?: string;
    incidentId?: string;
    onlyAvailable?: boolean;
    maxDistanceKm?: number;
  }) => api.get<OnDutyRescuerSnapshotResponse>('/monitoring/on-duty', { params }),

  getRescuerRegistry: () => api.get<BriefRescuerProfileResponse[]>('/monitoring/rescuers'),

  getRescuerById: (rescuerId: string) => api.get<BriefRescuerProfileResponse>(`/monitoring/rescuers/${rescuerId}`),

  getTodayShiftAssignments: () => api.get<ShiftAssignmentResponse[]>('/monitoring/shift-assignments/today'),
};
