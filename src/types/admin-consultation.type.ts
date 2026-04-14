import type { PaginationMeta } from './api-response';

export type AdminConsultationType = 'Scheduled' | 'Emergency';

export interface AdminConsultationItem {
  consultationId: string;
  type: AdminConsultationType;
  status: string;
  userId: string;
  userName: string | null;
  expertId: string;
  expertName: string | null;
  roomId: string | null;
  startTime: string | null;
  endTime: string | null;
  price: number | null;
  problemDescription: string | null;
  bookingId: string | null;
  bookingStatus: string | null;
  bookedAt: string | null;
  paymentDeadline: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  emergencyRequestId: string | null;
  emergencyRequestStatus: string | null;
  requestedAt: string | null;
  respondedAt: string | null;
  expiresAt: string | null;
  slotStartTime: string | null;
  slotEndTime: string | null;
}

export type AdminConsultationDetailResponse = AdminConsultationItem;

export interface AdminConsultationListResponse {
  items: AdminConsultationItem[];
  meta: PaginationMeta;
}

export interface AdminConsultationFilters {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
  type?: AdminConsultationType;
}
