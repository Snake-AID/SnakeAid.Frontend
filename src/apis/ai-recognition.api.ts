import type {
  AIRecognitionAdminListQuery,
  AIRecognitionAdminReportMediaListItemResponse,
} from '@/types/ai-recognition.type';
import { api } from './client';

export const aiRecognitionApi = {
  getAdminList: (params?: AIRecognitionAdminListQuery) =>
    api.getPaginated<AIRecognitionAdminReportMediaListItemResponse>('/admin/ai-recognition-report-media', { params }),

  getAdminDetail: (recognitionResultId: string) =>
    api.get<AIRecognitionAdminReportMediaListItemResponse>(`/admin/ai-recognition-report-media/${recognitionResultId}`),
};
