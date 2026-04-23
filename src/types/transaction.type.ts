import type { PagedData } from './api-response';

export type TransactionFilterType
  = | 'consultation'
    | 'snake catching'
    | 'snakebite incident'
    | 'system';

export interface TransactionItem {
  id: string;
  userName: string;
  fullName: string;
  referenceId: string;
  amount: number;
  currency: string;
  transactionType: string;
  description: string;
  paymentMethod: string;
  externalTransactionId: string | null;
  createdAt: string;
}

export interface TransactionListFilters {
  userName?: string;
  transType?: TransactionFilterType;
  referenceId?: string;
  pageNumber?: number;
  pageSize?: number;
}

export type TransactionListResponse = PagedData<TransactionItem>;
