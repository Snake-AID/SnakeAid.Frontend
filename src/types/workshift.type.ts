import type { UserInfo } from './auth.type';

export type ShiftAssignmentStatus = 'Scheduled' | 'Active' | 'Completed' | 'Cancelled' | 'NoShow';

export interface WorkShiftResponse {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  requiredRescuers: number;
  isActive: boolean;
}

export interface CreateWorkShiftRequest {
  name: string;
  startTime: string;
  endTime: string;
  requiredRescuers: number;
}

export interface UpdateWorkShiftRequest {
  name: string;
  startTime: string;
  endTime: string;
  requiredRescuers: number;
  isActive: boolean;
}

export interface AssignWorkShiftRequest {
  rescuerId: string;
  date: string;
  notes?: string;
}

export interface AssignWorkShiftBulkRequest {
  rescuerIds: string[];
  date: string;
  notes?: string;
}

export interface UpdateShiftAssignmentRequest {
  rescuerId: string;
  date: string;
  notes?: string;
  status?: ShiftAssignmentStatus;
}

export interface ShiftAssignmentRescuerResponse {
  accountId: string;
  userInfo?: UserInfo;
  isOnline?: boolean;
  phoneNumber?: string | null;
  rating?: number;
  type?: string;
  lastLocationUpdate?: string | null;
}

export interface ShiftAssignmentResponse {
  id: string;
  rescuerId: string;
  shiftId: string;
  shiftStartLocal: string;
  shiftEndLocal: string;
  checkInAtUtc: string | null;
  checkOutAtUtc: string | null;
  status: ShiftAssignmentStatus;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  notes: string | null;
  shift?: WorkShiftResponse;
  rescuer?: ShiftAssignmentRescuerResponse;
}
