import type { UserInfo } from './auth.type';
import type { GeoPointResponse, RescueMissionStatus, SnakebiteIncidentStatus } from './snakebite-incident.type';
import type { CatchingRequestPriority, CatchingRequestStatus } from './snakecatching-request.type';

export interface BriefRescuerProfileResponse {
  accountId: string;
  isOnline: boolean;
  phoneNumber: string;
  rating: number;
  ratingCount: number;
  type: RescuerType;
  lastLocationUpdate: string | null;
  totalMissions: number;
  completedMissions: number;
  account: UserInfo;
}

export enum RescuerType {
  Emergency = 'Emergency',
  Catching = 'Catching',
  Both = 'Both',
}

export interface OnDutyRescuerSnapshotResponse {
  contextId: string | null;
  date: Date;
  snapshotAt: string;
  rescuers: OnDutyRescuerItemResponse[];
}

export interface OnDutyRescuerItemResponse {
  rescuerId: string;
  fullName: string;
  phoneNumber: string | null;
  isOnline: boolean;
  isAvailable: boolean;
  isOnDutyNow: boolean;
  assignmentStatus: string;
  shiftAssignmentId: string;
  shiftId: string;
  shiftName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  shiftDate: Date;
  latitude: number | null;
  longitude: number | null;
  lastLocationUpdate: string | null;
  distanceKm: number | null;
}

export interface ShiftAssignmentResponse {
  id: string;
  rescuerId: string;
  shiftId: string;
  date: Date;
  status: ShiftAssignmentStatus;
  checkInAt: string | null;
  checkOutAt: string | null;
  notes: string | null;
  shift: WorkShiftResponse;
}

export enum ShiftAssignmentStatus {
  Scheduled = 'Scheduled',
  Active = 'Active',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  NoShow = 'NoShow',
}

export interface WorkShiftResponse {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  requiredRescuers: number;
}

export interface OperatorIncidentSummaryResponse {
  id: string;
  status: SnakebiteIncidentStatus;
  locationCoordinates: GeoPointResponse;
  createdAt: string;
  assignedRescuerId: string | null;
  activeMissionStatus: RescueMissionStatus | null;
  needsRedispatch: boolean;
  handlingOperatorId: string | null;
}

export interface OperatorSnakeCatchingRequestSummaryResponse {
  id: string;
  status: CatchingRequestStatus;
  locationCoordinates: GeoPointResponse;
  requestDate: string;
  assignedRescuerId: string | null;
  handlingOperatorId: string | null;
  priority: CatchingRequestPriority | null;
}
