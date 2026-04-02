import type {
  TransactionItem,
  TransactionListFilters,
  TransactionListResponse,
} from '@/types/transaction.type';
import { api } from './client';

const toQueryParams = (filters: TransactionListFilters) => {
  const params: Record<string, string | number> = {
    PageNumber: filters.pageNumber ?? 1,
    PageSize: filters.pageSize ?? 10,
  };

  const normalizedUserName = filters.userName?.trim();
  if (normalizedUserName) {
    params.UserName = normalizedUserName;
  }

  if (filters.transType) {
    params.TransType = filters.transType;
  }

  return params;
};

export const transactionApi = {
  getPaged: (filters: TransactionListFilters = {}) =>
    api.get<TransactionListResponse>('/transactions', {
      params: toQueryParams(filters),
    }),

  getById: (id: string) => api.get<TransactionItem>(`/transactions/${id}`),
};
