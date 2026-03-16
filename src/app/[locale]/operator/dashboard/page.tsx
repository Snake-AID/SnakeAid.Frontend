/* eslint-disable react/no-array-index-key */
'use client';

import type {
  BriefRescuerProfileResponse,
  OnDutyRescuerItemResponse,
  ShiftAssignmentResponse,
} from '@/types/operator.type';
import type { OperatorIncident } from '@/utils/operator-mock-state';
import L from 'leaflet';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { MapPin, Radio, ShieldCheck, UserCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { operatorApi } from '@/apis/operator.api';
import ShiftAssignmentCard from '@/components/operator/ShiftAssignmentCard';
import { useRescuerHub } from '@/hooks/useRescuerHub';
import { useOperatorMockState } from '@/utils/operator-mock-state';
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
  stage: OperatorIncident['stage'];
  needsRedispatch?: boolean;
}

type ShiftAssignmentWithStatus = ShiftAssignmentResponse & {
  fullName: string;
  isOnline: boolean;
  isAvailable: boolean;
  isPast: boolean;
};

const stageLabel: Record<OperatorIncident['stage'], string> = {
  Pending: 'Chờ xác minh',
  Verified: 'Chờ điều phối',
  Contacting: 'Đang liên hệ',
  Dispatched: 'Đã điều phối',
  Assigned: 'Đã nhận lệnh',
  EnRoute: 'Đang di chuyển',
  Completed: 'Hoàn tất',
  FalseAlarm: 'Báo động giả',
};

