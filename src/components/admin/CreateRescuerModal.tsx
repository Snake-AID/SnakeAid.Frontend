'use client';

import type { AdminCreateRescuerRequest, RescuerType } from '@/types/admin-management.type';
import { Eye, EyeOff, Loader2, ShieldCheck, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { adminUserApi } from '@/apis/admin-user.api';
import { ApiClientError } from '@/apis/client';
import { useToast } from '@/components/ToastProvider';

interface CreateRescuerModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const RESCUER_TYPE_OPTIONS: Array<{ value: RescuerType; label: string; desc: string }> = [
  {
    value: 'Emergency',
    label: 'Khẩn cấp',
    desc: 'Xử lý rắn cắn và tình huống nguy cấp',
  },
  {
    value: 'Catching',
    label: 'Bắt rắn',
    desc: 'Chuyên bắt và di chuyển rắn an toàn',
  },
  {
    value: 'Both',
    label: 'Đa nhiệm',
    desc: 'Có thể xử lý cả hai loại tình huống',
  },
];

const getValidationMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof ApiClientError)) {
    return fallback;
  }

  const validationEntries = Object.entries(error.error?.validationErrors ?? {});
  if (!validationEntries.length) {
    return error.message || fallback;
  }

  return validationEntries
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join(' | ');
};

export default function CreateRescuerModal({ onClose, onSuccess }: CreateRescuerModalProps) {
  const { showToast } = useToast();

  const [form, setForm] = useState<AdminCreateRescuerRequest>({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    type: 'Emergency',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof AdminCreateRescuerRequest | 'general', string>>>({});

  const validate = (): boolean => {
    const next: typeof errors = {};

    if (!form.email.trim()) {
      next.email = 'Vui lòng nhập email.';
    } else if (!/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(form.email)) {
      next.email = 'Email không đúng định dạng.';
    }

    if (!form.password) {
      next.password = 'Vui lòng nhập mật khẩu.';
    } else if (form.password.length < 8) {
      next.password = 'Mật khẩu phải có ít nhất 8 ký tự.';
    }

    if (!form.fullName.trim()) {
      next.fullName = 'Vui lòng nhập họ tên.';
    } else if (form.fullName.trim().length > 200) {
      next.fullName = 'Họ tên tối đa 200 ký tự.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload: AdminCreateRescuerRequest = {
        ...form,
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber?.trim() || undefined,
      };

      await adminUserApi.createRescuer(payload);
      showToast(`Đã tạo tài khoản cứu hộ cho ${payload.fullName}.`, { type: 'success' });
      onSuccess();
      onClose();
    } catch (error) {
      const message = getValidationMessage(error, 'Tạo tài khoản thất bại. Vui lòng thử lại.');
      setErrors({ general: message });
      showToast(message, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 shadow-sm">
              <UserPlus className="size-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Đăng ký tài khoản Cứu hộ</h3>
              <p className="text-xs text-slate-500">Tạo tài khoản mới cho thành viên đội cứu hộ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[65vh] overflow-y-auto p-6">
          {errors.general && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {errors.general}
            </div>
          )}

          <div className="space-y-4">
            {/* Full name */}
            <div>
              <label htmlFor="rescuer-fullname" className="mb-1 block text-sm font-semibold text-slate-700">
                Họ và tên
                {' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                id="rescuer-fullname"
                type="text"
                value={form.fullName}
                onChange={e => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Nguyễn Văn A"
                disabled={isSubmitting}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-emerald-600 disabled:opacity-50 ${errors.fullName ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-slate-50'}`}
              />
              {errors.fullName && <p className="mt-1 text-xs text-rose-600">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="rescuer-email" className="mb-1 block text-sm font-semibold text-slate-700">
                Email
                {' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                id="rescuer-email"
                type="email"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="rescuer@snakeaid.com"
                disabled={isSubmitting}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-emerald-600 disabled:opacity-50 ${errors.email ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-slate-50'}`}
              />
              {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="rescuer-password" className="mb-1 block text-sm font-semibold text-slate-700">
                Mật khẩu
                {' '}
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="rescuer-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Tối thiểu 8 ký tự"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border py-2.5 pl-3.5 pr-10 text-sm outline-none transition-colors focus:border-emerald-600 disabled:opacity-50 ${errors.password ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-slate-50'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="rescuer-phone" className="mb-1 block text-sm font-semibold text-slate-700">
                Số điện thoại
                {' '}
                <span className="text-xs font-normal text-slate-400">(tuỳ chọn)</span>
              </label>
              <input
                id="rescuer-phone"
                type="tel"
                value={form.phoneNumber}
                onChange={e => setForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="+840123456789"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-emerald-600 disabled:opacity-50"
              />
            </div>

            {/* Rescuer type */}
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Loại cứu hộ
                {' '}
                <span className="text-rose-500">*</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {RESCUER_TYPE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setForm(prev => ({ ...prev, type: option.value }))}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all disabled:opacity-50 ${
                      form.type === option.value
                        ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-400'
                        : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">{option.label}</span>
                      {form.type === option.value && (
                        <ShieldCheck className="size-4 text-emerald-600" />
                      )}
                    </div>
                    <span className="mt-1 text-[11px] leading-snug text-slate-500">{option.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow disabled:opacity-50"
          >
            {isSubmitting
              ? <Loader2 className="size-4 animate-spin" />
              : <UserPlus className="size-4" />}
            Tạo tài khoản
          </button>
        </div>
      </div>
    </div>
  );
}
