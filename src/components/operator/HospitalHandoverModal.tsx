/* eslint-disable react-hooks-extra/no-direct-set-state-in-use-effect */
'use client';

import type { TreatmentFacilityResponse } from '@/types/treatment-facility.type';
import { Building2, CheckCircle, MapPin, Phone, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { incidentApi } from '@/apis/incident.api';
import { treatmentFacilityApi } from '@/apis/treatment-facility.api';
import { useToast } from '@/components/ToastProvider';

export interface HospitalHandoverModalProps {
  incidentId: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DEFAULT_HANDOVER_NOTE
  = 'Đã xác nhận bệnh viện sẽ tiếp nhận ca và đã thông báo cho nạn nhân và người nhà.';

export default function HospitalHandoverModal({
  incidentId,
  latitude,
  longitude,
  isOpen,
  onClose,
  onSuccess,
}: HospitalHandoverModalProps) {
  const [hospitals, setHospitals] = useState<TreatmentFacilityResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Manual input fallback
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [manualHospitalName, setManualHospitalName] = useState('');
  const [manualHospitalPhone, setManualHospitalPhone] = useState('');

  // Required confirmation and note fields
  const [handoverConfirmed, setHandoverConfirmed] = useState(false);
  const [handoverNote, setHandoverNote] = useState(DEFAULT_HANDOVER_NOTE);
  const [noteError, setNoteError] = useState<string | null>(null);

  const { showToast } = useToast();

  const loadHospitals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await treatmentFacilityApi.findNearestHospitals(latitude, longitude);
      setHospitals(response ?? []);
    } catch (err) {
      console.error('Failed to load hospitals', err);
      setError('Không thể tải danh sách bệnh viện. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude]);

  const resetForm = useCallback(() => {
    setSelectedHospitalId(null);
    setUseManualEntry(false);
    setManualHospitalName('');
    setManualHospitalPhone('');
    setHandoverConfirmed(false);
    setHandoverNote(DEFAULT_HANDOVER_NOTE);
    setNoteError(null);
    setSubmitError(null);
    setError(null);
  }, []);

  // Load hospitals when modal opens
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    loadHospitals();
  }, [isOpen, loadHospitals]);

  // Reset form when modal closes
  useEffect(() => {
    if (isOpen) {
      return;
    }
    resetForm();
  }, [isOpen, resetForm]);

  const selectedHospital = selectedHospitalId
    ? hospitals.find(h => h.id === selectedHospitalId)
    : null;

  const validateForm = () => {
    if (!handoverConfirmed) {
      setNoteError('Vui lòng xác nhận đã liên hệ bệnh viện và thông báo cho nạn nhân, người nhà.');
      return false;
    }

    if (!handoverNote.trim()) {
      setNoteError('Vui lòng nhập ghi chú chuyển tuyến bằng tiếng Việt.');
      return false;
    }

    if (useManualEntry && !manualHospitalName.trim()) {
      setNoteError('Vui lòng nhập tên bệnh viện.');
      return false;
    }

    if (!useManualEntry && !selectedHospitalId) {
      setNoteError('Vui lòng chọn hoặc nhập thông tin bệnh viện.');
      return false;
    }

    setNoteError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const hospitalName = useManualEntry ? manualHospitalName : selectedHospital?.name;
      const hospitalPhone = useManualEntry ? manualHospitalPhone : selectedHospital?.contactNumber;

      if (!hospitalName) {
        throw new Error('Không xác định được tên bệnh viện.');
      }

      await incidentApi.handoverToHospital(incidentId, {
        hospitalName,
        hospitalPhone,
        note: handoverNote,
      });

      showToast('Đã chuyển tuyến bệnh viện thành công.', { type: 'success' });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to handover to hospital', err);
      const errorMessage = err instanceof Error ? err.message : 'Chuyển tuyến thất bại. Vui lòng thử lại.';
      setSubmitError(errorMessage);
      showToast(errorMessage, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[min(700px,90vh)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Chuyển tuyến bệnh viện</h2>
            <p className="text-xs text-slate-500">Tìm hoặc nhập thông tin bệnh viện gần nhất</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
              <button
                type="button"
                onClick={() => loadHospitals()}
                className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:underline"
              >
                <RefreshCw className="size-3" />
                Thử lại
              </button>
            </div>
          )}

          {/* Hospital list or manual entry toggle */}
          <div className="space-y-4">
            {/* Toggle: Use automatic list or manual entry */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUseManualEntry(false)}
                disabled={isLoading}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  !useManualEntry
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Danh sách bệnh viện gần nhất
              </button>
              <button
                type="button"
                onClick={() => setUseManualEntry(true)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  useManualEntry
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Nhập thông tin thủ công
              </button>
            </div>

            {/* Automatic Hospital List */}
            {!useManualEntry && (
              <div>
                {isLoading
                  ? (
                      <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                        Đang tải danh sách bệnh viện...
                      </div>
                    )
                  : hospitals.length === 0
                    ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                          <p className="text-sm font-medium text-slate-600">
                            Không tìm thấy bệnh viện trong bán kính tìm kiếm.
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Vui lòng nhập thông tin thủ công hoặc liên hệ quản lý hệ thống.
                          </p>
                          <button
                            type="button"
                            onClick={() => setUseManualEntry(true)}
                            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-200"
                          >
                            Nhập thông tin thủ công
                          </button>
                        </div>
                      )
                    : (
                        <div className="space-y-3">
                          {hospitals.map(hospital => (
                            <button
                              key={hospital.id}
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => setSelectedHospitalId(hospital.id)}
                              className={`w-full rounded-xl border p-3 text-left transition-all ${
                                selectedHospitalId === hospital.id
                                  ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                                  : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-slate-50'
                              } disabled:opacity-50`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900">{hospital.name}</p>
                                  <div className="mt-2 space-y-1 text-sm text-slate-600">
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="size-3.5 text-emerald-700" />
                                      <span>{hospital.address}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Phone className="size-3.5 text-emerald-700" />
                                      <span>{hospital.contactNumber || 'Không có số điện thoại'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                                    {hospital.distanceKm.toFixed(1)}
                                    {' '}
                                    km
                                  </span>
                                  {selectedHospitalId === hospital.id && (
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">
                                      <CheckCircle className="size-3" />
                                      Đã chọn
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
              </div>
            )}

            {/* Manual Entry Form */}
            {useManualEntry && (
              <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div>
                  <label htmlFor="hospital-name" className="block text-sm font-semibold text-slate-900">
                    Tên bệnh viện
                    <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="hospital-name"
                    type="text"
                    placeholder="Nhập tên bệnh viện"
                    value={manualHospitalName}
                    onChange={e => setManualHospitalName(e.target.value)}
                    disabled={isSubmitting}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label htmlFor="hospital-phone" className="block text-sm font-semibold text-slate-900">
                    Số điện thoại (tùy chọn)
                  </label>
                  <input
                    id="hospital-phone"
                    type="tel"
                    placeholder="VD: 0283 xxx xxxx"
                    value={manualHospitalPhone}
                    onChange={e => setManualHospitalPhone(e.target.value)}
                    disabled={isSubmitting}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-slate-100"
                  />
                </div>
              </div>
            )}

            {/* Handover note */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <label htmlFor="handover-confirm" className="flex items-start gap-2 cursor-pointer">
                <input
                  id="handover-confirm"
                  type="checkbox"
                  checked={handoverConfirmed}
                  onChange={e => setHandoverConfirmed(e.target.checked)}
                  disabled={isSubmitting}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-2 focus:ring-amber-600"
                />
                <span className="flex-1 text-sm text-amber-900">
                  <span className="font-semibold">Tôi xác nhận rằng:</span>
                  <br />
                  Đã liên hệ bệnh viện và đã thông báo cho nạn nhân/người nhà về sự cố.
                </span>
              </label>

              <div className="mt-4">
                <label htmlFor="handover-note" className="block text-sm font-semibold text-amber-950">
                  Ghi chú chuyển tuyến
                </label>
                <input
                  id="handover-note"
                  type="text"
                  value={handoverNote}
                  onChange={e => setHandoverNote(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Đã xác nhận bệnh viện có khả năng tiếp nhận và đã thông báo cho nạn nhân và người nhà."
                  className="mt-2 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none disabled:bg-slate-100"
                />
                <p className="mt-2 text-xs text-amber-800">
                  Có thể giữ nguyên nội dung mặc định hoặc sửa ngắn gọn theo thực tế.
                </p>
              </div>

              {noteError && (
                <p className="mt-2 text-xs font-semibold text-rose-700">{noteError}</p>
              )}
            </div>

            {submitError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {submitError}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!handoverConfirmed || !handoverNote.trim() || (!useManualEntry && !selectedHospitalId) || isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Building2 className="size-4" />
            {isSubmitting ? 'Đang chuyển tuyến...' : 'Xác nhận chuyển tuyến'}
          </button>
        </div>
      </div>
    </div>
  );
}
