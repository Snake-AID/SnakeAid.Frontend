'use client';

import type { TransactionItem } from '@/types/transaction.type';
import { AlertCircle, CircleDollarSign, Loader2, Receipt } from 'lucide-react';
import { useEffect, useState } from 'react';
import { transactionApi } from '@/apis/transaction.api';

const TRANSACTION_TYPE_LABEL_MAP: Record<string, string> = {
  ConsultationPayment: 'Thanh toán tư vấn',
  ExpertPayout: 'Chi trả chuyên gia',
  ConsultationRefund: 'Hoàn tiền tư vấn',
  MissionDonation: 'Quyên góp nhiệm vụ',
  RescuerReward: 'Thưởng cứu hộ',
  WalletTopup: 'Nạp ví',
  WalletWithdraw: 'Rút ví',
  WithdrawalInitiated: 'Khởi tạo yêu cầu rút tiền',
  WithdrawalRefund: 'Hoàn tiền yêu cầu rút',
  PlatformFee: 'Phí nền tảng',
  AdminAdjustment: 'Điều chỉnh admin',
  CatchingPayment: 'Thanh toán bắt rắn',
  CatcherPayout: 'Chi trả người bắt rắn',
  CatchingDeposit: 'Đặt cọc bắt rắn',
  CatchingRefund: 'Hoàn tiền bắt rắn',
  SnakebiteIncidentPayment: 'Thanh toán sự cố rắn cắn',
  SnakebiteIncidentDeposit: 'Đặt cọc sự cố rắn cắn',
  SnakebiteIncidentRefund: 'Hoàn tiền sự cố rắn cắn',
};

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
  return date.toLocaleString('vi-VN', { hour12: false });
};

const getTransactionTypeBadgeClass = (type: string) => {
  if (type.includes('Payment') || type.includes('Deposit')) {
    return 'bg-blue-100 text-blue-700';
  }
  if (type.includes('Refund') || type.includes('Withdraw')) {
    return 'bg-amber-100 text-amber-700';
  }
  if (type.includes('Payout') || type.includes('Reward')) {
    return 'bg-emerald-100 text-emerald-700';
  }
  return 'bg-slate-100 text-slate-700';
};

interface AdminTransactionCardProps {
  referenceId: string;
}

export default function AdminTransactionCard({ referenceId }: AdminTransactionCardProps) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchTransactions = async () => {
      if (!referenceId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await transactionApi.getPaged({
          referenceId,
          pageSize: 20, // Should be enough for related transactions
        });

        if (!cancelled) {
          setTransactions(response.items);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load related transactions', err);
          setError('Không thể tải lịch sử giao dịch.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchTransactions();

    return () => {
      cancelled = true;
    };
  }, [referenceId]);

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 shadow-sm">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
        <CircleDollarSign className="size-4 text-blue-600" />
        Thanh toán & Giao dịch
      </p>

      {loading && (
        <div className="flex items-center justify-center p-4 text-sm text-slate-500">
          <Loader2 className="mr-2 size-4 animate-spin text-blue-500" />
          Đang tải giao dịch...
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="size-4" />
          {error}
        </div>
      )}

      {!loading && !error && transactions.length === 0 && (
        <div className="flex flex-col items-center justify-center p-6 text-sm text-slate-500 bg-white/60 rounded-lg border border-dashed border-slate-300">
          <Receipt className="mb-2 size-8 text-slate-300" />
          Chưa có giao dịch nào cho yêu cầu này
        </div>
      )}

      {!loading && !error && transactions.length > 0 && (
        <div className="space-y-2">
          {transactions.map(item => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white bg-white p-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-50">
                  <CircleDollarSign className="size-5 text-slate-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{formatCurrency(item.amount, item.currency)}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-md font-semibold ${getTransactionTypeBadgeClass(item.transactionType)}`}>
                      {TRANSACTION_TYPE_LABEL_MAP[item.transactionType] || item.transactionType}
                    </span>
                    <span>
                      •
                      {formatDateTime(item.createdAt)}
                    </span>
                    <span className="font-mono">{item.paymentMethod}</span>
                  </p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="text-xs font-medium text-slate-700">{item.fullName || item.userName}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 break-all max-w-[160px] truncate" title={item.externalTransactionId ?? ''}>
                  {item.externalTransactionId ? `Mã: ${item.externalTransactionId}` : 'Nội bộ'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
