'use client';

import type { IncidentBucket, IncidentStage } from '@/utils/operator-mock-state';
import {
  ArrowRight,
  BellRing,
  Clock3,
  Crosshair,
  Flag,
  MapPin,
  Phone,
  ShieldAlert,
  TriangleAlert,
  UserRound,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useRescuerHub } from '@/hooks/useRescuerHub';
import {
  useOperatorMockState,
} from '@/utils/operator-mock-state';

const bucketMeta: Record<IncidentBucket, { label: string; tone: string }> = {
  queue: { label: 'Hàng chờ', tone: 'bg-teal-700 text-white' },
  progress: { label: 'Đang xử lý', tone: 'bg-amber-500 text-white' },
  history: { label: 'Lịch sử / Hoàn tất', tone: 'bg-slate-700 text-white' },
};

const stageLabelMap: Record<IncidentStage, string> = {
  Pending: 'Chờ xác minh',
  Verified: 'Đã xác minh',
  Contacting: 'Đang liên hệ',
  Dispatched: 'Đã điều phối',
  Assigned: 'Đã nhận lệnh',
  EnRoute: 'Đang di chuyển',
  Completed: 'Hoàn tất',
  FalseAlarm: 'Báo động giả',
};

const timelineLabelMap: Record<string, string> = {
  Created: 'Đã tạo',
  Contacting: 'Đang liên hệ',
  Verified: 'Đã xác minh',
  Dispatched: 'Đã điều phối',
  Assigned: 'Đã nhận lệnh',
  EnRoute: 'Đang di chuyển',
  Completed: 'Hoàn tất',
};

const priorityLabelMap = {
  Critical: 'Khẩn cấp',
  High: 'Cao',
  Medium: 'Trung bình',
} as const;

