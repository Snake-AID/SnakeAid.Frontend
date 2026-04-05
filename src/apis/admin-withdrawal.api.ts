import type {
  AdminWithdrawalItem,
  ApproveWithdrawalRequest,
  CompleteWithdrawalRequest,
  FailWithdrawalRequest,
  RejectWithdrawalRequest,
} from '@/types/withdrawal.type';
import { api } from './client';

export const adminWithdrawalApi = {
  getAll: () => api.get<AdminWithdrawalItem[]>('/admin/withdrawals'),
  getPending: () => api.get<AdminWithdrawalItem[]>('/admin/withdrawals/pending'),
  getById: (id: string) => api.get<AdminWithdrawalItem>(`/admin/withdrawals/${id}`),
  approve: (id: string, payload: ApproveWithdrawalRequest = {}) =>
    api.post<AdminWithdrawalItem>(`/admin/withdrawals/${id}/approve`, payload),
  reject: (id: string, payload: RejectWithdrawalRequest) =>
    api.post<AdminWithdrawalItem>(`/admin/withdrawals/${id}/reject`, payload),
  complete: (id: string, payload: CompleteWithdrawalRequest = {}) =>
    api.post<AdminWithdrawalItem>(`/admin/withdrawals/${id}/complete`, payload),
  fail: (id: string, payload: FailWithdrawalRequest) =>
    api.post<AdminWithdrawalItem>(`/admin/withdrawals/${id}/fail`, payload),
};
