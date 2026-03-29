'use client';

import type { Antivenom } from '@/types/antivenom.type';
import type { CreateTreatmentFacilityRequest } from '@/types/treatment-facility.type';
import { Phone, X } from 'lucide-react';
import { useState } from 'react';

interface TreatmentFacilityUpsertModalProps {
  isOpen: boolean;
  mode: 'create' | 'update';
  initialValue: CreateTreatmentFacilityRequest;
  antivenomOptions: Antivenom[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTreatmentFacilityRequest) => Promise<void>;
}

const validatePhoneNumber = (phone: string): { valid: boolean; error?: string } => {
  const trimmed = phone.trim();

  if (!trimmed) {
    return { valid: false, error: 'Số điện thoại không được để trống.' };
  }

  // Remove spaces and hyphens
  const cleaned = trimmed.replace(/[\s\-]/g, '');

  // Check if only contains digits (and optional + at start)
  if (!/^\+?\d+$/.test(cleaned)) {
    return { valid: false, error: 'Số điện thoại chỉ được chứa chữ số và các ký tự +, -.' };
  }

  const digits = cleaned.replace(/\D/g, '');

  // Support hotline numbers such as 1900 8989 / 1800 1234 (8 digits)
  if ((digits.startsWith('1900') || digits.startsWith('1800')) && digits.length === 8) {
    return { valid: true };
  }

  // Mobile/landline/international numbers: 10-15 digits
  if (digits.length < 10) {
    return {
      valid: false,
      error: `Số điện thoại phải có ít nhất 10 chữ số hoặc là số tổng đài 1800/1900 (hiện có ${digits.length} chữ số).`,
    };
  }

  // Check maximum length (at most 15 digits - international standard)
  if (digits.length > 15) {
    return { valid: false, error: `Số điện thoại không được vượt quá 15 chữ số (hiện có ${digits.length} chữ số).` };
  }

  return { valid: true };
};

export default function TreatmentFacilityUpsertModal({
  isOpen,
  mode,
  initialValue,
  antivenomOptions,
  isSubmitting,
  onClose,
  onSubmit,
}: TreatmentFacilityUpsertModalProps) {
  const [draft, setDraft] = useState<CreateTreatmentFacilityRequest>(initialValue);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const toggleAntivenom = (id: number) => {
    setDraft((prev) => {
      const exists = prev.antivenomIds.includes(id);
      return {
        ...prev,
        antivenomIds: exists
          ? prev.antivenomIds.filter(item => item !== id)
          : [...prev.antivenomIds, id],
      };
    });
  };

  const handlePhoneChange = (value: string) => {
    setDraft(prev => ({ ...prev, contactNumber: value }));

    // Validate on change
    const validation = validatePhoneNumber(value);
    if (!validation.valid && value.trim()) {
      setPhoneError(validation.error ?? 'Định dạng số điện thoại không hợp lệ.');
    } else {
      setPhoneError(null);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    // Validate phone number before submit
    const phoneValidation = validatePhoneNumber(draft.contactNumber);
    if (!phoneValidation.valid) {
      setPhoneError(phoneValidation.error ?? 'Định dạng số điện thoại không hợp lệ.');
      return;
    }

    try {
      await onSubmit({
        name: draft.name.trim(),
        address: draft.address.trim(),
        contactNumber: draft.contactNumber.trim(),
        latitude: Number(draft.latitude),
        longitude: Number(draft.longitude),
        antivenomIds: draft.antivenomIds,
        isActive: true,
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
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {mode === 'create' ? 'Thêm cơ sở điều trị mới' : 'Cập nhật cơ sở điều trị'}
            </h3>
            <p className="text-sm text-slate-500">Nhập thông tin cơ sở điều trị theo dữ liệu chuẩn.</p>
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
            <p className="mb-2 text-xs font-semibold text-slate-700">Tên cơ sở điều trị</p>
            <input
              required
              value={draft.name}
              onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-700">Địa chỉ</p>
            <textarea
              required
              rows={3}
              value={draft.address}
              onChange={e => setDraft(prev => ({ ...prev, address: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-700">
                <Phone className="size-3.5" />
                Số liên hệ
              </p>
              <input
                required
                value={draft.contactNumber}
                onChange={e => handlePhoneChange(e.target.value)}
                placeholder="Ví dụ: 0912345678 hoặc +84912345678"
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-teal-600 ${
                  phoneError ? 'border-rose-300 focus:border-rose-600' : 'border-slate-300'
                }`}
              />
              {phoneError && (
                <p className="mt-1 text-xs text-rose-600">{phoneError}</p>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-700">Vĩ độ (latitude)</p>
              <input
                type="number"
                step="any"
                required
                value={draft.latitude}
                onChange={e => setDraft(prev => ({ ...prev, latitude: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-700">Kinh độ (longitude)</p>
              <input
                type="number"
                step="any"
                required
                value={draft.longitude}
                onChange={e => setDraft(prev => ({ ...prev, longitude: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-700">Huyết thanh đang có</p>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
              {antivenomOptions.length === 0
                ? (
                    <p className="text-sm text-slate-500">Không có dữ liệu huyết thanh.</p>
                  )
                : antivenomOptions.map(option => (
                    <label
                      key={option.id}
                      aria-label={`Chọn huyết thanh ${option.name}`}
                      className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={draft.antivenomIds.includes(option.id)}
                        onChange={() => toggleAntivenom(option.id)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-slate-800">{option.name}</span>
                        <span className="block text-xs text-slate-500">{option.manufacturer}</span>
                      </span>
                    </label>
                  ))}
            </div>
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
