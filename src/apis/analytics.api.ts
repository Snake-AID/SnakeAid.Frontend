import type {
  AnalyticsParams,
  CasesAnalytics,
  CommissionAnalytics,
  ProfitAnalytics,
  RecentCatchingRequestItem,
  RecentIncidentsResponse,
  RevenueAnalytics,
  UsersAnalytics,
} from '@/types/analytics.type';
import { api } from './client';

const buildQuery = (params: AnalyticsParams): string => {
  const q = new URLSearchParams({
    period: params.period,
    from: params.from,
    to: params.to,
  });
  return q.toString();
};

export const analyticsApi = {
  getUsers: (params: AnalyticsParams) =>
    api.get<UsersAnalytics>(`/admin/analytics/users?${buildQuery(params)}`),

  getCases: (params: AnalyticsParams) =>
    api.get<CasesAnalytics>(`/admin/analytics/cases?${buildQuery(params)}`),

  getRevenue: (params: AnalyticsParams) =>
    api.get<RevenueAnalytics>(`/admin/analytics/revenue?${buildQuery(params)}`),

  getCommission: (params: AnalyticsParams) =>
    api.get<CommissionAnalytics>(`/admin/analytics/commission?${buildQuery(params)}`),

  getProfit: (params: AnalyticsParams) =>
    api.get<ProfitAnalytics>(`/admin/analytics/profit?${buildQuery(params)}`),

  getRecentIncidents: () =>
    api.get<RecentIncidentsResponse>('/incidents/admin/list'),

  getRecentCatchingRequests: () =>
    api.get<RecentCatchingRequestItem[]>('/snakecatching/requests'),
};
