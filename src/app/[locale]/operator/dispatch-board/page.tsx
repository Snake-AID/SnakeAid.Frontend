'use client';

import type { OperatorRescuer } from '@/utils/operator-mock-state';
import {
  Ambulance,
  Check,
  Filter,
  MapPin,
  Navigation,
  RefreshCw,
  ShieldAlert,
  UserRound,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useOperatorMockState } from '@/utils/operator-mock-state';

const stageLabelMap = {
  Pending: 'Chờ xác minh',
  Verified: 'Chờ điều phối',
  Contacting: 'Đang liên hệ',
  Dispatched: 'Đã điều phối',
  Assigned: 'Đã nhận lệnh',
  EnRoute: 'Đang di chuyển',
  Completed: 'Hoàn tất',
  FalseAlarm: 'Báo động giả',
} as const;

const getPriorityClass = (priority: 'Critical' | 'High' | 'Medium') => {
  if (priority === 'Critical') {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }

  if (priority === 'High') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border-sky-200 bg-sky-50 text-sky-700';
};

const getPriorityLabel = (priority: 'Critical' | 'High' | 'Medium') => {
  if (priority === 'Critical') {
    return 'Khẩn cấp';
  }

  if (priority === 'High') {
    return 'Cao';
  }

  return 'Trung bình';
};

