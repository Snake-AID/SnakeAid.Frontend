'use client';

import { AlertTriangle, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const ABORT_REASONS = [
  {
    value: 'Rescuer không bắt máy, GPS không di chuyển quá 15 phút',
    label: 'Rescuer không phản hồi / GPS không di chuyển',
  },
  {
    value: 'Rescuer gặp sự cố phương tiện trên đường',
    label: 'Rescuer gặp sự cố trên đường',
  },
  {
    value: 'Giao thông tắc nghẽn, không thể tiếp cận',
    label: 'Tắc đường / không thể tiếp cận',
  },
  {
    value: 'other',
    label: 'Lý do khác (nhập thủ công)',
  },
] as const;

export interface IncidentMissionAbortModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export default function IncidentMissionAbortModal({
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}: IncidentMissionAbortModalProps) {
  const [selectedValue, setSelectedValue] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
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
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const isOther = selectedValue === 'other';
  const finalReason = isOther ? customReason.trim() : selectedValue;
  const canSubmit = !isSubmitting && !isLoading && selectedValue !== '' && (!isOther || customReason.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm(finalReason);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Hủy nhiệm vụ cứu hộ
              </h2>
              <p className="text-xs text-slate-500">
                Incident sẽ về trạng thái Chờ điều phối
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isLoading}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            ⚠️ Chỉ hủy khi Rescuer không phản hồi hoặc có sự cố khách quan. Hành động này không thể hoàn tác.
          </div>

          {/* Reason options */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900">
              Lý do hủy nhiệm vụ
            </p>
            {ABORT_REASONS.map(reason => (
              <label
                key={reason.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                  selectedValue === reason.value
                    ? 'border-rose-400 bg-rose-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="abortReason"
                  value={reason.value}
                  checked={selectedValue === reason.value}
                  onChange={(e) => {
                    setSelectedValue(e.target.value);
                    setError(null);
                  }}
                  className="h-4 w-4 accent-rose-600"
                />
                <span className="text-sm text-slate-800">
                  {reason.label}
                </span>
              </label>
            ))}
          </div>

          {/* Custom reason textarea */}
          {isOther && (
            <div className="space-y-1">
              <label htmlFor="abort-custom-reason" className="text-sm font-semibold text-slate-900">
                Nhập lý do hủy
              </label>
              <textarea
                id="abort-custom-reason"
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  setError(null);
                }}
                rows={3}
                maxLength={300}
                placeholder="Mô tả lý do cụ thể..."
                className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
              <p className="text-right text-xs text-slate-400">
                {customReason.length}
                /300
              </p>
            </div>
          )}

          {/* Inline error */}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isLoading}
            className="flex-1 rounded-xl border border-slate-300 bg-white py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {(isSubmitting || isLoading) && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Xác nhận hủy
          </button>
        </div>
      </div>
    </div>
  );
}
