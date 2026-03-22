'use client';

import type { FirstAidGuidelineOption } from '@/types/first-aid-guideline.type';
import type { VenomTypeUpsertPayload } from '@/types/venom-type.type';
import { X } from 'lucide-react';
import { useState } from 'react';

interface VenomTypeUpsertModalProps {
  isOpen: boolean;
  mode: 'create' | 'update';
  initialValue: VenomTypeUpsertPayload;
  firstAidOptions: FirstAidGuidelineOption[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: VenomTypeUpsertPayload) => Promise<void>;
}

export default function VenomTypeUpsertModal({
  isOpen,
  mode,
  initialValue,
  firstAidOptions,
  isSubmitting,
  onClose,
  onSubmit,
}: VenomTypeUpsertModalProps) {
  const [draft, setDraft] = useState<VenomTypeUpsertPayload>(initialValue);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [firstAidError, setFirstAidError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    setFirstAidError(null);

    if (draft.firstAidGuidelineId <= 0) {
      setFirstAidError('Vui lòng chọn FirstAid guideline từ danh sách.');
      return;
    }

    try {
      await onSubmit({
        name: draft.name.trim(),
        scientificName: draft.scientificName.trim(),
        description: draft.description.trim(),
        isActive: draft.isActive,
        severityIndex: Number(draft.severityIndex),
        firstAidGuidelineId: Number(draft.firstAidGuidelineId),
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
              {mode === 'create' ? 'Thêm loại độc rắn mới' : 'Cập nhật loại độc rắn'}
            </h3>
            <p className="text-sm text-slate-500">Nhập thông tin loại độc theo dữ liệu chuẩn.</p>
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
            <p className="mb-2 text-xs font-semibold text-slate-700">Tên loại độc</p>
            <input
              required
              value={draft.name}
              onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-700">Tên khoa học</p>
            <input
              required
              value={draft.scientificName}
              onChange={e => setDraft(prev => ({ ...prev, scientificName: e.target.value }))}
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-700">Mức độ nghiêm trọng (0-10)</p>
              <input
                required
                type="number"
                min={0}
                max={10}
                value={draft.severityIndex}
                onChange={e => setDraft(prev => ({ ...prev, severityIndex: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-slate-700">FirstAid Guideline ID</p>
              <select
                value={draft.firstAidGuidelineId}
                onChange={e => setDraft(prev => ({ ...prev, firstAidGuidelineId: Number(e.target.value) }))}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-teal-600 ${
                  firstAidError ? 'border-rose-300 focus:border-rose-600' : 'border-slate-300'
                }`}
              >
                <option value={0}>Chọn FirstAid guideline</option>
                {firstAidOptions.map(option => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
              {firstAidError && (
                <p className="mt-1 text-xs text-rose-600">{firstAidError}</p>
              )}
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={e => setDraft(prev => ({ ...prev, isActive: e.target.checked }))}
            />
            Đang hoạt động
          </label>

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
