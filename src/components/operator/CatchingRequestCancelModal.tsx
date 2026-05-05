'use client';

import { AlertCircle, Loader2, RefreshCcw, RefreshCcwDot, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export type CancelEndpoint = 'operatorcancel' | 'cancel';

interface CancelReasonOption {
  value: string;
  label: string;
  endpoint: CancelEndpoint;
}

/**
 * 6 lý do đầu → endpoint operatorcancel (có hoàn tiền phí di chuyển)
 * Các lý do còn lại (trừ Khác) → endpoint cancel (không hoàn tiền)
 * "Khác" → hiển thị textarea + cho operator chọn endpoint thủ công
 */
const CANCEL_REASON_OPTIONS: CancelReasonOption[] = [
  // ── REFUND group ──────────────────────────────────────────────
  {
    value: 'NoSuitableRescuer',
    label: 'Không có đội cứu hộ phù hợp',
    endpoint: 'operatorcancel',
  },
  {
    value: 'DispatchFailed',
    label: 'Điều phối thất bại',
    endpoint: 'operatorcancel',
  },
  {
    value: 'WaitTimeExceeded',
    label: 'Thời gian chờ vượt quá giới hạn',
    endpoint: 'operatorcancel',
  },
  {
    value: 'UnsafeConditions',
    label: 'Điều kiện không an toàn để thực hiện',
    endpoint: 'operatorcancel',
  },
  {
    value: 'SystemError',
    label: 'Lỗi hệ thống',
    endpoint: 'operatorcancel',
  },
  {
    value: 'SnakeGone',
    label: 'Rắn đã đi mất',
    endpoint: 'operatorcancel',
  },
  // ── NO-REFUND group ───────────────────────────────────────────
  {
    value: 'UnableToContact',
    label: 'Không liên lạc được khách',
    endpoint: 'cancel',
  },
  {
    value: 'CustomerRefusedService',
    label: 'Khách từ chối dịch vụ',
    endpoint: 'cancel',
  },
  {
    value: 'WrongInfo',
    label: 'Sai thông tin / sai địa chỉ',
    endpoint: 'cancel',
  },
  // ── MANUAL group ─────────────────────────────────────────────
  {
    value: 'Other',
    label: 'Khác',
    endpoint: 'cancel', // placeholder – operator picks manually
  },
];

const REFUND_VALUES = new Set(
  CANCEL_REASON_OPTIONS.filter(o => o.endpoint === 'operatorcancel').map(o => o.value),
);

export interface CatchingRequestCancelModalProps {
  isOpen: boolean;
  isLoading: boolean;
  hasTransactions: boolean;
  /** Called with (reason, endpoint) so the parent decides which API to call */
  onClose: () => void;
  onConfirm: (reason: string, endpoint: CancelEndpoint) => Promise<void>;
}

export default function CatchingRequestCancelModal({
  isOpen,
  isLoading,
  hasTransactions,
  onClose,
  onConfirm,
}: CatchingRequestCancelModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [otherEndpoint, setOtherEndpoint] = useState<CancelEndpoint>('cancel');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSelectedReason('');
      setCustomReason('');
      setOtherEndpoint('cancel');
      setError(null);
    }
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  // Derived state
  const isOther = selectedReason === 'Other';
  const isRefundableReason = hasTransactions && REFUND_VALUES.has(selectedReason);
  const isManualRefundable = hasTransactions && isOther && otherEndpoint === 'operatorcancel';
  const willRefund = isRefundableReason || isManualRefundable;

  const resolvedEndpoint: CancelEndpoint = hasTransactions
    ? (isOther ? otherEndpoint : (isRefundableReason ? 'operatorcancel' : 'cancel'))
    : 'cancel'; // If no transactions, we never call operatorcancel (no money to refund)

  const handleSubmit = async () => {
    setError(null);

    if (!selectedReason) {
      setError('Vui lòng chọn lý do hủy');
      return;
    }

    if (isOther && !customReason.trim()) {
      setError('Vui lòng nhập lý do hủy');
      return;
    }

    const finalReason = isOther
      ? customReason.trim()
      : (CANCEL_REASON_OPTIONS.find(o => o.value === selectedReason)?.label ?? selectedReason);

    setIsSubmitting(true);
    try {
      await onConfirm(finalReason, resolvedEndpoint);
      onClose();
    } catch (err) {
      console.error('Failed to cancel request', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled
    = isSubmitting
      || isLoading
      || !selectedReason
      || (isOther && !customReason.trim());

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xl">

        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-rose-600" />
            <h2 className="text-lg font-bold text-slate-900">Hủy yêu cầu bắt rắn</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isLoading}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-1.5 px-6 py-4">
            <p className="text-sm font-semibold text-slate-800">Chọn lý do hủy</p>

            {/* ── Conditional Rendering Based on hasTransactions ── */}
            {hasTransactions
              ? (
                  <>
                    {/* Refund group header */}
                    <p className="mt-2 mb-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                      Hoàn phí di chuyển
                    </p>
                    {CANCEL_REASON_OPTIONS.filter(o => o.endpoint === 'operatorcancel').map(option => (
                      <label
                        key={option.value}
                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition
                      ${selectedReason === option.value
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-slate-200 hover:bg-slate-50'}`}
                      >
                        <input
                          type="radio"
                          name="cancelReason"
                          value={option.value}
                          checked={selectedReason === option.value}
                          onChange={(e) => {
                            setSelectedReason(e.target.value);
                            setError(null);
                          }}
                          disabled={isSubmitting || isLoading}
                          className="size-4 cursor-pointer accent-emerald-600"
                        />
                        <span className="text-sm text-slate-900 font-medium">{option.label}</span>
                      </label>
                    ))}

                    {/* No-refund group header */}
                    <p className="mt-3 mb-1 text-[11px] font-bold uppercase tracking-wider text-rose-600">
                      Không hoàn phí di chuyển
                    </p>
                    {CANCEL_REASON_OPTIONS.filter(o => o.endpoint === 'cancel' && o.value !== 'Other').map(option => (
                      <label
                        key={option.value}
                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition
                      ${selectedReason === option.value
                        ? 'border-rose-400 bg-rose-50'
                        : 'border-slate-200 hover:bg-slate-50'}`}
                      >
                        <input
                          type="radio"
                          name="cancelReason"
                          value={option.value}
                          checked={selectedReason === option.value}
                          onChange={(e) => {
                            setSelectedReason(e.target.value);
                            setError(null);
                          }}
                          disabled={isSubmitting || isLoading}
                          className="size-4 cursor-pointer accent-rose-600"
                        />
                        <span className="text-sm text-slate-900 font-medium">{option.label}</span>
                      </label>
                    ))}

                    {/* Other (Manual) option */}
                    <p className="mt-3 mb-1 text-[11px] font-bold uppercase tracking-wider text-amber-600">
                      Khác
                    </p>
                    <label
                      className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition
                    ${isOther ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        value="Other"
                        checked={isOther}
                        onChange={(e) => {
                          setSelectedReason(e.target.value);
                          setError(null);
                        }}
                        disabled={isSubmitting || isLoading}
                        className="size-4 cursor-pointer accent-amber-600"
                      />
                      <span className="text-sm text-slate-900 font-medium">Khác</span>
                    </label>
                  </>
                )
              : (
                  <>
                    {/* Flat list for no transactions */}
                    {CANCEL_REASON_OPTIONS.map(option => (
                      <label
                        key={option.value}
                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition
                      ${selectedReason === option.value
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-slate-200 hover:bg-slate-50'}`}
                      >
                        <input
                          type="radio"
                          name="cancelReason"
                          value={option.value}
                          checked={selectedReason === option.value}
                          onChange={(e) => {
                            setSelectedReason(e.target.value);
                            setError(null);
                          }}
                          disabled={isSubmitting || isLoading}
                          className="size-4 cursor-pointer accent-amber-600"
                        />
                        <span className="text-sm text-slate-900 font-medium">{option.label}</span>
                      </label>
                    ))}
                  </>
                )}
          </div>

          {/* Warning / Notice Banner */}
          {hasTransactions && willRefund && (
            <div className="border-t border-emerald-200 bg-emerald-50 px-6 py-4">
              <div className="flex items-start gap-3">
                <RefreshCcw className="mt-0.5 size-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Sẽ hoàn lại phí di chuyển</p>
                  <p className="mt-0.5 text-xs text-emerald-700">
                    Dựa trên lý do bạn chọn, hệ thống sẽ tự động hoàn lại phí di chuyển (nếu có) vào ví của khách hàng.
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasTransactions && !willRefund && !isOther && selectedReason && (
            <div className="border-t border-rose-200 bg-rose-50 px-6 py-4">
              <div className="flex items-start gap-3">
                <RefreshCcwDot className="mt-0.5 size-5 text-rose-600" />
                <div>
                  <p className="text-sm font-semibold text-rose-900">Không hoàn phí di chuyển</p>
                  <p className="mt-0.5 text-xs text-rose-700">
                    Lý do hủy này thuộc trách nhiệm khách hàng. Sẽ không có khoản hoàn tiền nào được thực hiện.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!hasTransactions && selectedReason && (
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 size-5 text-slate-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Chưa có giao dịch</p>
                  <p className="mt-0.5 text-xs text-slate-700">
                    Khách hàng chưa thanh toán phí di chuyển nên không có khoản hoàn tiền nào được thực hiện.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* If "Other" is selected, show manual inputs */}
          {isOther && (
            <div className="animate-in fade-in slide-in-from-top-2 border-t border-slate-200 bg-slate-50 p-6 duration-200">
              <label htmlFor="customReason" className="block text-sm font-medium text-slate-700">
                Chi tiết lý do khác
                <span className="ml-1 text-rose-500">*</span>
              </label>
              <textarea
                id="customReason"
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  setError(null);
                }}
                rows={3}
                disabled={isSubmitting || isLoading}
                placeholder="Nhập lý do cụ thể..."
                className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:bg-slate-100"
              />

              {/* Only show the manual refund selector if there are transactions to refund */}
              {hasTransactions && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Tuỳ chọn hoàn tiền</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Đối với lý do khác, hãy quyết định xem khách hàng có được hoàn lại phí di chuyển hay không.
                  </p>

                  <div className="mt-3 flex flex-col gap-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="otherEndpoint"
                        value="operatorcancel"
                        checked={otherEndpoint === 'operatorcancel'}
                        onChange={() => setOtherEndpoint('operatorcancel')}
                        disabled={isSubmitting || isLoading}
                        className="size-4 accent-emerald-600"
                      />
                      <span className="text-sm text-slate-700">Có hoàn phí di chuyển</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="otherEndpoint"
                        value="cancel"
                        checked={otherEndpoint === 'cancel'}
                        onChange={() => setOtherEndpoint('cancel')}
                        disabled={isSubmitting || isLoading}
                        className="size-4 accent-rose-600"
                      />
                      <span className="text-sm text-slate-700">Không hoàn phí di chuyển</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-6">
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            </div>
          )}

        </div>

        {/* Sticky Actions */}
        <div className="flex shrink-0 gap-2 border-t border-slate-100 p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isLoading}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {(isSubmitting || isLoading) ? <Loader2 className="size-4 animate-spin" /> : null}
            Xác nhận hủy
          </button>
        </div>
      </div>
    </div>
  );
}
