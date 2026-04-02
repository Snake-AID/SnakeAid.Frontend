import type { LessonItem, LessonUpsertPayload } from '@/types/lesson.type';
import { api, ApiClientError } from './client';

const withTypoFallback = async <T>(run: (path: string) => Promise<T>): Promise<T> => {
  try {
    return await run('/lessons');
  } catch (error) {
    if (!(error instanceof ApiClientError)) {
      throw error;
    }

    if (![404, 405, 500].includes(error.statusCode)) {
      throw error;
    }

    return run('/lessions');
  }
};

export const lessonApi = {
  getAll: () => withTypoFallback(path => api.get<LessonItem[]>(path)),
  getById: (id: string) => withTypoFallback(path => api.get<LessonItem>(`${path}/${id}`)),
  create: (payload: LessonUpsertPayload) => withTypoFallback(path => api.post<LessonItem>(path, payload)),
  update: (id: string, payload: LessonUpsertPayload) =>
    withTypoFallback(path => api.put<LessonItem>(`${path}/${id}`, payload)),
  remove: (id: string) => withTypoFallback(path => api.delete<void>(`${path}/${id}`)),
};
