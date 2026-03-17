'use client';

import type { OperatorMapIncident } from '@/hooks/useOperatorIncidents';
import type {
  BriefRescuerProfileResponse,
  OnDutyRescuerItemResponse,
  ShiftAssignmentResponse,
} from '@/types/operator.type';
import type { DetailSnakebiteIncidentResponse } from '@/types/snakebite-incident.type';
import L from 'leaflet';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { MapPin, Radio, ShieldCheck, UserCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { incidentApi } from '@/apis/incident.api';
import { operatorApi } from '@/apis/operator.api';
import IncidentDetailDrawer from '@/components/operator/IncidentDetailDrawer';
import ShiftAssignmentCard from '@/components/operator/ShiftAssignmentCard';
import { useOperatorIncidents } from '@/hooks/useOperatorIncidents';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2xUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
});

type RescuerStatus = 'available' | 'busy' | 'offline';

interface LiveRescuer {
  id: string;
  name: string;
  status: RescuerStatus;
  lat: number;
  lng: number;
  activeMissions: number;
}

interface LiveIncident {
  id: string;
  code: string;
  address: string;
  lat: number;
  lng: number;
  stage: OperatorMapIncident['stage'];
  needsRedispatch?: boolean;
}

type ShiftAssignmentWithStatus = ShiftAssignmentResponse & {
  fullName: string;
  isOnline: boolean;
  isAvailable: boolean;
  isPast: boolean;
};

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

const getIncidentColor = (stage: OperatorMapIncident['stage']) => {
  if (stage === 'Dispatched') {
    return '#f59e0b';
  }

  if (stage === 'Assigned' || stage === 'EnRoute') {
    return '#7c3aed';
  }

  if (stage === 'FalseAlarm' || stage === 'Completed') {
    return '#ef4444';
  }

  return '#2563eb';
};

const getRescuerColor = (status: RescuerStatus) => {
  if (status === 'busy') {
    return '#f59e0b';
  }

  if (status === 'offline') {
    return '#ef4444';
  }

  return '#10b981';
};

