'use client';

import { AlertCircle, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface CatchingMissionAbortModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

const ABORT_REASON_OPTIONS = [
  {
    value: 'DriverCannotArrive',
    label: 'Tài xế không thể đến nơi di chuyển',
    reasonText: 'Tài xế không thể đến nơi di chuyển',
  },
  {
    value: 'TrafficBlocked',
    label: 'Giao thông hoặc đường đi bị cản trở',
    reasonText: 'Giao thông hoặc đường đi bị cản trở',
  },
  {
    value: 'RescuerUnavailable',
    label: 'Đội cứu hộ báo không thể tiếp nhận nhiệm vụ',
    reasonText: 'Đội cứu hộ báo không thể tiếp nhận nhiệm vụ',
  },
  {
    value: 'UnableToContactRescuer',
    label: 'Không thể liên lạc được với đội cứu hộ',
    reasonText: 'Không thể liên lạc được với đội cứu hộ',
  },
  {
    value: 'Other',
    label: 'Lý do khác',
    reasonText: 'Lý do khác',
  },
];

export default function CatchingMissionAbortModal({
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}: CatchingMissionAbortModalProps) {
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

  const handleSubmit = async () => {
    setError(null);

    if (!selectedReason) {
      setError('Vui lòng chọn lý do hủy đơn nhiệm vụ');
      return;
    }

    if (selectedReason === 'Other' && !customReason.trim()) {
      setError('Vui lòng nhập lý do hủy');
      return;
    }

    const reasonText = selectedReason === 'Other'
      ? customReason.trim()
      : ABORT_REASON_OPTIONS.find(option => option.value === selectedReason)?.reasonText ?? selectedReason;

    setIsSubmitting(true);

    try {
      await onConfirm(reasonText);
      setSelectedReason('');
      setCustomReason('');
      onClose();
    } catch (err) {
      console.error('Failed to abort mission', err);
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
            <AlertCircle className="size-5 text-rose-600" />
            <h2 className="text-lg font-bold text-slate-900">Hủy đơn nhiệm vụ</h2>
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
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
            <p className="text-sm text-rose-900">
              Chọn lý do tài xế/kết nối không thể hoàn thành nhiệm vụ. Hệ thống sẽ đưa yêu cầu về lại trạng thái "Đã xác nhận" để điều phối lại đội cứu hộ khác.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900">Lý do hủy đơn nhiệm vụ</p>
            <div className="space-y-2">
              {ABORT_REASON_OPTIONS.map(option => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 transition"
                >
                  <input
                    id={option.value}
                    type="radio"
                    name="abortReason"
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

          {selectedReason === 'Other' && (
            <div className="space-y-2">
              <label htmlFor="abortCustomReason" className="text-sm font-semibold text-slate-900">Chi tiết lý do</label>
              <textarea
                id="abortCustomReason"
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  setError(null);
                }}
                disabled={isSubmitting || isLoading}
                placeholder="Nhập lý do hủy đơn nhiệm vụ..."
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

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

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
              {isSubmitting || isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
              Xác nhận hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