const getRescuerStatusClass = (status: OperatorRescuer['status']) => {
  if (status === 'available') {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (status === 'busy') {
    return 'bg-amber-50 text-amber-700';
  }

  return 'bg-slate-100 text-slate-600';
};

const getRescuerStatusLabel = (status: OperatorRescuer['status']) => {
  if (status === 'available') {
    return 'Sẵn sàng';
  }

  if (status === 'busy') {
    return 'Đang bận';
  }

  return 'Ngoại tuyến';
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const earthRadius = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number.parseFloat((earthRadius * c).toFixed(1));
};

export default function OperatorDispatchBoardPage() {
  const searchParams = useSearchParams();
  const {
    incidents,
    rescuers,
    toastMessage,
    clearToast,
    dispatchIncident,
    setFocusedIncidentId,
  } = useOperatorMockState();

  const queryIncidentId = Number.parseInt(searchParams.get('incidentId') ?? '', 10);
  const queryRescuerId = Number.parseInt(searchParams.get('rescuerId') ?? '', 10);

  const [selectedIncidentId, setSelectedIncidentId] = useState<number>(Number.isInteger(queryIncidentId) ? queryIncidentId : 0);
  const [selectedRescuerId, setSelectedRescuerId] = useState<number | null>(Number.isInteger(queryRescuerId) ? queryRescuerId : null);
  const [onlyInShift, setOnlyInShift] = useState(true);
  const [onlyOnline, setOnlyOnline] = useState(true);
  const [nearbyFirst, setNearbyFirst] = useState(true);

  const dispatchableIncidents = useMemo(
    () => incidents.filter(item => item.bucket === 'queue' || Boolean(item.needsRedispatch)),
    [incidents],
  );

  const selectedIncident = dispatchableIncidents.find(item => item.id === selectedIncidentId) ?? dispatchableIncidents[0];

  const filteredRescuers = useMemo(() => {
    let list = [...rescuers];

    if (onlyInShift) {
      list = list.filter(item => item.inShift);
    }

    if (onlyOnline) {
      list = list.filter(item => item.status !== 'offline');
    }

    if (nearbyFirst && selectedIncident) {
      list.sort(
        (a, b) => distanceKm(selectedIncident.lat, selectedIncident.lng, a.lat, a.lng)
          - distanceKm(selectedIncident.lat, selectedIncident.lng, b.lat, b.lng),
      );
    }

    return list;
  }, [nearbyFirst, onlyInShift, onlyOnline, rescuers, selectedIncident]);

  const handleDispatch = () => {
    if (!selectedIncident || !selectedRescuerId) {
      return;
    }

    void dispatchIncident(selectedIncident.id, selectedRescuerId);
  };

  if (!selectedIncident) {
    return (
      <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50/80">
        <div className="mx-auto flex max-w-360 items-center justify-center px-6 py-20">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-700">Không có dữ liệu sự cố để điều phối.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50/80">
      <div className="mx-auto flex max-w-360 flex-col gap-6 px-6 py-6">
        <section className="rounded-3xl border border-teal-200/60 bg-linear-to-r from-teal-900 via-teal-800 to-teal-700 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-100">Điều phối tác chiến</p>
              <h1 className="mt-2 text-3xl font-bold">Bảng điều phối đội cứu hộ</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-teal-50/90">
                Chọn sự cố, lọc đội cứu hộ, dispatch và cập nhật event để Queue/Map tự động đồng bộ.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-105">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-teal-100">Chờ điều phối</p>
                <p className="mt-1 text-2xl font-bold">{dispatchableIncidents.filter(item => item.bucket === 'queue').length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-teal-100">Đang xử lý</p>
                <p className="mt-1 text-2xl font-bold">{dispatchableIncidents.filter(item => item.bucket === 'progress').length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-teal-100">Đội online</p>
                <p className="mt-1 text-2xl font-bold">{rescuers.filter(item => item.status !== 'offline').length}</p>
              </div>
            </div>
          </div>
        </section>

        {toastMessage && (
          <section className="flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800 shadow-sm">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Thông báo trạng thái</p>
              <p className="mt-1">{toastMessage}</p>
            </div>
            <button
              type="button"
              onClick={clearToast}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100"
            >
              Đóng
            </button>
          </section>
        )}

        <section className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-4">
                <h2 className="text-base font-bold text-slate-900">Chọn sự cố cần điều phối</h2>
              </div>

              <div className="max-h-[calc(100vh-280px)] space-y-4 overflow-y-auto p-4">
                {dispatchableIncidents.map((incident) => {
                  const isActive = incident.id === selectedIncident.id;

                  return (
                    <button
                      key={incident.id}
                      type="button"
                      onClick={() => {
                        setSelectedIncidentId(incident.id);
                        setFocusedIncidentId(incident.id);
                        setSelectedRescuerId(null);
                      }}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        isActive
                          ? 'border-teal-300 bg-teal-50/70 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold text-slate-900">{incident.code}</p>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getPriorityClass(incident.priority)}`}>
                          {getPriorityLabel(incident.priority)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">{incident.district}</p>
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="size-4 text-teal-700" />
                        <span>{incident.address}</span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {stageLabelMap[incident.stage]}
                        </span>
                        {incident.needsRedispatch && (
                          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                            Cần điều phối lại
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-7">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedIncident.code}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      Khu vực
                      {' '}
                      {selectedIncident.district}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{selectedIncident.address}</p>
                  </div>

                  <div className="flex items-start">
                    <button
                      type="button"
                      onClick={handleDispatch}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
                    >
                      <Ambulance className="size-4" />
                      Xác nhận điều phối
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-b border-slate-200 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Filter className="size-4 text-teal-700" />
                  Bộ lọc đội cứu hộ
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setOnlyInShift(prev => !prev)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${
                      onlyInShift ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Chỉ trong ca
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlyOnline(prev => !prev)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${
                      onlyOnline ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Chỉ online
                  </button>
                  <button
                    type="button"
                    onClick={() => setNearbyFirst(prev => !prev)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${
                      nearbyFirst ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Ưu tiên gần nhất
                  </button>
                </div>
              </div>

              <div className="max-h-[calc(100vh-390px)] space-y-3 overflow-y-auto p-4">
                {filteredRescuers.map((rescuer) => {
                  const isSelected = rescuer.id === selectedRescuerId;
                  const canDispatch = rescuer.status === 'available';
                  const rescueDistance = distanceKm(selectedIncident.lat, selectedIncident.lng, rescuer.lat, rescuer.lng);
                  const rescueEta = Math.max(4, Math.round(rescueDistance * 3));

                  return (
                    <button
                      key={rescuer.id}
                      type="button"
                      disabled={!canDispatch}
                      onClick={() => setSelectedRescuerId(rescuer.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-teal-300 bg-teal-50/70 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50'
                      } ${!canDispatch ? 'cursor-not-allowed opacity-65' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{rescuer.name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            Đánh giá
                            {' '}
                            {rescuer.rating.toFixed(1)}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getRescuerStatusClass(rescuer.status)}`}>
                          {getRescuerStatusLabel(rescuer.status)}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="size-4 text-teal-700" />
                          {rescueDistance}
                          {' km'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Navigation className="size-4 text-teal-700" />
                          ETA
                          {' '}
                          {rescueEta}
                          {' phút'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <UserRound className="size-4 text-teal-700" />
                          {rescuer.activeMissions}
                          {' nhiệm vụ'}
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

                {filteredRescuers.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                    <p className="text-sm font-medium text-slate-600">Không có đội cứu hộ phù hợp bộ lọc.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setOnlyInShift(false);
                        setOnlyOnline(false);
                        setNearbyFirst(true);
                      }}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                    >
                      <RefreshCw className="size-3.5" />
                      Đặt lại bộ lọc
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
