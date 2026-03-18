'use client';

import type { OnDutyRescuerItemResponse } from '@/types/operator.type';
import { Ambulance, Check, MapPin, Navigation, RefreshCw, UserRound, X } from 'lucide-react';

import { useEffect, useMemo, useState } from 'react';
import { operatorApi } from '@/apis/operator.api';
import { useToast } from '@/components/ToastProvider';

export interface DispatchRescuerModalProps {
  incidentId: string;
  isOpen: boolean;
  onClose: () => void;
  onDispatch: (rescuerId: string) => Promise<void>;
}

export default function DispatchRescuerModal({
  incidentId,
  isOpen,
  onClose,
  onDispatch,
}: DispatchRescuerModalProps) {
  const [rescuers, setRescuers] = useState<OnDutyRescuerItemResponse[]>([]);
  const [selectedRescuerId, setSelectedRescuerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const [onlyInShift, setOnlyInShift] = useState(true);
  const [onlyOnline, setOnlyOnline] = useState(true);
  const [sortByDistance, setSortByDistance] = useState(true);

  const loadRescuers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await operatorApi.getOnDutyRescuers({
        incidentId,
        onlyAvailable: true,
      });
      setRescuers(response.rescuers);
    } catch (err) {
      console.error('Failed to load on-duty rescuers', err);
      setError('Không thể tải danh sách đội cứu hộ. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRescuers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, incidentId]);

  const filteredRescuers = useMemo(() => {
    let list = [...rescuers];

    if (onlyInShift) {
      list = list.filter(item => item.isOnDutyNow || item.assignmentStatus === 'Active');
    }

    if (onlyOnline) {
      list = list.filter(item => item.isOnline);
    }

    if (sortByDistance) {
      list.sort((a, b) => {
        const distA = a.distanceKm ?? Number.MAX_VALUE;
        const distB = b.distanceKm ?? Number.MAX_VALUE;
        return distA - distB;
      });
    }

    return list;
  }, [onlyInShift, onlyOnline, sortByDistance, rescuers]);

  const handleDispatch = async () => {
    if (!selectedRescuerId) {
      return;
    }

    setIsDispatching(true);
    try {
      await onDispatch(selectedRescuerId);
      onClose();
      showToast('Điều phối đội cứu hộ thành công.', { type: 'success' });
    } catch (err) {
      console.error('Failed to dispatch rescuer', err);
      setError('Không thể điều phối. Vui lòng thử lại.');
      showToast('Điều phối thất bại. Vui lòng thử lại.', { type: 'error' });
    } finally {
      setIsDispatching(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[min(600px,90vh)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Điều phối cứu hộ</h2>
            <p className="text-xs text-slate-500">Chọn đội cứu hộ để điều phối</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
            <button
              type="button"
              onClick={loadRescuers}
              className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:underline"
            >
              <RefreshCw className="size-3" />
              Thử lại
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <RefreshCw className="size-4 text-teal-700" />
            Bộ lọc đội cứu hộ
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOnlyInShift(prev => !prev)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                onlyInShift ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Chỉ trong ca
            </button>
            <button
              type="button"
              onClick={() => setOnlyOnline(prev => !prev)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                onlyOnline ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Chỉ online
            </button>
            <button
              type="button"
              onClick={() => setSortByDistance(prev => !prev)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                sortByDistance ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Ưu tiên gần nhất
            </button>
          </div>
        </div>

        {/* Rescuer list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading
            ? (
                <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                  Đang tải danh sách đội cứu hộ...
                </div>
              )
            : filteredRescuers.length === 0
              ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                    <p className="text-sm font-medium text-slate-600">Không có đội cứu hộ phù hợp bộ lọc.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setOnlyInShift(false);
                        setOnlyOnline(false);
                        setSortByDistance(true);
                      }}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                    >
                      <RefreshCw className="size-3.5" />
                      Đặt lại bộ lọc
                    </button>
                  </div>
                )
              : (
                  <div className="space-y-3">
                    {filteredRescuers.map((rescuer) => {
                      const isSelected = rescuer.rescuerId === selectedRescuerId;
                      const canDispatch = rescuer.isOnline && rescuer.isAvailable;
                      const rescueDistance = rescuer.distanceKm;
                      const rescueEta = rescueDistance ? Math.max(4, Math.round(rescueDistance * 3)) : null;

                      return (
                        <button
                          key={rescuer.rescuerId}
                          type="button"
                          disabled={!canDispatch}
                          onClick={() => setSelectedRescuerId(rescuer.rescuerId)}
                          className={`w-full rounded-2xl border p-4 text-left transition-all ${
                            isSelected
                              ? 'border-teal-300 bg-teal-50/70 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50'
                          } ${!canDispatch ? 'cursor-not-allowed opacity-65' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{rescuer.fullName}</p>
                              <p className="mt-1 text-sm text-slate-500">
                                {rescuer.phoneNumber ?? 'Không có số điện thoại'}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                rescuer.isAvailable && rescuer.isOnline
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {rescuer.isAvailable && rescuer.isOnline ? 'Sẵn sàng' : 'Đang bận'}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="size-4 text-teal-700" />
                              {rescueDistance ? `${rescueDistance} km` : 'N/A'}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Navigation className="size-4 text-teal-700" />
                              ETA
                              {' '}
                              {rescueEta ? `${rescueEta} phút` : 'N/A'}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <UserRound className="size-4 text-teal-700" />
                              Ca:
                              {' '}
                              {rescuer.shiftName}
                            </span>
                          </div>

                          {isSelected && (
                            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-700">
                              <Check className="size-3.5" />
                              Đã chọn để điều phối
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleDispatch}
            disabled={!selectedRescuerId || isDispatching}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Ambulance className="size-4" />
            {isDispatching ? 'Đang điều phối...' : 'Xác nhận điều phối'}
          </button>
        </div>
      </div>
    </div>
  );
}
