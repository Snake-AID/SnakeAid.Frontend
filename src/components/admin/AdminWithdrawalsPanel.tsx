'use client';

import type { ApiResponse } from '@/types/api-response';
import type {
  AdminWithdrawalItem,
  FailWithdrawalRequest,
  RejectWithdrawalRequest,
  WithdrawalStatus,
} from '@/types/withdrawal.type';
import {
  BadgeCheck,
  CircleSlash2,
  Copy,
  Loader2,
  QrCode,
  RefreshCcw,
  SearchX,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { adminWithdrawalApi } from '@/apis/admin-withdrawal.api';
import { ApiClientError } from '@/apis/client';
import { useToast } from '@/components/ToastProvider';

type WithdrawalViewMode = 'processing' | 'done';

const STATUS_LABEL_MAP: Record<WithdrawalStatus, string> = {
  Pending: 'Đang chờ',
  Approved: 'Đã duyệt',
  Rejected: 'Đã từ chối',
  Completed: 'Hoàn tất',
  Failed: 'Thất bại',
};

const STATUS_CLASS_MAP: Record<WithdrawalStatus, string> = {
  Pending: 'bg-amber-100 text-amber-800',
  Approved: 'bg-blue-100 text-blue-800',
  Rejected: 'bg-rose-100 text-rose-800',
  Completed: 'bg-emerald-100 text-emerald-800',
  Failed: 'bg-slate-200 text-slate-700',
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDateTime = (iso: string | null) => {
  if (!iso) {
    return 'Chưa xử lý';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString('vi-VN', { hour12: false });
};

const toDataUri = (base64: string) => {
  return `data:image/png;base64,${base64}`;
};

const getValidationMessage = (err: unknown, fallback: string) => {
  if (!(err instanceof ApiClientError)) {
    return fallback;
  }

  const payloadError = err.error as ApiResponse<unknown>['error'];
  const validationEntries = Object.entries(payloadError?.validationErrors ?? {});
  if (!validationEntries.length) {
    return err.message || fallback;
  }

  return validationEntries
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join(' | ');
};

export default function AdminWithdrawalsPanel() {
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<WithdrawalViewMode>('processing');
  const [items, setItems] = useState<AdminWithdrawalItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<AdminWithdrawalItem | null>(null);

  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionReason, setActionReason] = useState('');

  const selectedSummary = useMemo(
    () => items.find(item => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const loadList = async (preferredId?: string | null) => {
    setIsListLoading(true);
    setListError(null);

    try {
      const allItems = await adminWithdrawalApi.getAll();
      const data = allItems.filter((item) => {
        if (viewMode === 'processing') {
          return item.status === 'Pending' || item.status === 'Approved';
        }

        return item.status === 'Rejected' || item.status === 'Completed' || item.status === 'Failed';
      });

      setItems(data);
      setSelectedId((prev) => {
        const targetId = preferredId ?? prev;
        if (targetId != null && data.some(item => item.id === targetId)) {
          return targetId;
        }

        return data[0]?.id ?? null;
      });
    } catch (err) {
      console.error('Failed to load admin withdrawals', err);
      setListError('Không thể tải danh sách withdrawal. Vui lòng thử lại.');
      showToast('Không thể tải danh sách withdrawal.', { type: 'error' });
    } finally {
      setIsListLoading(false);
    }
  };

  const loadDetail = async (id: string) => {
    setIsDetailLoading(true);
    setDetailError(null);

    try {
      const detail = await adminWithdrawalApi.getById(id);
      setSelectedDetail(detail);
      setAdminNotes(detail.adminNotes ?? '');
      setActionReason(detail.rejectionReason ?? '');
    } catch (err) {
      console.error('Failed to load admin withdrawal detail', err);
      setSelectedDetail(null);
      setDetailError('Không thể tải chi tiết withdrawal. Vui lòng thử lại.');
      showToast('Không thể tải chi tiết withdrawal.', { type: 'error' });
    } finally {
      setIsDetailLoading(false);
    }
  };

  const refreshAfterAction = async (targetId: string) => {
    await loadList(targetId);
    await loadDetail(targetId);
  };

  const approveSelected = async () => {
    if (!selectedId || isActionLoading) {
      return;
    }

    setIsActionLoading(true);
    setActionError(null);

    try {
      await adminWithdrawalApi.approve(selectedId, {
        adminNotes: adminNotes.trim() || undefined,
      });
      await refreshAfterAction(selectedId);
      showToast('Đã duyệt yêu cầu rút tiền.', { type: 'success' });
    } catch (err) {
      console.error('Failed to approve withdrawal', err);
      const message = getValidationMessage(err, 'Duyệt yêu cầu rút tiền thất bại.');
      setActionError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const rejectSelected = async () => {
    if (!selectedId || isActionLoading) {
      return;
    }

    if (!actionReason.trim()) {
      setActionError('Lý do từ chối là bắt buộc.');
      return;
    }

    setIsActionLoading(true);
    setActionError(null);

    try {
      const payload: RejectWithdrawalRequest = {
        reason: actionReason.trim(),
        adminNotes: adminNotes.trim() || undefined,
      };
      await adminWithdrawalApi.reject(selectedId, payload);
      await refreshAfterAction(selectedId);
      showToast('Đã từ chối yêu cầu rút tiền.', { type: 'success' });
    } catch (err) {
      console.error('Failed to reject withdrawal', err);
      const message = getValidationMessage(err, 'Từ chối yêu cầu rút tiền thất bại.');
      setActionError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const completeSelected = async () => {
    if (!selectedId || isActionLoading) {
      return;
    }

    setIsActionLoading(true);
    setActionError(null);

    try {
      await adminWithdrawalApi.complete(selectedId, {
        adminNotes: adminNotes.trim() || undefined,
      });
      await refreshAfterAction(selectedId);
      showToast('Đã đánh dấu hoàn tất chuyển khoản.', { type: 'success' });
    } catch (err) {
      console.error('Failed to complete withdrawal', err);
      const message = getValidationMessage(err, 'Hoàn tất withdrawal thất bại.');
      setActionError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const failSelected = async () => {
    if (!selectedId || isActionLoading) {
      return;
    }

    if (!actionReason.trim()) {
      setActionError('Lý do fail là bắt buộc.');
      return;
    }

    setIsActionLoading(true);
    setActionError(null);

    try {
      const payload: FailWithdrawalRequest = {
        reason: actionReason.trim(),
        adminNotes: adminNotes.trim() || undefined,
      };
      await adminWithdrawalApi.fail(selectedId, payload);
      await refreshAfterAction(selectedId);
      showToast('Đã đánh dấu giao dịch thất bại.', { type: 'success' });
    } catch (err) {
      console.error('Failed to fail withdrawal', err);
      const message = getValidationMessage(err, 'Đánh dấu thất bại cho withdrawal thất bại.');
      setActionError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const copyQrPayload = async () => {
    if (!selectedDetail?.vietQrPayload) {
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedDetail.vietQrPayload);
      showToast('Đã copy QR payload.', { type: 'success' });
    } catch {
      showToast('Không thể copy QR payload.', { type: 'error' });
    }
  };

  useEffect(() => {
    void loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    void loadDetail(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const canApprove = selectedDetail?.status === 'Pending';
  const canReject = selectedDetail != null && ['Pending', 'Approved'].includes(selectedDetail.status);
  const canComplete = selectedDetail?.status === 'Approved';
  const canFail = selectedDetail?.status === 'Approved';
  const isFinalized = selectedDetail != null && ['Rejected', 'Completed', 'Failed'].includes(selectedDetail.status);
  const isCompleted = selectedDetail?.status === 'Completed';

  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Duyệt rút tiền</h3>
            <p className="mt-1 text-sm text-slate-500">
              Admin xử lý các yêu cầu rút tiền theo flow FinOps mới.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Tạo yêu cầu rút đã ghi nhận giao dịch
              {' '}
              <span className="font-semibold">WithdrawalInitiated</span>
              {' '}
              và trừ ví. Duyệt/Hoàn tất không tạo thêm giao dịch tài chính. Từ chối/Thất bại sẽ hoàn tiền bằng
              {' '}
              <span className="font-semibold">WithdrawalRefund</span>
              .
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadList(selectedId)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <RefreshCcw className="size-4" />
            Làm mới
          </button>
        </div>
      </header>

      <section className="grid min-h-[calc(100vh-320px)] grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="min-h-0 lg:col-span-4 xl:col-span-4">
          <div className="flex h-full min-h-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Danh sách yêu cầu rút tiền</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {items.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('processing')}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${viewMode === 'processing' ? 'bg-amber-600 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'}`}
                >
                  Đang xử lý
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('done')}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${viewMode === 'done' ? 'bg-emerald-700 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'}`}
                >
                  Đã xử lý
                </button>
              </div>
            </div>

            {listError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {listError}
              </div>
            )}

            {isListLoading && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <Loader2 className="size-4 animate-spin" />
                Đang tải withdrawal...
              </div>
            )}

            {!isListLoading && items.length === 0 && !listError && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <SearchX className="size-4" />
                Không có withdrawal phù hợp.
              </div>
            )}

            {!isListLoading && items.length > 0 && (
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {items.map((item) => {
                  const isActive = item.id === selectedId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        isActive
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-700">{formatCurrency(item.amount)}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLASS_MAP[item.status]}`}>
                          {STATUS_LABEL_MAP[item.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{item.accountHolderName}</p>
                      <p className="text-xs text-slate-500">{item.bankName}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(item.createdAt)}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="min-h-0 lg:col-span-8 xl:col-span-8">
          <div className="flex h-full min-h-0 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {selectedId == null && (
              <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600">
                Chọn một withdrawal để xem chi tiết và xử lý.
              </div>
            )}

            {detailError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {detailError}
              </div>
            )}

            {actionError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {actionError}
              </div>
            )}

            {isDetailLoading && selectedId != null && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <Loader2 className="size-4 animate-spin" />
                Đang tải chi tiết...
              </div>
            )}

            {selectedSummary && !isDetailLoading && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">ID</p>
                  <p className="mt-1 break-all font-medium text-slate-800">{selectedSummary.id}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Trạng thái</p>
                  <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS_MAP[selectedSummary.status]}`}>
                    {STATUS_LABEL_MAP[selectedSummary.status]}
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Số tiền</p>
                  <p className="mt-1 font-medium text-slate-800">{formatCurrency(selectedSummary.amount)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Người nhận</p>
                  <p className="mt-1 font-medium text-slate-800">{selectedSummary.accountHolderName}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 md:col-span-2">
                  <p className="text-xs text-slate-500">Ngân hàng</p>
                  <p className="mt-1 text-slate-800">{selectedSummary.bankName}</p>
                  <p className="text-xs text-slate-500">
                    STK:
                    {' '}
                    {selectedSummary.bankAccount}
                    {' · BIN: '}
                    {selectedSummary.bankBin ?? 'N/A'}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 md:col-span-2">
                  <p className="text-xs text-slate-500">Thời gian</p>
                  <p className="mt-1 text-slate-800">
                    Tạo:
                    {' '}
                    {formatDateTime(selectedSummary.createdAt)}
                  </p>
                  <p className="text-slate-800">
                    Xử lý:
                    {' '}
                    {formatDateTime(selectedSummary.processedAt)}
                  </p>
                </div>
              </div>
            )}

            {selectedDetail && !isDetailLoading && (
              <>
                {!isCompleted && (selectedDetail.vietQrImageBase64 || selectedDetail.vietQrPayload) && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <QrCode className="size-4" />
                      VietQR
                    </div>

                    {selectedDetail.vietQrImageBase64
                      ? (
                          <img
                            src={toDataUri(selectedDetail.vietQrImageBase64)}
                            alt="VietQR"
                            className="h-52 rounded-lg border border-slate-200 bg-white p-2"
                          />
                        )
                      : (
                          <p className="text-sm text-slate-600">Chưa có QR image, chỉ có payload.</p>
                        )}

                    {selectedDetail.vietQrPayload && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => void copyQrPayload()}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Copy className="size-3.5" />
                          Copy QR payload
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <h4 className="text-sm font-bold text-slate-900">Hành động admin</h4>

                  <div className="mt-3 grid grid-cols-1 gap-3">
                    <div>
                      <p className="mb-1 text-xs font-semibold text-slate-700">Admin notes (optional)</p>
                      <textarea
                        rows={3}
                        value={adminNotes}
                        onChange={e => setAdminNotes(e.target.value)}
                        readOnly={isFinalized}
                        className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ${isFinalized ? 'bg-slate-100 text-slate-500' : 'focus:border-blue-600'}`}
                        placeholder={isFinalized ? '' : 'Ví dụ: Verified bank details'}
                      />
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-semibold text-slate-700">Lý do (bắt buộc khi reject/fail)</p>
                      <textarea
                        rows={2}
                        value={actionReason}
                        onChange={e => setActionReason(e.target.value)}
                        readOnly={isFinalized}
                        className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ${isFinalized ? 'bg-slate-100 text-slate-500' : 'focus:border-rose-600'}`}
                        placeholder={isFinalized ? '' : 'Ví dụ: Invalid bank account'}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {canApprove && (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => void approveSelected()}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <BadgeCheck className="size-4" />
                        Duyệt
                      </button>
                    )}

                    {canReject && (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => void rejectSelected()}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CircleSlash2 className="size-4" />
                        Từ chối
                      </button>
                    )}

                    {canComplete && (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => void completeSelected()}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Hoàn tất
                      </button>
                    )}

                    {canFail && (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => void failSelected()}
                        className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Thất bại
                      </button>
                    )}

                    {isActionLoading && (
                      <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                        <Loader2 className="size-4 animate-spin" />
                        Đang xử lý...
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
