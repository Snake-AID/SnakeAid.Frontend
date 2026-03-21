'use client';

import type { AntivenomUpsertPayload } from '@/types/antivenom.type';
import { X } from 'lucide-react';
import { useState } from 'react';

interface AntivenomUpsertModalProps {
  isOpen: boolean;
  mode: 'create' | 'update';
  initialValue: AntivenomUpsertPayload;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: AntivenomUpsertPayload) => Promise<void>;
}

export default function AntivenomUpsertModal({
  isOpen,
  mode,
  initialValue,
  isSubmitting,
  onClose,
  onSubmit,
}: AntivenomUpsertModalProps) {
  const [draft, setDraft] = useState<AntivenomUpsertPayload>(initialValue);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    try {
      await onSubmit({
        name: draft.name.trim(),
        manufacturer: draft.manufacturer.trim(),
        description: draft.description.trim(),
      });
    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message || 'Không thể lưu dữ liệu. Vui lòng kiểm tra lại.');
      } else {
        setSubmitError('Không thể lưu dữ liệu. Vui lòng kiểm tra lại.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {mode === 'create' ? 'Thêm huyết thanh mới' : 'Cập nhật huyết thanh'}
            </h3>
            <p className="text-sm text-slate-500">Nhập thông tin huyết thanh theo dữ liệu chuẩn.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-6">
          {submitError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {submitError}
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-700">Tên huyết thanh</p>
            <input
              required
              value={draft.name}
              onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-700">Nhà sản xuất</p>
            <input
              required
              value={draft.manufacturer}
              onChange={e => setDraft(prev => ({ ...prev, manufacturer: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-700">Mô tả</p>
            <textarea
              required
              rows={4}
              value={draft.description}
              onChange={e => setDraft(prev => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              disabled={isSubmitting}
              type="submit"
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo mới' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
