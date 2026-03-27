import type { FirstAidGuideline } from '@/types/first-aid-guideline.type';
import { api } from './client';

export const firstAidGuidelineApi = {
  getAll: () => api.get<FirstAidGuideline[]>('/first-aid-guidelines'),
  getById: (id: number | string) => api.get<FirstAidGuideline>(`/first-aid-guidelines/${id}`),
};
