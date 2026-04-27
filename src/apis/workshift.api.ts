import type {
  AssignWorkShiftBulkRequest,
  AssignWorkShiftRequest,
  CreateWorkShiftRequest,
  ShiftAssignmentResponse,
  UpdateShiftAssignmentRequest,
  UpdateWorkShiftRequest,
  WorkShiftResponse,
} from '@/types/workshift.type';
import { api } from './client';

export const workShiftApi = {
  getAllShifts: () => api.get<WorkShiftResponse[]>('/shifts'),

  getShiftById: (shiftId: string) => api.get<WorkShiftResponse>(`/shifts/${shiftId}`),

  createShift: (payload: CreateWorkShiftRequest) => api.post<WorkShiftResponse>('/shifts', payload),

  updateShift: (shiftId: string, payload: UpdateWorkShiftRequest) =>
    api.put<WorkShiftResponse>(`/shifts/${shiftId}`, payload),

  deleteShift: (shiftId: string) => api.delete<void>(`/shifts/${shiftId}`),

  assignOne: (shiftId: string, payload: AssignWorkShiftRequest) =>
    api.post<ShiftAssignmentResponse>(`/shifts/${shiftId}/assign`, payload),

  assignBulk: (shiftId: string, payload: AssignWorkShiftBulkRequest) =>
    api.post<ShiftAssignmentResponse[]>(`/shifts/${shiftId}/assign/bulk`, payload),

  updateAssignment: (assignmentId: string, payload: UpdateShiftAssignmentRequest) =>
    api.put<ShiftAssignmentResponse>(`/shifts/assignments/${assignmentId}`, payload),

  deleteAssignment: (assignmentId: string) => api.delete<void>(`/shifts/assignments/${assignmentId}`),

  checkInAssignment: (assignmentId: string) =>
    api.patch<ShiftAssignmentResponse>(`/shifts/assignments/${assignmentId}/checkin`),

  checkOutAssignment: (assignmentId: string) =>
    api.patch<ShiftAssignmentResponse>(`/shifts/assignments/${assignmentId}/checkout`),

  getAssignmentsByDate: (date: string) =>
    api.get<ShiftAssignmentResponse[]>('/shifts/assignments', { params: { date } }),

  getAssignmentsByDateRange: (startDate: string, endDate: string) =>
    api.get<ShiftAssignmentResponse[]>('/shifts/assignments', {
      params: { startDate, endDate },
    }),

  cloneAssignmentsToNextWeek: (sourceDate: string) =>
    api.post<ShiftAssignmentResponse[]>('/shifts/assignments/clone-next-week', undefined, {
      params: { sourceDate },
    }),
};
