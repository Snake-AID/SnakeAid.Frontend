'use client';

import type { OperatorMapIncident } from '@/hooks/useOperatorIncidents';
import type { LiveRescuer, RescuerStatus } from '@/hooks/useOperatorRescuers';
import L from 'leaflet';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { useCallback, useEffect, useRef } from 'react';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2xUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
});

const getShortIncidentId = (id: string) => {
  const suffix = id.slice(-6).toUpperCase();
  return `INC-${suffix}`;
};

const getShortRequestId = (id: string) => {
  const suffix = id.slice(-6).toUpperCase();
  return `CAR-${suffix}`;
};

export interface LiveIncident {
  id: string;
  code: string;
  address: string;
  lat: number;
  lng: number;
  stage: OperatorMapIncident['stage'];
  stageLabel: string;
  needsRedispatch?: boolean;
}

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

  if (stage === 'Disputed') {
    return '#dc2626';
  }

  if (stage === 'Contacting') {
    return '#3b82f6';
  }

  if (stage === 'Verified') {
    return '#0ea5e9';
  }

  return '#2563eb';
};

const getRequestColor = (status: string) => {
  switch (status) {
    case 'Pending':
      return '#f59e0b'; // chờ xác minh
    case 'Confirmed':
      return '#0ea5e9'; // chờ điều phối
    case 'Assigned':
      return '#7c3aed'; // đã điều phối
    case 'Completed':
      return '#22c55e'; // hoàn tất
    case 'Cancelled':
    case 'Declined':
      return '#ef4444';
    default:
      return '#2563eb';
  }
};

const getRescuerColor = (status: RescuerStatus, inMission?: boolean) => {
  if (inMission) {
    return '#7c3aed'; // Purple for rescuers in active mission
  }

  if (status === 'busy') {
    return '#f59e0b';
  }

  if (status === 'offline') {
    return '#ef4444';
  }

  return '#10b981';
};

const getRequestIcon = (color: string) => L.divIcon({
  className: '',
  html: `<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="14" height="14" rx="3" fill="${color}" fill-opacity="0.6" stroke="${color}" stroke-width="2"/></svg>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const getRescuerIcon = (color: string) => L.divIcon({
  className: '',
  html: `<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><polygon points="9,2 16,15 2,15" fill="${color}" fill-opacity="0.75" stroke="${color}" stroke-width="2"/></svg>`,
  iconSize: [18, 18],
  iconAnchor: [9, 16],
});

export interface LiveRequest {
  id: string;
  address?: string | null;
  lat: number;
  lng: number;
  status: string;
  statusLabel?: string;
}

interface OperatorMapProps {
  liveIncidents: LiveIncident[];
  liveRequests?: LiveRequest[];
  liveRescuers: LiveRescuer[];
  focusedIncidentId?: string | null;
  focusedRequestId?: string | null;
  focusTrigger?: number;
  onIncidentClick: (incidentId: string) => void;
  onRequestClick?: (requestId: string) => void;
}

export default function OperatorMap({
  liveIncidents,
  liveRequests = [],
  liveRescuers,
  focusedIncidentId,
  focusedRequestId,
  focusTrigger,
  onIncidentClick,
  onRequestClick,
}: OperatorMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const liveIncidentsRef = useRef<LiveIncident[]>([]);
  const liveRequestsRef = useRef<LiveRequest[]>([]);

  useEffect(() => {
    liveIncidentsRef.current = liveIncidents;
  }, [liveIncidents]);

  useEffect(() => {
    liveRequestsRef.current = liveRequests;
  }, [liveRequests]);

  const updateMapCenter = useCallback((lat: number, lng: number) => {
    const map = mapRef.current;
    if (map) {
      const currentCenter = map.getCenter();
      const almostEqual = (a: number, b: number) => Math.abs(a - b) < 1e-6;
      if (!almostEqual(currentCenter.lat, lat) || !almostEqual(currentCenter.lng, lng)) {
        map.setView([lat, lng], 13, { animate: true });
      }
    }
  }, []);

  const hasSetInitialCenter = useRef(false);
  useEffect(() => {
    if (hasSetInitialCenter.current) {
      return;
    }
    const first = liveIncidentsRef.current[0];
    if (!first) {
      return;
    }

    hasSetInitialCenter.current = true;
    updateMapCenter(first.lat, first.lng);
  }, [updateMapCenter]);

  useEffect(() => {
    if (focusedRequestId) {
      const focusItem = liveRequestsRef.current.find(item => item.id === focusedRequestId);
      if (focusItem) {
        updateMapCenter(focusItem.lat, focusItem.lng);
      }
    } else if (focusedIncidentId) {
      const focusItem = liveIncidentsRef.current.find(item => item.id === focusedIncidentId);
      if (focusItem) {
        updateMapCenter(focusItem.lat, focusItem.lng);
      }
    }
  }, [focusedIncidentId, focusedRequestId, focusTrigger, updateMapCenter]);

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer
        ref={mapRef as any}
        center={[10.78, 106.7]}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
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
            eventHandlers={{
              click: () => {
                onIncidentClick(incident.id);
              },
            }}
          >
            <Popup>
              <div className="space-y-1 text-xs">
                <div className="font-semibold">{getShortIncidentId(incident.id)}</div>
                <div>{incident.address}</div>
                <div>
                  Giai đoạn:
                  {' '}
                  {incident.stageLabel}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {liveRequests.map((request) => {
          const requestColor = getRequestColor(request.status);
          return (
            <Marker
              key={`request-${request.id}`}
              position={[request.lat, request.lng]}
              icon={getRequestIcon(requestColor)}
              eventHandlers={{
                click: () => {
                  onRequestClick?.(request.id);
                },
              }}
            >
              <Popup>
                <div className="space-y-1 text-xs">
                  <div className="font-semibold">{getShortRequestId(request.id)}</div>
                  <div>{request.address ?? 'Không có địa chỉ'}</div>
                  <div>
                    Trạng thái:
                    {' '}
                    {request.statusLabel ?? request.status}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {liveRescuers.map(rescuer => (
          <Marker
            key={`rescuer-${rescuer.id}`}
            position={[rescuer.lat, rescuer.lng]}
            icon={getRescuerIcon(getRescuerColor(rescuer.status, rescuer.inMission))}
          >
            <Popup>
              <div className="space-y-1 text-xs">
                <div className="font-semibold">{rescuer.name}</div>
                <div>
                  Trạng thái:
                  {' '}
                  {rescuer.status === 'available' ? 'Sẵn sàng' : rescuer.status === 'busy' ? 'Bận' : 'Offline'}
                  {rescuer.inMission && ' (Đang làm nhiệm vụ)'}
                </div>
                {rescuer.missionIncidentId && (
                  <div className="text-purple-600">
                    Nhiệm vụ: INC-
                    {rescuer.missionIncidentId.slice(-6).toUpperCase()}
                  </div>
                )}
                <div>
                  Nhiệm vụ đang thực hiện:
                  {' '}
                  {rescuer.activeMissions}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
