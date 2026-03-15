'use client';

import type { OperatorIncident, OperatorRescuer } from '@/utils/operator-mock-state';
import L from 'leaflet';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { MapPin, Radio, ShieldCheck, UserCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { useRescuerHub } from '@/hooks/useRescuerHub';
import { useOperatorMockState } from '@/utils/operator-mock-state';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2xUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
});

interface LiveRescuer {
  id: string;
  name: string;
  status: OperatorRescuer['status'];
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

const onDutyOperators = [
  { id: 1, name: 'Nguyễn Minh Quân', shift: '08:00 - 16:00', activeCases: 3 },
  { id: 2, name: 'Lê Thu Hà', shift: '08:00 - 16:00', activeCases: 2 },
  { id: 3, name: 'Trần Gia Bảo', shift: '16:00 - 00:00', activeCases: 1 },
];

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

const getRescuerColor = (status: OperatorRescuer['status']) => {
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

  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (message: string) => setLogs(prev => [message, ...prev].slice(0, 50));

  const [incidentLocationOverride, setIncidentLocationOverride] = useState<Record<string, { lat: number; lng: number }>>({});
  const [rescuersById, setRescuersById] = useState<Record<string, LiveRescuer>>({});

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

  const liveRescuers = useMemo<LiveRescuer[]>(() =>
    Object.values(rescuersById).filter(r => r.status !== 'offline'), [rescuersById]);

  const updateRescuerLocation = (payload: { rescuerId: string; latitude: number; longitude: number }) => {
    setRescuersById((prev) => {
      const existing = prev[payload.rescuerId];
      return {
        ...prev,
        [payload.rescuerId]: {
          id: payload.rescuerId,
          name: existing?.name ?? payload.rescuerId,
          status: existing?.status ?? 'available',
          lat: payload.latitude,
          lng: payload.longitude,
          activeMissions: existing?.activeMissions ?? 0,
        },
      };
    });
  };

  const updateRescuerOnlineStatus = (payload: { rescuerId: string; isOnline: boolean }) => {
    setRescuersById((prev) => {
      if (!payload.isOnline) {
        const next = { ...prev };
        delete next[payload.rescuerId];
        return next;
      }

      const existing = prev[payload.rescuerId];
      if (!existing) {
        return prev;
      }

      return {
        ...prev,
        [payload.rescuerId]: {
          ...existing,
          status: 'available',
        },
      };
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
      <div className="mx-auto grid max-w-360 grid-cols-12 gap-6 px-6 py-6">
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
              Điều phối viên trực ca
            </h3>
            <div className="space-y-3">
              {onDutyOperators.map(operator => (
                <div key={operator.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="font-semibold text-slate-800">{operator.name}</p>
                  <p className="text-sm text-slate-500">
                    Ca trực:
                    {operator.shift}
                  </p>
                  <p className="mt-1 text-sm font-medium text-teal-700">
                    {operator.activeCases}
                    {' '}
                    case đang xử lý
                  </p>
                </div>
              ))}
            </div>
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