export default function OperatorDashboardPage() {
  const {
    incidents,
    focusedIncidentId,
    setFocusedIncidentId,
    confirmIncident,
    refreshIncidents,
  } = useOperatorIncidents();

  const getShiftStartEnd = (shiftDate: Date, shift: { startTime: string; endTime: string }) => {
    const [startHourStr, startMinStr] = (shift.startTime ?? '').split(':');
    const [endHourStr, endMinStr] = (shift.endTime ?? '').split(':');

    const startHour = Number(startHourStr);
    const startMin = Number(startMinStr);
    const endHour = Number(endHourStr);
    const endMin = Number(endMinStr);

    const start = new Date(shiftDate);
    const end = new Date(shiftDate);

    if (Number.isNaN(startHour) || Number.isNaN(startMin) || Number.isNaN(endHour) || Number.isNaN(endMin)) {
      return { start: null, end: null };
    }

    start.setHours(startHour, startMin, 0, 0);
    end.setHours(endHour, endMin, 0, 0);

    // Overnight shift (end <= start means end is next day)
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }

    return { start, end };
  };

  const isShiftPast = (shiftDate: Date, shift: { startTime: string; endTime: string }) => {
    const now = new Date();
    const { end } = getShiftStartEnd(shiftDate, shift);
    if (!end) {
      return false;
    }
    return now > end;
  };

  const getOnlineBadgeClasses = (isOnline: boolean) =>
    isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600';

  const [rescuerRegistry, setRescuerRegistry] = useState<Record<string, BriefRescuerProfileResponse>>({});
  const [onDutySnapshot, setOnDutySnapshot] = useState<OnDutyRescuerItemResponse[]>([]);
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignmentResponse[]>([]);
  const [shiftTab, setShiftTab] = useState<'current' | 'past'>('current');
  const [pendingConfirmIncidentId, setPendingConfirmIncidentId] = useState<string | null>(null);
  const [detailIncident, setDetailIncident] = useState<DetailSnakebiteIncidentResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const liveIncidents = useMemo<LiveIncident[]>(() => {
    return incidents.map(i => ({
      id: i.id,
      code: i.code,
      address: i.address,
      lat: i.lat,
      lng: i.lng,
      stage: i.stage as OperatorMapIncident['stage'],
      needsRedispatch: i.needsRedispatch,
    }));
  }, [incidents]);

  const openIncidentDetail = async (incidentId: string) => {
    setDetailError(null);
    setDetailLoading(true);
    setDetailOpen(true);

    try {
      const detail = await incidentApi.getIncident(incidentId);
      setDetailIncident(detail);
    } catch (err) {
      console.error('Failed to load incident detail', err);
      setDetailError('Không thể tải thông tin case.');
      setDetailIncident(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeIncidentDetail = () => {
    setDetailOpen(false);
    setDetailIncident(null);
    setDetailError(null);
  };

  const handleVerify = async (incidentId: string) => {
    await incidentApi.confirmIncident(incidentId);
  };

  const handleFalseAlarm = async (incidentId: string) => {
    await incidentApi.markFalseAlarm(incidentId, {
      reason: 'Operator marked as false alarm',
    });
  };

  const handleDispatch = async (incidentId: string, rescuerId: string) => {
    await incidentApi.dispatchIncident(incidentId, { rescuerId });
  };

  const handleCancelDispatch = async (incidentId: string) => {
    await incidentApi.cancelDispatch(incidentId);
  };

  const focusedIncident = useMemo(() => {
    if (!focusedIncidentId) {
      return null;
    }
    return liveIncidents.find(i => i.id === focusedIncidentId) ?? null;
  }, [focusedIncidentId, liveIncidents]);

  useEffect(() => {
    if (!focusedIncident) {
      return;
    }

    if (focusedIncident.stage === 'Pending') {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setPendingConfirmIncidentId(focusedIncident.id);
    }
  }, [focusedIncident]);

  const MapViewUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(center, 13, { animate: true });
    }, [center, map]);
    return null;
  };

  const shiftStatusByRescuer = useMemo(() => {
    const map = new Map<string, { isOnline: boolean; isAvailable: boolean }>();
    onDutySnapshot.forEach(r => map.set(r.rescuerId, { isOnline: r.isOnline, isAvailable: r.isAvailable }));
    return map;
  }, [onDutySnapshot]);

  const liveRescuers = useMemo<LiveRescuer[]>(() => {
    const list = onDutySnapshot
      .filter(r => r.isOnline)
      .map((r) => {
        const lat = r.latitude;
        const lng = r.longitude;
        if (lat === null || lng === null) {
          return null;
        }

        const profile = rescuerRegistry[r.rescuerId];
        const name = profile?.account?.fullName ?? r.fullName ?? r.rescuerId;
        const activeMissions = profile?.totalMissions ?? 0;

        const status: RescuerStatus = r.isAvailable ? 'available' : 'busy';

        return {
          id: r.rescuerId,
          name,
          status,
          lat,
          lng,
          activeMissions,
        };
      })
      .filter(Boolean) as LiveRescuer[];

    return list;
  }, [onDutySnapshot, rescuerRegistry]);

  const shiftAssignmentsWithStatus = useMemo<ShiftAssignmentWithStatus[]>(() =>
    shiftAssignments
      .map((sa) => {
        const status = shiftStatusByRescuer.get(sa.rescuerId);
        const snapshot = onDutySnapshot.find(r => r.rescuerId === sa.rescuerId);
        const profile = rescuerRegistry[sa.rescuerId];
        return {
          ...sa,
          fullName: snapshot?.fullName ?? profile?.account?.fullName ?? sa.rescuerId,
          isOnline: status?.isOnline ?? false,
          isAvailable: status?.isAvailable ?? false,
          isPast: isShiftPast(sa.date, sa.shift),
        };
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }), [shiftAssignments, shiftStatusByRescuer, onDutySnapshot, rescuerRegistry]);

  useEffect(() => {
    (async () => {
      try {
        const registry = await operatorApi.getRescuerRegistry();
        setRescuerRegistry(Object.fromEntries(registry.map(item => [item.accountId, item])));
      } catch (err) {
        console.error('Failed to load rescuer registry', err);
      }

      try {
        const snapshot = await operatorApi.getOnDutyRescuers();
        setOnDutySnapshot(snapshot.rescuers);
      } catch (err) {
        console.error('Failed to load on-duty rescuer snapshot', err);
      }

      try {
        const shifts = await operatorApi.getTodayShiftAssignments();
        setShiftAssignments(shifts);
      } catch (err) {
        console.error('Failed to load today shift assignments', err);
      }
    })();
  }, []);

  const mapCenter = useMemo(() => {
    const focusIncident = liveIncidents.find(item => item.id === String(focusedIncidentId)) ?? liveIncidents[0];
    return {
      lat: focusIncident?.lat ?? 10.78,
      lng: focusIncident?.lng ?? 106.7,
    };
  }, [focusedIncidentId, liveIncidents]);

  const queueCount = incidents.filter(item => item.stage === 'Pending' || item.stage === 'Verified').length;
  const contactingCount = incidents.filter(item => item.stage === 'Contacting' || item.stage === 'Pending').length;
  const assignedCount = incidents.filter(item => item.stage === 'Assigned' || item.stage === 'EnRoute').length;
  const disputeCount = incidents.filter(item => item.needsRedispatch).length;

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50">
      {pendingConfirmIncidentId && (
        <div className="fixed bottom-4 right-4 z-9999 w-[min(100%,420px)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Case mới đã được báo</h2>
            <p className="mt-2 text-sm text-slate-600">
              Case mới đã được ghim trên bản đồ; hãy xác nhận để đưa vào luồng xử lý.
            </p>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Case ID</p>
              <p className="mt-1 text-sm text-slate-800">{pendingConfirmIncidentId}</p>
              <p className="mt-3 text-sm font-semibold text-slate-700">Vị trí</p>
              <p className="mt-1 text-sm text-slate-800">
                {focusedIncident?.lat.toFixed(5)}
                ,
                {focusedIncident?.lng.toFixed(5)}
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => openIncidentDetail(pendingConfirmIncidentId)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Xem chi tiết
              </button>
              <button
                type="button"
                onClick={() => setPendingConfirmIncidentId(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ẩn
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (pendingConfirmIncidentId) {
                    await confirmIncident(pendingConfirmIncidentId);
                    setPendingConfirmIncidentId(null);
                  }
                }}
                className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Xác nhận case
              </button>
            </div>
          </div>
        </div>
      )}

      <IncidentDetailDrawer
        incident={detailIncident}
        isOpen={detailOpen}
        isLoading={detailLoading}
        error={detailError}
        onClose={closeIncidentDetail}
        onVerify={handleVerify}
        onFalseAlarm={handleFalseAlarm}
        onDispatch={handleDispatch}
        onCancelDispatch={handleCancelDispatch}
        onRefresh={refreshIncidents}
      />

      <div className="mx-auto grid w-full max-w-full grid-cols-12 gap-6 px-6 py-6">
        <section className="col-span-12 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <MapPin className="size-5 text-teal-700" />
              Bản đồ sự cố trực tiếp
            </h2>
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
              <Radio className="size-3.5" />
              Đồng bộ theo state Queue và Dispatch
            </span>
          </div>

          <div className="relative min-h-140 overflow-hidden rounded-xl border border-slate-200">
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={12}
              scrollWheelZoom
              className="absolute inset-0 h-full w-full"
            >
              <MapViewUpdater center={[mapCenter.lat, mapCenter.lng]} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
              />

              {liveIncidents.map(incident => (
                <CircleMarker
                  key={`incident-${incident.id}`}
                  center={[incident.lat, incident.lng]}
                  pathOptions={{ color: getIncidentColor(incident.stage), fillColor: getIncidentColor(incident.stage), fillOpacity: 0.6 }}
                  radius={incident.needsRedispatch ? 12 : 8}
                  eventHandlers={{ click: () => {
                    setFocusedIncidentId(incident.id);
                    openIncidentDetail(incident.id);
                  } }}
                >
                  <Popup>
                    <div className="space-y-1 text-xs">
                      <div className="font-semibold">{incident.code}</div>
                      <div>{incident.address}</div>
                      <div>
                        Stage:
                        {stageLabel[incident.stage]}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {liveRescuers.map(rescuer => (
                <CircleMarker
                  key={`rescuer-${rescuer.id}`}
                  center={[rescuer.lat, rescuer.lng]}
                  pathOptions={{ color: getRescuerColor(rescuer.status), fillColor: getRescuerColor(rescuer.status), fillOpacity: 0.9 }}
                  radius={6}
                >
                  <Popup>
                    <div className="space-y-1 text-xs">
                      <div className="font-semibold">{rescuer.name}</div>
                      <div>
                        Status:
                        {rescuer.status}
                      </div>
                      <div>
                        Active missions:
                        {rescuer.activeMissions}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </section>

        <section className="col-span-12 space-y-6 xl:col-span-4">
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
                  <div className="space-y-3">
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
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {incidents.length === 0
                ? (
                    <p className="text-sm text-slate-500">Không có case nào.</p>
                  )
                : (
                    incidents.map((inc) => {
                      const isFocused = inc.id === focusedIncidentId;
                      return (
                        <button
                          key={inc.id}
                          type="button"
                          onClick={() => {
                            setFocusedIncidentId(inc.id);
                            openIncidentDetail(inc.id);
                          }}
                          className={`w-full rounded-xl border px-3 py-3 text-left transition ${isFocused ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900">{inc.code}</p>
                            <span className="text-xs text-slate-500">{stageLabel[inc.stage]}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{inc.address || 'Không có địa chỉ'}</p>
                        </button>
                      );
                    })
                  )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
              <UserCheck className="size-4.5 text-teal-700" />
              Shift schedule (
              {new Date().toLocaleDateString()}
              )
            </h3>

            <div className="mb-4 flex gap-2">
              <button
                type="button"
                className={`rounded-full px-4 py-1 text-sm font-semibold transition ${shiftTab === 'current'
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                onClick={() => setShiftTab('current')}
              >
                Current / Upcoming
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-1 text-sm font-semibold transition ${shiftTab === 'past'
                  ? 'bg-gray-300 text-black shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                onClick={() => setShiftTab('past')}
              >
                Past shifts
              </button>
            </div>

            {shiftTab === 'current'
              ? (
                  shiftAssignmentsWithStatus.filter(a => !a.isPast).length === 0
                    ? (
                        <p className="text-sm text-slate-500">No upcoming shifts.</p>
                      )
                    : (
                        <div className="space-y-2">
                          {shiftAssignmentsWithStatus
                            .filter(a => !a.isPast)
                            .map(assignment => (
                              <ShiftAssignmentCard key={assignment.id} assignment={assignment} showStatus />
                            ))}
                        </div>
                      )
                )
              : (
                  shiftAssignmentsWithStatus.filter(a => a.isPast).length === 0
                    ? (
                        <p className="text-sm text-slate-500">No past shifts.</p>
                      )
                    : (
                        <div className="space-y-2">
                          {shiftAssignmentsWithStatus
                            .filter(a => a.isPast)
                            .map(assignment => (
                              <ShiftAssignmentCard key={assignment.id} assignment={assignment} showStatus={false} />
                            ))}
                        </div>
                      )
                )}
          </div>

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

        </section>
      </div>
    </main>
  );
}