const rescuerStatusLabelMap = {
  available: 'Sẵn sàng',
  busy: 'Đang bận',
  offline: 'Ngoại tuyến',
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

const getRescuerStatusClass = (status: 'available' | 'busy' | 'offline') => {
  if (status === 'available') {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (status === 'busy') {
    return 'bg-amber-50 text-amber-700';
  }

  return 'bg-rose-50 text-rose-700';
};

export default function OperatorQueuePage() {
  const router = useRouter();
  const params = useParams<{ locale?: string | string[] }>();
  const locale = Array.isArray(params.locale) ? params.locale[0] : (params.locale ?? 'en');

  const {
    incidents,
    rescuers,
    toastMessage,
    clearToast,
    markFalseAlarm,
    markContacting,
    pinRedispatch,
    completeIncident,
    setFocusedIncidentId,
    confirmIncident,
    addNewIncident,
  } = useOperatorMockState();

  const [pendingNewIncident, setPendingNewIncident] = useState<{ incidentId: string; memberId: string; latitude: number; longitude: number; updatedAt: string } | null>(null);

  const getMockIncidentId = (incidentId: string) =>
    Number.parseInt(incidentId.replace(/\D/g, '').slice(-6), 10) || 0;

  const handleConfirmNewIncident = () => {
    if (!pendingNewIncident) {
      return;
    }
    const id = getMockIncidentId(pendingNewIncident.incidentId);
    confirmIncident(id);
    setPendingNewIncident(null);
  };

  useRescuerHub({
    onNewIncidentCreated: (payload) => {
      addNewIncident(payload);
      setPendingNewIncident(payload);
    },
  });

  const [activeBucket, setActiveBucket] = useState<IncidentBucket>('queue');
  const [selectedIncidentId, setSelectedIncidentId] = useState<number>(incidents[0]?.id ?? 0);

  const incidentsByBucket = useMemo(
    () => ({
      queue: incidents.filter(item => item.bucket === 'queue'),
      progress: incidents.filter(item => item.bucket === 'progress'),
      history: incidents.filter(item => item.bucket === 'history'),
    }),
    [incidents],
  );

  const visibleIncidents = incidentsByBucket[activeBucket];
  const selectedIncident = visibleIncidents.find(item => item.id === selectedIncidentId)
    ?? visibleIncidents[0]
    ?? incidents.find(item => item.id === selectedIncidentId)
    ?? incidents[0];

  const quickSuggestedRescuers = selectedIncident
    ? selectedIncident.suggestedRescuers.filter(rescuer => rescuer.status === 'available').slice(0, 3)
    : [];
  const canDispatchSelectedIncident = selectedIncident
    ? selectedIncident.bucket === 'queue' || Boolean(selectedIncident.needsRedispatch)
    : false;

  const getCurrentRescuerName = (rescuerId?: number) => {
    if (!rescuerId) {
      return 'Chưa có đội cứu hộ';
    }

    return rescuers.find(item => item.id === rescuerId)?.name ?? 'Chưa có đội cứu hộ';
  };

  const handleOpenDispatchBoard = (incidentId: number, rescuerId?: number) => {
    const query = new URLSearchParams({ incidentId: `${incidentId}` });

    if (rescuerId) {
      query.set('rescuerId', `${rescuerId}`);
    }

    router.push(`/${locale}/operator/dispatch-board?${query.toString()}`);
  };

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50/80">
      <div className="mx-auto flex max-w-360 flex-col gap-6 px-6 py-6">
        <section className="rounded-3xl border border-teal-200/60 bg-linear-to-r from-teal-900 via-teal-800 to-teal-700 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-100">
                Hàng chờ điều phối
              </p>
              <h1 className="mt-2 text-3xl font-bold">Luồng theo dõi và xử lý sự cố</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-teal-50/90">
                Queue ưu tiên case cần xử lý. Điều phối chính thức được thực hiện ở Bảng điều phối.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-105">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-teal-100">Hàng chờ</p>
                <p className="mt-1 text-2xl font-bold">{incidentsByBucket.queue.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-teal-100">Đang xử lý</p>
                <p className="mt-1 text-2xl font-bold">{incidentsByBucket.progress.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-teal-100">Cần điều phối lại</p>
                <p className="mt-1 text-2xl font-bold">{incidents.filter(item => item.needsRedispatch).length}</p>
              </div>
            </div>
          </div>
        </section>

        {toastMessage && (
          <div className="flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800 shadow-sm">
            <BellRing className="mt-0.5 size-4 shrink-0" />
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
          </div>
        )}

        {pendingNewIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="text-lg font-bold text-slate-900">Case mới vừa đến</h2>
              <p className="mt-2 text-sm text-slate-600">
                Có case mới được báo từ member, vui lòng xác nhận để đưa vào luồng xử lý.
              </p>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Vị trí (lat/lng)</p>
                  <span className="text-xs text-slate-500">{pendingNewIncident.updatedAt ?? ''}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  {pendingNewIncident.latitude.toFixed(5)}
                  ,
                  {pendingNewIncident.longitude.toFixed(5)}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="size-4 text-teal-700" />
                  <span>
                    Member ID:
                    {pendingNewIncident.memberId}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setPendingNewIncident(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Bỏ qua
                </button>
                <button
                  type="button"
                  onClick={handleConfirmNewIncident}
                  className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  Xác nhận case
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap gap-2 border-b border-slate-200 p-4">
                {(Object.keys(bucketMeta) as IncidentBucket[]).map((bucket) => {
                  const isActive = activeBucket === bucket;

                  return (
                    <button
                      key={bucket}
                      type="button"
                      onClick={() => setActiveBucket(bucket)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                        isActive
                          ? bucketMeta[bucket].tone
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {bucketMeta[bucket].label}
                      <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs">
                        {incidentsByBucket[bucket].length}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="max-h-[calc(100vh-260px)] space-y-4 overflow-y-auto p-4">
                {visibleIncidents.map((incident) => {
                  const isSelected = selectedIncident?.id === incident.id;

                  return (
                    <button
                      key={incident.id}
                      type="button"
                      onClick={() => {
                        setSelectedIncidentId(incident.id);
                        setFocusedIncidentId(incident.id);
                      }}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-teal-300 bg-teal-50/70 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{incident.code}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {incident.district}
                            {' | '}
                            {incident.createdAt}
                          </p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getPriorityClass(incident.priority)}`}>
                          {priorityLabelMap[incident.priority]}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="size-4 text-teal-700" />
                        <span className="truncate">{incident.address}</span>
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
            {selectedIncident && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-bold text-slate-900">{selectedIncident.code}</h2>
                        <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800">
                          {stageLabelMap[selectedIncident.stage]}
                        </span>
                        {selectedIncident.needsRedispatch && (
                          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                            Đội cứu hộ đã hủy nhiệm vụ
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:items-center">
                        <span className="inline-flex items-center gap-2">
                          <Clock3 className="size-4 text-teal-700" />
                          {selectedIncident.createdAt}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="size-4 text-teal-700" />
                          {selectedIncident.address}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <UserRound className="size-4 text-teal-700" />
                          {selectedIncident.reporter}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Phone className="size-4 text-teal-700" />
                          {selectedIncident.phone}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:w-70">
                      <button
                        type="button"
                        onClick={() => void markFalseAlarm(selectedIncident.id)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        Đánh dấu báo động giả
                      </button>
                      <button
                        type="button"
                        onClick={() => completeIncident(selectedIncident.id)}
                        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100"
                      >
                        Đánh dấu hoàn tất
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 p-5 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-6">
                    <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Flag className="size-4 text-teal-700" />
                        Trạng thái hiện tại
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{selectedIncident.notes}</p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-white p-3 shadow-sm">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Đội cứu hộ hiện tại</p>
                          <p className="mt-1 font-semibold text-slate-800">
                            {getCurrentRescuerName(selectedIncident.currentRescuerId)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white p-3 shadow-sm">
                          <p className="text-xs uppercase tracking-wide text-slate-400">ETA</p>
                          <p className="mt-1 font-semibold text-slate-800">{selectedIncident.eta ?? 'Đang chờ điều phối'}</p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <ArrowRight className="size-4 text-teal-700" />
                        Dòng thời gian sự cố
                      </div>

                      <div className="space-y-3">
                        {selectedIncident.timeline.map(step => (
                          <div key={step.label} className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                            <span className={`inline-flex size-3 rounded-full ${step.done ? 'bg-teal-600' : 'bg-slate-300'}`}></span>
                            <div className="flex-1">
                              <p className={`text-sm font-semibold ${step.done ? 'text-slate-900' : 'text-slate-500'}`}>
                                {timelineLabelMap[step.label] ?? step.label}
                              </p>
                            </div>
                            <span className="text-xs font-medium text-slate-500">{step.at}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="space-y-6">
                    <section className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-teal-900">
                          <Crosshair className="size-4" />
                          Gợi ý nhanh (Top 3 sẵn sàng)
                        </div>
                        <button
                          type="button"
                          disabled={!canDispatchSelectedIncident}
                          onClick={() => handleOpenDispatchBoard(selectedIncident.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <ArrowRight className="size-3.5" />
                          Mở điều phối
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {!canDispatchSelectedIncident && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-5 text-center">
                            <p className="text-sm font-medium text-amber-800">
                              Ca này đang có đội cứu hộ xử lý. Chỉ điều phối lại khi case chuyển về trạng thái cần điều phối lại.
                            </p>
                          </div>
                        )}

                        {canDispatchSelectedIncident && quickSuggestedRescuers.map(rescuer => (
                          <div key={rescuer.id} className="rounded-xl border border-white/60 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900">{rescuer.name}</p>
                                <p className="mt-1 text-sm text-slate-500">
                                  Ca trực
                                  {' '}
                                  {rescuer.shift}
                                </p>
                              </div>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getRescuerStatusClass(rescuer.status)}`}>
                                {rescuerStatusLabelMap[rescuer.status]}
                              </span>
                            </div>

                            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                              <span>
                                {rescuer.distanceKm}
                                {' '}
                                km
                              </span>
                              <span>
                                ETA
                                {rescuer.etaMin}
                                {' '}
                                phút
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenDispatchBoard(selectedIncident.id, rescuer.id)}
                              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-100"
                            >
                              <ArrowRight className="size-4" />
                              Mở điều phối với đội này
                            </button>
                          </div>
                        ))}

                        {canDispatchSelectedIncident && quickSuggestedRescuers.length === 0 && (
                          <div className="rounded-xl border border-dashed border-teal-200 bg-white px-4 py-5 text-center">
                            <p className="text-sm font-medium text-slate-700">
                              Không có đội sẵn sàng trong gợi ý nhanh.
                            </p>
                          </div>
                        )}
                      </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <TriangleAlert className="size-4 text-amber-600" />
                        Thao tác nhanh
                      </div>

                      <div className="mt-4 grid gap-3">
                        <button
                          type="button"
                          onClick={() => void markContacting(selectedIncident.id)}
                          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Gọi lại người báo tin
                        </button>
                        <button
                          type="button"
                          onClick={() => pinRedispatch(selectedIncident.id)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          Đẩy lên đầu hàng chờ
                        </button>
                        <button
                          type="button"
                          disabled={!canDispatchSelectedIncident}
                          onClick={() => handleOpenDispatchBoard(selectedIncident.id)}
                          className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Mở bảng điều phối
                        </button>
                      </div>
                    </section>

                    {selectedIncident.needsRedispatch && (
                      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
                        <div className="flex items-start gap-3">
                          <ShieldAlert className="mt-0.5 size-5 shrink-0" />
                          <div>
                            <p className="font-semibold">Cần điều phối lại</p>
                            <p className="mt-1 text-sm leading-6">
                              Case đang nằm ở top queue. Chọn đội mới trong bảng điều phối.
                            </p>
                          </div>
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
