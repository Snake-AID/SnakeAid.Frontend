import type { MutableRefObject } from 'react';
import type { OperatorMapIncident } from '@/hooks/useOperatorIncidents';
import type { OperatorRequestSummary } from '@/hooks/useOperatorRequests';
import type { LiveRescuer } from '@/hooks/useOperatorRescuers';
import type { BriefRescuerProfileResponse } from '@/types/operator.type';
import { MapPin, ShieldCheck, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

interface OperatorInfoPanelsProps {
  incidents: OperatorMapIncident[];
  requests: OperatorRequestSummary[];
  liveRescuers: LiveRescuer[];
  rescuerRegistry: Record<string, BriefRescuerProfileResponse>;
  focusedIncidentId: string | null;
  focusedRequestId: string | null;
  urgentIncidentIds: Set<string>;
  incidentRowRefs: MutableRefObject<Record<string, HTMLButtonElement | null>>;
  requestRowRefs: MutableRefObject<Record<string, HTMLButtonElement | null>>;
  onIncidentClick: (incidentId: string, lat: number, lng: number) => void;
  onRequestClick: (requestId: string, lat: number, lng: number) => void;
  isRequestsLoading: boolean;
  hasRequestsError: boolean;
  onRefreshRequests: () => Promise<void>;
}

const getShortEntityId = (type: 'INC' | 'CAR', id: string) => {
  const suffix = id.slice(-6).toUpperCase();
  return `${type}-${suffix}`;
};

const getDisplayLocation = (_id: string, address?: string | null) => {
  if (address && address.trim().length > 0) {
    return address;
  }
  return 'Không có địa chỉ';
};

const getOnlineBadgeClasses = (isOnline: boolean) =>
  isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600';

export default function OperatorInfoPanels({
  incidents,
  requests,
  liveRescuers,
  rescuerRegistry,
  focusedIncidentId,
  focusedRequestId,
  urgentIncidentIds,
  incidentRowRefs,
  requestRowRefs,
  onIncidentClick,
  onRequestClick,
  isRequestsLoading,
  hasRequestsError,
  onRefreshRequests,
}: OperatorInfoPanelsProps) {
  const queueCount = incidents.filter(item => item.stage === 'Pending' || item.stage === 'Verified').length;
  const contactingCount = incidents.filter(item => item.stage === 'Contacting' || item.stage === 'Pending').length;
  const assignedCount = incidents.filter(item => item.stage === 'Assigned' || item.stage === 'EnRoute').length;
  const disputeCount = incidents.filter(item => item.needsRedispatch).length;

  const [activeTab, setActiveTab] = useState<'incidents' | 'requests'>('incidents');

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (focusedRequestId) {
      timeoutId = setTimeout(() => setActiveTab('requests'), 0);
    } else if (focusedIncidentId) {
      timeoutId = setTimeout(() => setActiveTab('incidents'), 0);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [focusedRequestId, focusedIncidentId]);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      <div className="absolute top-4 right-4 w-[min(420px,calc(100%-2rem))] max-h-[calc(100%-2rem)] overflow-y-auto space-y-6 pointer-events-auto">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
            <ShieldCheck className="size-4.5 text-teal-700" />
            Tóm tắt hàng chờ
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-amber-700">Chờ điều phối</p>
              <p className="text-xl font-bold text-amber-900">{queueCount}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3">
              <p className="text-blue-700">Đang liên hệ</p>
              <p className="text-xl font-bold text-blue-900">{contactingCount}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="text-emerald-700">Đã nhận lệnh</p>
              <p className="text-xl font-bold text-emerald-900">{assignedCount}</p>
            </div>
            <div className="rounded-xl bg-rose-50 p-3">
              <p className="text-rose-700">Cần điều phối lại</p>
              <p className="text-xl font-bold text-rose-900">{disputeCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
            <UserCheck className="size-4.5 text-teal-700" />
            Rescuers online
          </h3>

          {liveRescuers.length === 0
            ? (
                <p className="text-sm text-slate-500">No rescuers currently online.</p>
              )
            : (
                <div className="space-y-3 max-h-[26vh] overflow-y-auto pr-1">
                  {liveRescuers.map(rescuer => (
                    <div key={rescuer.id} className="rounded-xl border border-slate-200 p-3">
                      <p className="font-semibold text-slate-800">{rescuer.name}</p>
                      <p className="text-xs text-slate-500">
                        {rescuerRegistry[rescuer.id]?.phoneNumber ?? 'No phone'}
                      </p>
                      <p className="text-sm text-slate-500">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getOnlineBadgeClasses(rescuer.status === 'available' || rescuer.status === 'busy')}`}
                        >
                          {rescuer.status === 'available' ? 'Online' : 'Busy'}
                        </span>
                        {rescuerRegistry[rescuer.id]?.totalMissions != null ? ` • Missions: ${rescuerRegistry[rescuer.id]?.totalMissions}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
            <MapPin className="size-4.5 text-teal-700" />
            Danh sách sự cố đang hoạt động
          </h3>

          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('incidents')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'incidents' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Incidents
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'requests' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Requests
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-2 text-xs font-semibold">
                {requests.length}
              </span>
            </button>
          </div>

          {activeTab === 'requests'
            ? (
                <div className="space-y-2 max-h-[34vh] overflow-y-auto">
                  {isRequestsLoading
                    ? (
                        <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                          Đang tải yêu cầu...
                        </div>
                      )
                    : hasRequestsError
                      ? (
                          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                            Không thể tải danh sách yêu cầu.
                            <button
                              type="button"
                              onClick={onRefreshRequests}
                              className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:underline"
                            >
                              Thử lại
                            </button>
                          </div>
                        )
                      : requests.length === 0
                        ? (
                            <p className="text-sm text-slate-500">Không có yêu cầu nào.</p>
                          )
                        : (
                            requests.map((req) => {
                              const isFocused = req.id === focusedRequestId;
                              return (
                                <button
                                  key={req.id}
                                  type="button"
                                  ref={(el) => {
                                    requestRowRefs.current[req.id] = el;
                                  }}
                                  onClick={() => onRequestClick(req.id, req.lat ?? 0, req.lng ?? 0)}
                                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                                    isFocused ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900">{getShortEntityId('CAR', req.id)}</p>
                                      <p className="mt-1 text-xs text-slate-500">{getDisplayLocation(req.id, req.address)}</p>
                                    </div>
                                    <span className="text-xs text-slate-500">{req.statusLabel ?? req.status}</span>
                                  </div>
                                </button>
                              );
                            })
                          )}
                </div>
              )
            : (
                <div className="space-y-2 max-h-[34vh] overflow-y-auto">
                  {incidents.length === 0
                    ? (
                        <p className="text-sm text-slate-500">Không có case nào.</p>
                      )
                    : (
                        incidents.map((inc) => {
                          const isFocused = inc.id === focusedIncidentId;
                          const isUrgent = urgentIncidentIds.has(inc.id);
                          return (
                            <button
                              key={inc.id}
                              type="button"
                              ref={(el) => {
                                incidentRowRefs.current[inc.id] = el;
                              }}
                              onClick={() => onIncidentClick(inc.id, inc.lat, inc.lng)}
                              className={`w-full rounded-xl border px-3 py-3 text-left transition ${isFocused ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{getShortEntityId('INC', inc.id)}</p>
                                  <p className="mt-1 text-xs text-slate-500">{getDisplayLocation(inc.id, inc.address)}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-xs text-slate-500">{inc.stageLabel}</span>
                                  {isUrgent && (
                                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">Cần xử lý</span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                </div>
              )}
        </div>
      </div>
    </div>
  );
}