const getIncidentColor = (stage: OperatorIncident['stage']) => {
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
  const { incidents: mockIncidents, focusedIncidentId } = useOperatorMockState();

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

  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (message: string) => setLogs(prev => [message, ...prev].slice(0, 50));

  const [rescuerRegistry, setRescuerRegistry] = useState<Record<string, BriefRescuerProfileResponse>>({});
  const [onDutySnapshot, setOnDutySnapshot] = useState<OnDutyRescuerItemResponse[]>([]);
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignmentResponse[]>([]);
  const [shiftTab, setShiftTab] = useState<'current' | 'past'>('current');
  const [incidentLocationOverride, setIncidentLocationOverride] = useState<Record<string, { lat: number; lng: number }>>({});
  const [rescuerLocationOverride, setRescuerLocationOverride] = useState<Record<string, { lat: number; lng: number }>>({});

  const liveIncidents = useMemo<LiveIncident[]>(() => {
    const base = mockIncidents.map(i => ({
      id: String(i.id),
      code: i.code,
      address: i.address,
      lat: incidentLocationOverride[String(i.id)]?.lat ?? i.lat,
      lng: incidentLocationOverride[String(i.id)]?.lng ?? i.lng,
      stage: i.stage,
      needsRedispatch: i.needsRedispatch,
    }));

    const extra = Object.entries(incidentLocationOverride)
      .filter(([id]) => !mockIncidents.some(i => String(i.id) === id))
      .map(([incidentId, loc]) => ({
        id: incidentId,
        code: incidentId,
        address: '',
        lat: loc.lat,
        lng: loc.lng,
        stage: 'Pending' as const,
        needsRedispatch: false,
      }));

    return [...base, ...extra];
  }, [mockIncidents, incidentLocationOverride]);

  const shiftStatusByRescuer = useMemo(() => {
    const map = new Map<string, { isOnline: boolean; isAvailable: boolean }>();
    onDutySnapshot.forEach(r => map.set(r.rescuerId, { isOnline: r.isOnline, isAvailable: r.isAvailable }));
    return map;
  }, [onDutySnapshot]);

  const liveRescuers = useMemo<LiveRescuer[]>(() => {
    const list = onDutySnapshot
      .filter(r => r.isOnline)
      .map((r) => {
        const loc = rescuerLocationOverride[r.rescuerId] ?? { lat: r.latitude, lng: r.longitude };
        if (loc.lat === null || loc.lng === null) {
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
          lat: loc.lat,
          lng: loc.lng,
          activeMissions,
        };
      })
      .filter(Boolean) as LiveRescuer[];

    return list;
  }, [onDutySnapshot, rescuerLocationOverride, rescuerRegistry]);

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

  const updateRescuerLocation = (payload: { rescuerId: string; latitude: number; longitude: number }) => {
    setRescuerLocationOverride(prev => ({
      ...prev,
      [payload.rescuerId]: { lat: payload.latitude, lng: payload.longitude },
    }));

    setOnDutySnapshot((prev) => {
      const idx = prev.findIndex(r => r.rescuerId === payload.rescuerId);
      if (idx !== -1) {
        return prev;
      }

      const profile = rescuerRegistry[payload.rescuerId];
      return [
        ...prev,
        {
          rescuerId: payload.rescuerId,
          fullName: profile?.account?.fullName ?? payload.rescuerId,
          phoneNumber: profile?.phoneNumber ?? null,
          isOnline: true,
          isAvailable: true,
          isOnDutyNow: true,
          assignmentStatus: 'Unknown',
          shiftAssignmentId: '',
          shiftId: '',
          shiftName: '',
          shiftStartTime: '',
          shiftEndTime: '',
          shiftDate: new Date(),
          latitude: payload.latitude,
          longitude: payload.longitude,
          lastLocationUpdate: new Date().toISOString(),
          distanceKm: null,
        },
      ];
    });
  };

  const updateRescuerOnlineStatus = (payload: { rescuerId: string; isOnline: boolean }) => {
    setOnDutySnapshot((prev) => {
      if (!payload.isOnline) {
        return prev.filter(r => r.rescuerId !== payload.rescuerId);
      }

      const idx = prev.findIndex(r => r.rescuerId === payload.rescuerId);
      if (idx !== -1) {
        return prev.map(r =>
          r.rescuerId === payload.rescuerId ? { ...r, isOnline: true, isAvailable: true } : r,
        );
      }

      const profile = rescuerRegistry[payload.rescuerId];
      return [
        ...prev,
        {
          rescuerId: payload.rescuerId,
          fullName: profile?.account?.fullName ?? payload.rescuerId,
          phoneNumber: profile?.phoneNumber ?? null,
          isOnline: true,
          isAvailable: true,
          isOnDutyNow: true,
          assignmentStatus: 'Unknown',
          shiftAssignmentId: '',
          shiftId: '',
          shiftName: '',
          shiftStartTime: '',
          shiftEndTime: '',
          shiftDate: new Date(),
          latitude: null,
          longitude: null,
          lastLocationUpdate: null,
          distanceKm: null,
        },
      ];
    });

    setRescuerLocationOverride((prev) => {
      if (!payload.isOnline) {
        const next = { ...prev };
        delete next[payload.rescuerId];
        return next;
      }
      return prev;
    });
  };

  const updateIncidentLocation = (payload: { incidentId: string; latitude: number; longitude: number }) => {
    setIncidentLocationOverride(prev => ({
      ...prev,
      [payload.incidentId]: { lat: payload.latitude, lng: payload.longitude },
    }));
  };

  const { connected, error } = useRescuerHub(
    {
      onRescuerIdleLocationUpdated: (payload) => {
        updateRescuerLocation(payload);
        addLog(`RescuerIdleLocationUpdated: ${payload.rescuerId} @ (${payload.latitude.toFixed(5)}, ${payload.longitude.toFixed(5)})`);
      },
      onIncidentLocationUpdated: (payload) => {
        updateIncidentLocation(payload);
        addLog(`IncidentLocationUpdated: ${payload.incidentId} @ (${payload.latitude.toFixed(5)}, ${payload.longitude.toFixed(5)})`);
      },
      onRescuerOnlineStatus: (payload) => {
        updateRescuerOnlineStatus(payload);
        addLog(`RescuerOnlineStatus: ${payload.rescuerId} => ${payload.isOnline}`);
      },
      onOperatorOnlineStatus: payload => addLog(`OperatorOnlineStatus: ${payload.operatorId} onDuty=${payload.isOnDuty}`),
      onAdminLog: payload => addLog(`AdminLog: ${payload.type} - ${payload.message}`),
      onRescuerAccepted: payload => addLog(`RescuerAccepted: ${payload.rescuerId} -> mission ${payload.missionId ?? 'unknown'}`),
      onRescuerDeclined: payload => addLog(`RescuerDeclined: ${payload.rescuerId} (${payload.reason ?? 'no reason'})`),
      onIncidentClaimed: payload => addLog(`IncidentClaimed: ${payload.incidentId} by ${payload.operatorId}`),
      onOperatorContacting: payload => addLog(`OperatorContacting: ${payload.operatorId} (incident ${payload.incidentId})`),
      onDispatchRequested: payload => addLog(`DispatchRequested: incident ${payload.incidentId} -> rescuer ${payload.rescuerId}`),
      onIncidentFalseAlarm: payload => addLog(`IncidentFalseAlarm: ${payload.incidentId} (${payload.reason ?? 'no reason'})`),
      onIncidentNoAnswer: payload => addLog(`IncidentNoAnswer: ${payload.incidentId} (continue=${payload.continueCalling})`),
      onRescuerDispatched: payload => addLog(`RescuerDispatched: ${payload.rescuerId} -> incident ${payload.incidentId}`),
      onIncidentCancelled: payload => addLog(`IncidentCancelled: ${payload.incidentId} (${payload.reason ?? 'no reason'})`),
      onRescuerAborted: payload => addLog(`RescuerAborted: ${payload.rescuerId} (${payload.reason ?? 'no reason'})`),
    },
    { autoJoin: true },
  );

  const mapCenter = useMemo(() => {
    const focusIncident = liveIncidents.find(item => item.id === String(focusedIncidentId)) ?? liveIncidents[0];
    return {
      lat: focusIncident?.lat ?? 10.78,
      lng: focusIncident?.lng ?? 106.7,
    };
  }, [focusedIncidentId, liveIncidents]);

  const queueCount = mockIncidents.filter(item => item.bucket === 'queue').length;
  const contactingCount = mockIncidents.filter(item => item.stage === 'Contacting' || item.stage === 'Pending').length;
  const assignedCount = mockIncidents.filter(item => item.stage === 'Assigned' || item.stage === 'EnRoute').length;
  const disputeCount = mockIncidents.filter(item => item.needsRedispatch).length;

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50">
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

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500" />
                SignalR Event Log
              </h3>
              <span className="text-xs text-slate-500">
                {connected ? 'connected' : 'disconnected'}
                {error ? ` • ${error}` : ''}
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg bg-slate-50 p-3 text-xs font-mono text-slate-700">
              {logs.length === 0
                ? (
                    <p className="text-slate-500">Waiting for events...</p>
                  )
                : (
                    logs.map((log, idx) => (
                      <div key={`${log}-${idx}`} className="py-0.5">
                        {log}
                      </div>
                    ))
                  )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
