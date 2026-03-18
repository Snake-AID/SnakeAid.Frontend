'use client';

import type { OperatorMapIncident } from '@/hooks/useOperatorIncidents';
import type { LiveRescuer, RescuerStatus } from '@/hooks/useOperatorRescuers';
import L from 'leaflet';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { useCallback, useEffect, useRef } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2xUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
});

export interface LiveIncident {
  id: string;
  code: string;
  address: string;
  lat: number;
  lng: number;
  stage: OperatorMapIncident['stage'];
  needsRedispatch?: boolean;
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

export interface LiveRequest {
  id: string;
  address?: string | null;
  lat: number;
  lng: number;
  status: string;
}

interface OperatorMapProps {
  liveIncidents: LiveIncident[];
  liveRequests?: LiveRequest[];
  liveRescuers: LiveRescuer[];
  focusedIncidentId?: string | null;
  focusedRequestId?: string | null;
  onIncidentClick: (incidentId: string, lat: number, lng: number) => void;
  onRequestClick?: (requestId: string, lat: number, lng: number) => void;
}

export default function OperatorMap({
  liveIncidents,
  liveRequests = [],
  liveRescuers,
  focusedIncidentId,
  focusedRequestId,
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
    const focusId = focusedRequestId ?? focusedIncidentId;
    if (!focusId) {
      return;
    }

    const focusItem = focusedRequestId
      ? liveRequestsRef.current.find(item => item.id === String(focusId))
      : liveIncidentsRef.current.find(item => item.id === String(focusId));

    if (!focusItem) {
      return;
    }

    updateMapCenter(focusItem.lat, focusItem.lng);
  }, [focusedIncidentId, focusedRequestId, updateMapCenter]);

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
                onIncidentClick(incident.id, incident.lat, incident.lng);
              },
            }}
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

        {liveRequests.map(request => (
          <CircleMarker
            key={`request-${request.id}`}
            center={[request.lat, request.lng]}
            pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.6 }}
            radius={8}
            eventHandlers={{
              click: () => {
                onRequestClick?.(request.id, request.lat, request.lng);
              },
            }}
          >
            <Popup>
              <div className="space-y-1 text-xs">
                <div className="font-semibold">{request.id}</div>
                <div>{request.address ?? 'No address'}</div>
                <div>
                  Status:
                  {request.status}
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
  );
}
