'use client';

import type { PaginationMeta } from '@/types/api-response';
import type { TransactionFilterType, TransactionItem } from '@/types/transaction.type';
import { CircleDollarSign, Loader2, SearchX, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { transactionApi } from '@/apis/transaction.api';
import { useToast } from '@/components/ToastProvider';

const TRANS_TYPE_OPTIONS: Array<{ value: TransactionFilterType; label: string }> = [
  { value: 'consultation', label: 'Tư vấn' },
  { value: 'snake catching', label: 'Bắt rắn' },
  { value: 'snakebite incident', label: 'Sự cố rắn cắn' },
  { value: 'system', label: 'Hệ thống' },
];

const TRANSACTION_TYPE_LABEL_MAP: Record<string, string> = {
  ConsultationPayment: 'Thanh toán tư vấn',
  ExpertPayout: 'Chi trả chuyên gia',
  WalletTopup: 'Nạp ví',
  WalletWithdraw: 'Rút ví',
  CatchingPayment: 'Thanh toán bắt rắn',
  CatchingDeposit: 'Đặt cọc bắt rắn',
  CatchingRefund: 'Hoàn tiền bắt rắn',
  SnakebiteIncidentPayment: 'Thanh toán sự cố rắn cắn',
  SnakebiteIncidentDeposit: 'Đặt cọc sự cố rắn cắn',
  SnakebiteIncidentRefund: 'Hoàn tiền sự cố rắn cắn',
};

const PAYMENT_METHOD_LABEL_MAP: Record<string, string> = {
  Internal: 'SnakeAidPay',
  PayOS: 'PayOS',
  Cash: 'Tiền mặt',
  BankTransfer: 'Chuyển khoản',
  Wallet: 'SnakeAidPay',
};

const DEFAULT_PAGINATION: PaginationMeta = {
  total_pages: 1,
  total_items: 0,
  current_page: 1,
  page_size: 10,
};

const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString('vi-VN')} ${currency}`;
  }
};

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString('vi-VN', {
    hour12: false,
  });
};

const getTransactionTypeLabel = (value: string) => {
  return TRANSACTION_TYPE_LABEL_MAP[value] ?? value;
};

const getPaymentMethodLabel = (value: string) => {
  return PAYMENT_METHOD_LABEL_MAP[value] ?? value;
};

export default function TransactionsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);

  const [userIdFilter, setUserIdFilter] = useState('');
  const [transTypeFilter, setTransTypeFilter] = useState<TransactionFilterType | ''>('');
  const [pageSize, setPageSize] = useState(10);
  const [pageNumber, setPageNumber] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const trimmedUserId = useMemo(() => userIdFilter.trim(), [userIdFilter]);
  const isUserIdValid = useMemo(
    () => trimmedUserId.length === 0 || GUID_REGEX.test(trimmedUserId),
    [trimmedUserId],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPageNumber(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [trimmedUserId, transTypeFilter]);

  useEffect(() => {
    let cancelled = false;

    const loadTransactions = async () => {
      setIsLoading(true);
      setListError(null);

      if (!isUserIdValid) {
        setItems([]);
        setPagination(prev => ({
          ...prev,
          current_page: 1,
          page_size: pageSize,
        }));
        setListError('User ID phải đúng định dạng GUID (ví dụ: fd0512a8-e50d-4ef3-8253-18c1bea1d41c).');
        setIsLoading(false);
        return;
      }

      try {
        const response = await transactionApi.getPaged({
          userId: trimmedUserId || undefined,
          transType: transTypeFilter || undefined,
          pageNumber,
          pageSize,
        });

        if (cancelled) {
          return;
        }

        setItems(response.items);
        setPagination(response.meta);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error('Failed to load transactions', error);
        setItems([]);
        setPagination(prev => ({
          ...prev,
          current_page: pageNumber,
          page_size: pageSize,
        }));
        setListError('Không thể tải danh sách giao dịch. Vui lòng thử lại.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadTransactions();

    return () => {
      cancelled = true;
    };
  }, [isUserIdValid, pageNumber, pageSize, trimmedUserId, transTypeFilter]);

  const openDetail = async (id: string) => {
    setIsDetailLoading(true);
    setDetailError(null);
    setSelectedTransaction(null);

    try {
      const detail = await transactionApi.getById(id);
      setSelectedTransaction(detail);
    } catch (error) {
      console.error('Failed to load transaction detail', error);
      setDetailError('Không thể tải chi tiết giao dịch.');
      showToast('Không thể tải chi tiết giao dịch.', { type: 'error' });
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setSelectedTransaction(null);
    setDetailError(null);
    setIsDetailLoading(false);
  };

  const canGoPrev = pageNumber > 1;
  const canGoNext = pageNumber < pagination.total_pages;

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-360 flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <h2 className="text-3xl font-bold text-slate-900">Quản lý dòng tiền</h2>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi và tra cứu lịch sử giao dịch toàn hệ thống theo user, loại giao dịch và phân trang.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-700">User ID</p>
              <input
                value={userIdFilter}
                onChange={e => setUserIdFilter(e.target.value)}
                placeholder="GUID, ví dụ: fd0512a8-e50d-4ef3-8253-18c1bea1d41c"
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600 ${isUserIdValid ? 'border-slate-300' : 'border-rose-300 focus:border-rose-600'}`}
              />
              {!isUserIdValid && (
                <p className="mt-1 text-xs font-medium text-rose-600">User ID phải là GUID hợp lệ.</p>
              )}
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold text-slate-700">Loại giao dịch</p>
              <select
                value={transTypeFilter}
                onChange={e => setTransTypeFilter(e.target.value as TransactionFilterType | '')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              >
                <option value="">Tất cả loại</option>
                {TRANS_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold text-slate-700">Số dòng / trang</p>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageNumber(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              >
                {[10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {listError && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {listError}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-2">Loại giao dịch</th>
                  <th className="border-b border-slate-200 px-3 py-2">Số tiền</th>
                  <th className="border-b border-slate-200 px-3 py-2">User ID</th>
                  <th className="border-b border-slate-200 px-3 py-2">Phương thức</th>
                  <th className="border-b border-slate-200 px-3 py-2">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Đang tải giao dịch...
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading && items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <SearchX className="size-4" />
                        Không có giao dịch phù hợp.
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading && items.map(item => (
                  <tr
                    key={item.id}
                    className="cursor-pointer transition hover:bg-slate-50"
                    onClick={() => void openDetail(item.id)}
                  >
                    <td className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-800">{getTransactionTypeLabel(item.transactionType)}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{formatCurrency(item.amount, item.currency)}</td>
                    <td className="max-w-50 truncate border-b border-slate-100 px-3 py-3 text-slate-600" title={item.userId}>{item.userId}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{getPaymentMethodLabel(item.paymentMethod)}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{formatDateTime(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Tổng
              {' '}
              <span className="font-semibold text-slate-800">{pagination.total_items}</span>
              {' '}
              giao dịch
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canGoPrev || isLoading}
                onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Trước
              </button>

              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                Trang
                {' '}
                {pagination.current_page}
                {' '}
                /
                {' '}
                {pagination.total_pages}
              </span>

              <button
                type="button"
                disabled={!canGoNext || isLoading}
                onClick={() => setPageNumber(prev => prev + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Sau
              </button>
            </div>
          </div>
        </section>
      </div>

      {(isDetailLoading || selectedTransaction || detailError) && (
        <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Đóng chi tiết giao dịch"
            className="absolute inset-0 bg-slate-900/45"
            onClick={closeDetailModal}
          />
          <div
            className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <CircleDollarSign className="size-5 text-blue-700" />
                Chi tiết giao dịch
              </h3>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                onClick={closeDetailModal}
              >
                <X className="size-4" />
              </button>
            </div>

            {isDetailLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="size-4 animate-spin" />
                Đang tải chi tiết...
              </div>
            )}

            {!isDetailLoading && detailError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {detailError}
              </div>
            )}

            {!isDetailLoading && selectedTransaction && (
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">ID</p>
                  <p className="mt-1 break-all font-medium text-slate-800">{selectedTransaction.id}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">User ID</p>
                  <p className="mt-1 break-all font-medium text-slate-800">{selectedTransaction.userId}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Reference ID</p>
                  <p className="mt-1 break-all font-medium text-slate-800">{selectedTransaction.referenceId}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Loại giao dịch</p>
                  <p className="mt-1 font-medium text-slate-800">{getTransactionTypeLabel(selectedTransaction.transactionType)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Amount</p>
                  <p className="mt-1 font-medium text-slate-800">{formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Phương thức</p>
                  <p className="mt-1 font-medium text-slate-800">{getPaymentMethodLabel(selectedTransaction.paymentMethod)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 md:col-span-2">
                  <p className="text-xs text-slate-500">External Transaction ID</p>
                  <p className="mt-1 break-all font-medium text-slate-800">{selectedTransaction.externalTransactionId || 'Không có'}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 md:col-span-2">
                  <p className="text-xs text-slate-500">Description</p>
                  <p className="mt-1 text-slate-800">{selectedTransaction.description}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 md:col-span-2">
                  <p className="text-xs text-slate-500">Created At</p>
                  <p className="mt-1 font-medium text-slate-800">{formatDateTime(selectedTransaction.createdAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
