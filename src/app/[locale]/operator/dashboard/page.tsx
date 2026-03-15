'use client';

import type { OperatorIncident, OperatorRescuer } from '@/utils/operator-mock-state';
import { MapPin, Radio, ShieldCheck, UserCheck } from 'lucide-react';
import { useMemo } from 'react';
import { useOperatorMockState } from '@/utils/operator-mock-state';

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
  const { incidents, rescuers, focusedIncidentId } = useOperatorMockState();

  const mapSrcdoc = useMemo(() => {
    const focusIncident = incidents.find(item => item.id === focusedIncidentId) ?? incidents[0];
    const centerLat = focusIncident?.lat ?? 10.78;
    const centerLng = focusIncident?.lng ?? 106.7;

    const incidentJs = incidents
      .map((incident) => {
        const color = getIncidentColor(incident.stage);
        const label = `${incident.code} - ${stageLabel[incident.stage]}`;
        const radius = incident.needsRedispatch ? 10 : 8;

        return `L.circleMarker([${incident.lat},${incident.lng}],{color:'${color}',fillColor:'${color}',fillOpacity:0.95,radius:${radius},weight:2}).bindTooltip(${JSON.stringify(label)},{permanent:true,direction:'right',className:'pl'}).addTo(map);`;
      })
      .join('');

    const rescuerJs = rescuers
      .map((rescuer) => {
        const color = getRescuerColor(rescuer.status);
        const label = `${rescuer.name} - ${rescuer.status}`;

        return `L.circleMarker([${rescuer.lat},${rescuer.lng}],{color:'${color}',fillColor:'${color}',fillOpacity:0.95,radius:6,weight:2}).bindTooltip(${JSON.stringify(label)},{permanent:true,direction:'right',className:'pl rl'}).addTo(map);`;
      })
      .join('');

    const connectionJs = incidents
      .filter(item => (item.stage === 'Dispatched' || item.stage === 'Assigned' || item.stage === 'EnRoute') && item.currentRescuerId)
      .map((incident) => {
        const rescuer = rescuers.find(item => item.id === incident.currentRescuerId);
        if (!rescuer) {
          return '';
        }

        const lineColor = incident.stage === 'Dispatched' ? '#f59e0b' : '#7c3aed';
        return `L.polyline([[${incident.lat},${incident.lng}],[${rescuer.lat},${rescuer.lng}]],{color:'${lineColor}',weight:3,opacity:0.8,dashArray:'8 6'}).addTo(map);`;
      })
      .join('');

    return [
      '<!DOCTYPE html><html><head><meta charset="utf-8"/>',
      '<meta name="viewport" content="width=device-width,initial-scale=1.0">',
      '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>',
      '<style>*{margin:0;padding:0}#map{width:100%;height:100vh}',
      '.pl{background:rgba(255,255,255,.95)!important;border:1px solid rgba(0,0,0,.1)!important;',
      'box-shadow:0 1px 4px rgba(0,0,0,.15)!important;border-radius:5px!important;',
      'font-size:11px!important;font-weight:700!important;color:#0f172a!important;padding:2px 8px!important;white-space:nowrap}',
      '.pl.rl{color:#065f46!important}',
      '.leaflet-tooltip::before{display:none!important}',
      '</style></head><body><div id="map"></div>',
      '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>',
      `<script>var map=L.map('map').setView([${centerLat},${centerLng}],12);`,
      `L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',`,
      `{attribution:'\u00A9 <a href="https://osm.org/copyright">OpenStreetMap</a>',maxZoom:19}).addTo(map);`,
      connectionJs,
      incidentJs,
      rescuerJs,
      '<\/script></body></html>',
    ].join('');
  }, [focusedIncidentId, incidents, rescuers]);

  const queueCount = incidents.filter(item => item.bucket === 'queue').length;
  const contactingCount = incidents.filter(item => item.stage === 'Contacting' || item.stage === 'Pending').length;
  const assignedCount = incidents.filter(item => item.stage === 'Assigned' || item.stage === 'EnRoute').length;
  const disputeCount = incidents.filter(item => item.needsRedispatch).length;

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

          {/* min-h-140 ≈ 35rem, iframe fill parent via absolute inset */}
          <div className="relative min-h-140 overflow-hidden rounded-xl border border-slate-200">
            <iframe
              title="HCM Live Incident Map"
              srcDoc={mapSrcdoc}
              className="absolute inset-0 h-full w-full border-0"
            />
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
        </section>
      </div>
    </main>
  );
}
