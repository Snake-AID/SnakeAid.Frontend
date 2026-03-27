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

        {liveRequests.map(request => (
          <CircleMarker
            key={`request-${request.id}`}
            center={[request.lat, request.lng]}
            pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.6 }}
            radius={8}
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
            pathOptions={{
              color: getRescuerColor(rescuer.status, rescuer.inMission),
              fillColor: getRescuerColor(rescuer.status, rescuer.inMission),
              fillOpacity: 0.9,
            }}
            radius={rescuer.inMission ? 8 : 6}
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
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
