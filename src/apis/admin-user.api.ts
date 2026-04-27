import type {
  AdminCreateRescuerRequest,
  AdminUserDetailResponse,
  AdminUserListQuery,
  AdminUserSummaryResponse,
  BanUserRequest,
} from '@/types/admin-management.type';
import { api } from './client';

export const adminUserApi = {
  getList: (params?: AdminUserListQuery) =>
    api.getPaginated<AdminUserSummaryResponse>('/admin/users/list', { params }),

  getDetail: (userId: string) =>
    api.get<AdminUserDetailResponse>(`/admin/users/${userId}`),

  banUser: (userId: string, payload: BanUserRequest) =>
    api.post<AdminUserDetailResponse>(`/admin/users/${userId}/ban`, payload),

  unbanUser: (userId: string) =>
    api.post<AdminUserDetailResponse>(`/admin/users/${userId}/unban`),

  createRescuer: (payload: AdminCreateRescuerRequest) =>
    api.post<AdminUserDetailResponse>('/admin/users/create-rescuer', payload),
};
