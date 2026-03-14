'use client';

import { MapPin, Radio, ShieldCheck, UserCheck } from 'lucide-react';

// Tọa độ thực tế tại TP.HCM — gắn với địa điểm cụ thể, sẽ theo map khi zoom/pan
const incidentPoints = [
  { id: 1, lat: 10.7325, lng: 106.7218, severity: 'high', label: 'Q.7 - SOS mới' },
  { id: 2, lat: 10.7769, lng: 106.7009, severity: 'medium', label: 'Q.1 - Chờ xác minh' },
  { id: 3, lat: 10.8497, lng: 106.7721, severity: 'high', label: 'Thủ Đức - Ưu tiên cao' },
];

const rescuerPoints = [
  { id: 1, lat: 10.8015, lng: 106.7348, name: 'Rescuer Team A', status: 'online' },
  { id: 2, lat: 10.7412, lng: 106.6667, name: 'Rescuer Team B', status: 'moving' },
  { id: 3, lat: 10.8076, lng: 106.7131, name: 'Rescuer Team C', status: 'online' },
];

// Leaflet map HTML nhúng qua srcdoc — marker được Leaflet tính pixel từ lat/lng
// nên zoom/pan không làm lệch marker
const mapSrcdoc = (() => {
  const incidentJs = incidentPoints
    .map(
      p =>
        `L.circleMarker([${p.lat},${p.lng}],{color:'#dc2626',fillColor:'#dc2626',fillOpacity:1,radius:8,weight:2}).bindTooltip(${JSON.stringify(p.label)},{permanent:true,direction:'right',className:'pl'}).addTo(map);`,
    )
    .join('');

  const rescuerJs = rescuerPoints
    .map(
      p =>
        `L.circleMarker([${p.lat},${p.lng}],{color:'#10b981',fillColor:'#10b981',fillOpacity:1,radius:6,weight:2}).bindTooltip(${JSON.stringify(p.name)},{permanent:true,direction:'right',className:'pl rl'}).addTo(map);`,
    )
    .join('');

  return [
    '<!DOCTYPE html><html><head><meta charset="utf-8"/>',
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">',
    '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>',
    '<style>*{margin:0;padding:0}#map{width:100%;height:100vh}',
    '.pl{background:rgba(255,255,255,.95)!important;border:1px solid rgba(0,0,0,.1)!important;',
    'box-shadow:0 1px 4px rgba(0,0,0,.15)!important;border-radius:5px!important;',
    'font-size:11px!important;font-weight:700!important;color:#991b1b!important;padding:2px 8px!important;white-space:nowrap}',
    '.pl.rl{color:#065f46!important}',
    '.leaflet-tooltip::before{display:none!important}',
    '</style></head><body><div id="map"></div>',
    '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>',
    `<script>var map=L.map('map').setView([10.78,106.70],12);`,
    `L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',`,
    `{attribution:'\u00A9 <a href="https://osm.org/copyright">OpenStreetMap</a>',maxZoom:19}).addTo(map);`,
    incidentJs,
    rescuerJs,
    '<\/script></body></html>',
  ].join('');
})();

const onDutyOperators = [
  { id: 1, name: 'Nguyen Minh Quan', shift: '08:00 - 16:00', activeCases: 3 },
  { id: 2, name: 'Le Thu Ha', shift: '08:00 - 16:00', activeCases: 2 },
  { id: 3, name: 'Tran Gia Bao', shift: '16:00 - 00:00', activeCases: 1 },
];

export default function OperatorDashboardPage() {
  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50">
      <div className="mx-auto grid max-w-360 grid-cols-12 gap-6 px-6 py-6">
        <section className="col-span-12 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <MapPin className="size-5 text-teal-700" />
              Live Incident Map
            </h2>
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
              <Radio className="size-3.5" />
              Auto refresh 10s
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
              Operators On Duty
            </h3>
            <div className="space-y-3">
              {onDutyOperators.map(operator => (
                <div key={operator.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="font-semibold text-slate-800">{operator.name}</p>
                  <p className="text-sm text-slate-500">
                    Shift:
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
              Queue Summary
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-amber-50 p-3">
                <p className="text-amber-700">New</p>
                <p className="text-xl font-bold text-amber-900">12</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <p className="text-blue-700">Under Review</p>
                <p className="text-xl font-bold text-blue-900">5</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-emerald-700">Assigned</p>
                <p className="text-xl font-bold text-emerald-900">9</p>
              </div>
              <div className="rounded-xl bg-rose-50 p-3">
                <p className="text-rose-700">Escalated</p>
                <p className="text-xl font-bold text-rose-900">2</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
