'use client';

import { AlertCircle, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SnakeCatchingRequestStatus } from '@/types/snakecatching-request.type';

export interface CatchingRequestCancelModalProps {
  isOpen: boolean;
  isLoading: boolean;
  requestStatus?: SnakeCatchingRequestStatus;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

interface CancelReasonOption {
  value: string;
  label: string;
  reasonText: string;
}

const PENDING_CANCEL_REASON_OPTIONS: CancelReasonOption[] = [
  {
    value: 'FalseAlarm',
    label: 'Báo động giả - Khách xác nhận không có rắn',
    reasonText: 'Báo động giả - Khách xác nhận không có rắn',
  },
  {
    value: 'SnakeLeftArea',
    label: 'Rắn đã tự rời đi - Khách xác nhận tình hình đã giải quyết',
    reasonText: 'Rắn đã tự rời đi - Khách xác nhận tình hình đã giải quyết',
  },
  {
    value: 'CustomerCancelled',
    label: 'Khách muốn hủy yêu cầu này',
    reasonText: 'Khách muốn hủy yêu cầu này',
  },
  {
    value: 'UnableToContact',
    label: 'Không liên hệ được khách hàng',
    reasonText: 'Không liên hệ được khách hàng',
  },
  {
    value: 'Other',
    label: 'Lý do khác',
    reasonText: 'Lý do khác',
  },
];

const CONFIRMED_CANCEL_REASON_OPTIONS: CancelReasonOption[] = [
  {
    value: 'NoNearbyRescuer',
    label: 'Không tìm được đội cứu hộ gần đây',
    reasonText: 'Không tìm được đội cứu hộ gần đây',
  },
  {
    value: 'CustomerCancelled',
    label: 'Khách muốn hủy yêu cầu này',
    reasonText: 'Khách muốn hủy yêu cầu này',
  },
  {
    value: 'UnableToContact',
    label: 'Không liên hệ được khách hàng',
    reasonText: 'Không liên hệ được khách hàng',
  },
  {
    value: 'RescuerUnavailable',
    label: 'Không có đội cứu hộ sẵn sàng nhận nhiệm vụ',
    reasonText: 'Không có đội cứu hộ sẵn sàng nhận nhiệm vụ',
  },
  {
    value: 'Other',
    label: 'Lý do khác',
    reasonText: 'Lý do khác',
  },
];

export default function CatchingRequestCancelModal({
  isOpen,
  isLoading,
  requestStatus,
  onClose,
  onConfirm,
}: CatchingRequestCancelModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const cancelReasonOptions = requestStatus === SnakeCatchingRequestStatus.Pending
    ? PENDING_CANCEL_REASON_OPTIONS
    : CONFIRMED_CANCEL_REASON_OPTIONS;

  const isPendingRequest = requestStatus === SnakeCatchingRequestStatus.Pending;

  const handleSubmit = async () => {
    setError(null);

    // Validate reason
    if (!selectedReason) {
      setError('Vui lòng chọn lý do hủy');
      return;
    }

    // If "Other" is selected, require custom reason
    if (selectedReason === 'Other' && !customReason.trim()) {
      setError('Vui lòng nhập lý do hủy');
      return;
    }

    const selectedReasonOption = cancelReasonOptions.find(option => option.value === selectedReason);
    const finalReason = selectedReason === 'Other'
      ? customReason.trim()
      : (selectedReasonOption?.reasonText ?? selectedReason);

    setIsSubmitting(true);
    try {
      await onConfirm(finalReason);
      // Reset and close modal
      setSelectedReason('');
      setCustomReason('');
      onClose();
    } catch (err) {
      console.error('Failed to cancel request', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = isSubmitting || isLoading || !selectedReason || (selectedReason === 'Other' && !customReason.trim());

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-amber-600" />
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
          {/* Instructions */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-900">
              {isPendingRequest
                ? 'Vui lòng chọn lý do hủy dựa trên thông tin xác nhận từ khách. Thông tin này sẽ được ghi lại cho mục đích theo dõi.'
                : 'Vui lòng chọn lý do hủy phù hợp trong giai đoạn đã xác nhận. Thông tin này sẽ được ghi lại cho mục đích theo dõi.'}
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900">Lý do hủy</p>
            <div className="space-y-2">
              {cancelReasonOptions.map(option => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 transition"
                >
                  <input
                    id={option.value}
                    type="radio"
                    name="cancelReason"
                    value={option.value}
                    checked={selectedReason === option.value}
                    onChange={(e) => {
                      setSelectedReason(e.target.value);
                      setError(null);
                    }}
                    disabled={isSubmitting || isLoading}
                    className="size-4 cursor-pointer"
                  />
                  <span className="text-sm text-slate-900 font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Reason Input */}
          {selectedReason === 'Other' && (
            <div className="space-y-2">
              <label htmlFor="customReasonInput" className="text-sm font-semibold text-slate-900">Chi tiết lý do</label>
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-500 disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
              <p className="text-xs text-slate-500">
                {customReason.length}
                /500 ký tự
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isLoading}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSubmitting || isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
              Xác nhận hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
