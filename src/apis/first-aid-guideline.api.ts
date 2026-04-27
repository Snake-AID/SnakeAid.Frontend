import type {
  FirstAidGuideline,
  FirstAidGuidelineListParams,
  FirstAidGuidelineListResult,
  FirstAidGuidelineUpsertPayload,
  UpdateFirstAidGuidelinePayload,
} from '@/types/first-aid-guideline.type';
import { api } from './client';

const toQueryString = (params: FirstAidGuidelineListParams) => {
  const query = new URLSearchParams();

  if (params.name?.trim()) {
    query.set('Name', params.name.trim());
  }

  if (params.type) {
    query.set('Type', params.type);
  }

  if (params.pageNumber != null) {
    query.set('PageNumber', String(params.pageNumber));
  }

  if (params.pageSize != null) {
    query.set('PageSize', String(params.pageSize));
  }

  return query.toString();
};

const normalizePagedResult = (raw: any): FirstAidGuidelineListResult => {
  const items = Array.isArray(raw?.items) ? raw.items as FirstAidGuideline[] : [];
  const meta = raw?.meta;

  if (meta) {
    return {
      items,
      totalCount: Number(meta.total_items ?? items.length ?? 0),
      page: Number(meta.current_page ?? 1),
      pageSize: Number(meta.page_size ?? items.length ?? 10),
    };
  }

  return {
    items: Array.isArray(raw) ? raw as FirstAidGuideline[] : items,
    totalCount: Number(raw?.totalCount ?? raw?.total_count ?? items.length ?? 0),
    page: Number(raw?.page ?? raw?.currentPage ?? 1),
    pageSize: Number(raw?.pageSize ?? raw?.page_size ?? 10),
  };
};

export const firstAidGuidelineApi = {
  getAll: () => api.get<FirstAidGuideline[]>('/first-aid-guidelines'),
  getById: (id: number | string) => api.get<FirstAidGuideline>(`/first-aid-guidelines/${id}`),
  list: async (params: FirstAidGuidelineListParams = {}): Promise<FirstAidGuidelineListResult> => {
    const query = toQueryString(params);
    const url = query.length > 0 ? `/first-aid-guidelines?${query}` : '/first-aid-guidelines';
    const response = await api.get<any>(url);
    return normalizePagedResult(response);
  },
  create: (payload: FirstAidGuidelineUpsertPayload) =>
    api.post<FirstAidGuideline>('/first-aid-guidelines', payload),
  update: (id: number | string, payload: UpdateFirstAidGuidelinePayload) =>
    api.put<FirstAidGuideline>(`/first-aid-guidelines/${id}`, payload),
  remove: (id: number | string) => api.delete<void>(`/first-aid-guidelines/${id}`),
};
