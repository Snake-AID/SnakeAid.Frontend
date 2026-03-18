import type { MutableRefObject } from 'react';
import type { OperatorMapIncident } from '@/hooks/useOperatorIncidents';
import type { LiveRescuer } from '@/hooks/useOperatorRescuers';
import type { BriefRescuerProfileResponse } from '@/types/operator.type';
import { MapPin, ShieldCheck, UserCheck } from 'lucide-react';

interface OperatorInfoPanelsProps {
  incidents: OperatorMapIncident[];
  liveRescuers: LiveRescuer[];
  rescuerRegistry: Record<string, BriefRescuerProfileResponse>;
  focusedIncidentId: string | null;
  urgentIncidentIds: Set<string>;
  incidentRowRefs: MutableRefObject<Record<string, HTMLButtonElement | null>>;
  onIncidentClick: (incidentId: string, lat: number, lng: number) => void;
}

const stageLabel: Record<OperatorMapIncident['stage'], string> = {
  Pending: 'Chờ xác minh',
  Verified: 'Chờ điều phối',
  Contacting: 'Đang liên hệ',
  Dispatched: 'Đã điều phối',
  Assigned: 'Đã nhận lệnh',
  EnRoute: 'Đang di chuyển',
  Completed: 'Hoàn tất',
  FalseAlarm: 'Báo động giả',
};

const getOnlineBadgeClasses = (isOnline: boolean) =>
  isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600';

export default function OperatorInfoPanels({
  incidents,
  liveRescuers,
  rescuerRegistry,
  focusedIncidentId,
  urgentIncidentIds,
  incidentRowRefs,
  onIncidentClick,
}: OperatorInfoPanelsProps) {
  const queueCount = incidents.filter(item => item.stage === 'Pending' || item.stage === 'Verified').length;
  const contactingCount = incidents.filter(item => item.stage === 'Contacting' || item.stage === 'Pending').length;
  const assignedCount = incidents.filter(item => item.stage === 'Assigned' || item.stage === 'EnRoute').length;
  const disputeCount = incidents.filter(item => item.needsRedispatch).length;

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
            <div className="rounded-xl bg-blue-50 p-3">
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
                            <p className="text-sm font-semibold text-slate-900">{inc.code}</p>
                            <p className="mt-1 text-xs text-slate-500">{inc.address || 'Không có địa chỉ'}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs text-slate-500">{stageLabel[inc.stage]}</span>
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
        </div>
      </div>
    </div>
  );
}
