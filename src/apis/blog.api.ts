import type {
  BlogDetail,
  BlogStatusUpdatePayload,
  BlogSummary,
  BlogUpsertPayload,
} from '@/types/blog.type';
import { api } from './client';

export const blogApi = {
  getAll: (params?: { status?: string }) =>
    api.get<BlogSummary[]>('/blogs', { params }),

  getById: (id: string) =>
    api.get<BlogDetail>(`/blogs/${id}`),

  create: (payload: BlogUpsertPayload) =>
    api.post<BlogDetail>('/blogs', payload),

  update: (id: string, payload: BlogUpsertPayload) =>
    api.put<BlogDetail>(`/blogs/${id}`, payload),

  remove: (id: string) =>
    api.delete<void>(`/blogs/${id}`),

  updateStatus: (id: string, payload: BlogStatusUpdatePayload) =>
    api.patch<BlogDetail>(`/blogs/${id}/status`, payload),
};
