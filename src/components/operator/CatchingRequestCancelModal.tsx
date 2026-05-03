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
  /** Called with (reason, endpoint) so the parent decides which API to call */
  onClose: () => void;
  onConfirm: (reason: string, endpoint: CancelEndpoint) => Promise<void>;
}

export default function CatchingRequestCancelModal({
  isOpen,
  isLoading,
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

  const isOther = selectedReason === 'Other';
  const isRefund = REFUND_VALUES.has(selectedReason);
  const isNoRefund = selectedReason && !isRefund && !isOther;

  const resolvedEndpoint: CancelEndpoint = isOther
    ? otherEndpoint
    : (CANCEL_REASON_OPTIONS.find(o => o.value === selectedReason)?.endpoint ?? 'cancel');

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
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
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

        <div className="space-y-4 p-6">

          {/* Reason list */}
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-slate-800">Chọn lý do hủy</p>

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

            {/* Other */}
            <p className="mt-3 mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Lý do khác
            </p>
            <label
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition
                ${selectedReason === 'Other'
      ? 'border-slate-400 bg-slate-50'
      : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <input
                type="radio"
                name="cancelReason"
                value="Other"
                checked={selectedReason === 'Other'}
                onChange={(e) => {
                  setSelectedReason(e.target.value);
                  setError(null);
                }}
                disabled={isSubmitting || isLoading}
                className="size-4 cursor-pointer"
              />
              <span className="text-sm text-slate-900 font-medium">Khác</span>
            </label>
          </div>

          {/* Refund badge */}
          {isRefund && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <RefreshCcw className="size-4 shrink-0 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-800">
                Đơn sẽ được hoàn lại phí di chuyển cho khách hàng.
              </p>
            </div>
          )}

          {/* No-refund badge */}
          {isNoRefund && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <AlertCircle className="size-4 shrink-0 text-rose-600" />
              <p className="text-sm font-medium text-rose-800">
                Phí di chuyển sẽ không được hoàn lại cho khách hàng.
              </p>
            </div>
          )}

          {/* "Other" extra fields */}
          {isOther && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              {/* Custom reason textarea */}
              <div className="space-y-1">
                <label htmlFor="customReasonInput" className="text-sm font-semibold text-slate-800">
                  Chi tiết lý do
                </label>
                <textarea
                  id="customReasonInput"
                  value={customReason}
                  onChange={(e) => {
                    setCustomReason(e.target.value);
                    setError(null);
                  }}
                  disabled={isSubmitting || isLoading}
                  placeholder="Nhập lý do hủy yêu cầu..."
                  maxLength={500}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <p className="text-right text-xs text-slate-400">
                  {customReason.length}
                  /500
                </p>
              </div>

              {/* Refund choice */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-800">Chính sách hoàn tiền</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOtherEndpoint('operatorcancel')}
                    disabled={isSubmitting || isLoading}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition
                      ${otherEndpoint === 'operatorcancel'
              ? 'border-emerald-500 bg-emerald-500 text-white shadow'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    <RefreshCcw className="size-4" />
                    Hoàn tiền
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtherEndpoint('cancel')}
                    disabled={isSubmitting || isLoading}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition
                      ${otherEndpoint === 'cancel'
              ? 'border-rose-500 bg-rose-500 text-white shadow'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    <RefreshCcwDot className="size-4" />
                    Không hoàn tiền
                  </button>
                </div>

                {/* Inline info for chosen refund option */}
                {otherEndpoint === 'operatorcancel'
                  ? (
                      <p className="text-xs text-emerald-700">
                        ✔ Phí di chuyển sẽ được hoàn lại cho khách hàng.
                      </p>
                    )
                  : (
                      <p className="text-xs text-rose-600">
                        ✘ Phí di chuyển sẽ không được hoàn lại cho khách hàng.
                      </p>
                    )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 border-t border-slate-100 pt-4">
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
    </div>
  );
}
