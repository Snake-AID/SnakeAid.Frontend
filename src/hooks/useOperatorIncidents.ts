'use client';

import type { OperatorIncidentSummaryResponse } from '@/types/operator.type';
import type { IncidentCancelledPayload, NewIncidentCreatedPayload } from '@/types/signalr.type';
import type { CreateIncidentResponse } from '@/types/snakebite-incident.type';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { incidentApi } from '@/apis/incident.api';
import { useRescuerHub } from '@/hooks/useRescuerHub';

export interface OperatorMapIncident {
  id: string;
  code: string;
  stage: string;
  stageLabel: string;
  lat: number;
  lng: number;
  address: string;
  needsRedispatch: boolean;
}

const translateIncidentStage = (stage: string) => {
  switch (stage) {
    case 'Pending':
      return 'Chờ xác minh';
    case 'Verified':
      return 'Chờ điều phối';
    case 'Contacting':
      return 'Đang liên hệ';
    case 'Dispatched':
      return 'Đã điều phối';
    case 'Assigned':
      return 'Đã nhận lệnh';
    case 'EnRoute':
      return 'Đang di chuyển';
    case 'Completed':
      return 'Hoàn tất';
    case 'FalseAlarm':
      return 'Báo động giả';
    default:
      return stage;
  }
};

export interface UseOperatorIncidentsResult {
  incidents: OperatorMapIncident[];
  focusedIncidentId: string | null;
  setFocusedIncidentId: (id: string | null) => void;
  lastCreatedIncidentId: string | null;
  clearLastCreatedIncidentId: () => void;
  confirmIncident: (incidentId: string) => Promise<void>;
  dispatchIncident: (incidentId: string, rescuerId: string) => Promise<void>;
  cancelDispatch: (incidentId: string) => Promise<void>;
  refreshIncidents: () => Promise<void>;
  hasError: boolean;
  isLoading: boolean;
}

const toOperatorMapIncident = (incident: OperatorIncidentSummaryResponse): OperatorMapIncident => ({
  id: incident.id,
  code: incident.id,
  stage: incident.status,
  stageLabel: translateIncidentStage(incident.status),
  lat: incident.locationCoordinates.latitude,
  lng: incident.locationCoordinates.longitude,
  address: incident.address ?? '',
  needsRedispatch: incident.needsRedispatch,
});

const mapCreateIncidentResponseToOperatorMapIncident = (incident: CreateIncidentResponse): OperatorMapIncident => ({
  id: incident.id,
  code: `INC-${incident.id.slice(-6).toUpperCase()}`,
  stage: incident.status as OperatorMapIncident['stage'],
  stageLabel: translateIncidentStage(incident.status),
  lat: incident.locationCoordinates.latitude,
  lng: incident.locationCoordinates.longitude,
  address: incident.address ?? 'Chưa rõ',
  needsRedispatch: false,
});

export function useOperatorIncidents(): UseOperatorIncidentsResult {
  const [incidents, setIncidents] = useState<OperatorMapIncident[]>([]);
  const [focusedIncidentId, setFocusedIncidentId] = useState<string | null>(null);
  const [lastCreatedIncidentId, setLastCreatedIncidentId] = useState<string | null>(null);
  const clearLastCreatedIncidentId = useCallback(() => {
    setLastCreatedIncidentId(null);
  }, []);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const incidentsRef = useRef<OperatorMapIncident[]>([]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await incidentApi.getActiveIncidents({ page: 1, pageSize: 100 });
        const mapped = response.items.map(toOperatorMapIncident);
        incidentsRef.current = mapped;
        setIncidents(mapped);

        setFocusedIncidentId(mapped[0]?.id ?? null);
      } catch (err) {
        console.error('Failed to load incidents', err);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const addIncidentFromSignalR = (payload: NewIncidentCreatedPayload) => {
    const id = payload.incidentId;
    if (incidentsRef.current.some(i => i.id === id)) {
      // Update coordinates if location changed
      setIncidents((prev) => {
        const next = prev.map(incident => (
          incident.id === id
            ? { ...incident, lat: payload.latitude, lng: payload.longitude }
            : incident
        ));
        incidentsRef.current = next;
        return next;
      });
      return;
    }

    const newIncident: OperatorMapIncident = {
      id,
      code: `INC-${id.slice(-6).toUpperCase()}`,
      stage: 'Pending',
      stageLabel: translateIncidentStage('Pending'),
      lat: payload.latitude,
      lng: payload.longitude,
      address: payload.address ?? 'Chưa rõ',
      needsRedispatch: false,
    };

    incidentsRef.current = [newIncident, ...incidentsRef.current];
    setIncidents(incidentsRef.current);
    setFocusedIncidentId(id);
    setLastCreatedIncidentId(id);
  };

  const upsertIncidentByResponse = (response: CreateIncidentResponse) => {
    const mapped = mapCreateIncidentResponseToOperatorMapIncident(response);
    setIncidents((prev) => {
      const exists = prev.some(i => i.id === mapped.id);
      const next = exists
        ? prev.map(i => (i.id === mapped.id ? mapped : i))
        : [mapped, ...prev];
      incidentsRef.current = next;
      return next;
    });
  };

  const removeIncidentFromSignalR = (payload: IncidentCancelledPayload) => {
    const removedId = payload.incidentId;
    setIncidents((prev) => {
      const next = prev.filter(incident => incident.id !== removedId);
      incidentsRef.current = next;
      return next;
    });

    setFocusedIncidentId((current) => {
      if (current === removedId) {
        return incidentsRef.current[0]?.id ?? null;
      }
      return current;
    });
  };

  const confirmIncident = useCallback(async (incidentId: string) => {
    try {
      const response = await incidentApi.confirmIncident(incidentId);
      upsertIncidentByResponse(response);
    } catch (err) {
      console.error('Failed to confirm incident', err);
      throw err;
    }
  }, []);

  const dispatchIncident = useCallback(async (incidentId: string, rescuerId: string) => {
    try {
      const response = await incidentApi.dispatchIncident(incidentId, { rescuerId });
      upsertIncidentByResponse(response);
    } catch (err) {
      console.error('Failed to dispatch incident', err);
      throw err;
    }
  }, []);

  const cancelDispatch = useCallback(async (incidentId: string) => {
    try {
      const response = await incidentApi.cancelDispatch(incidentId);
      upsertIncidentByResponse(response);
    } catch (err) {
      console.error('Failed to cancel incident dispatch', err);
      throw err;
    }
  }, []);

  const refreshIncidents = useCallback(async () => {
    try {
      const response = await incidentApi.getActiveIncidents({ page: 1, pageSize: 100 });
      const mapped = response.items.map(toOperatorMapIncident);
      incidentsRef.current = mapped;
      setIncidents(mapped);
    } catch (err) {
      console.error('Failed to refresh incidents', err);
      setHasError(true);
    }
  }, []);

  useRescuerHub({
    onNewIncidentCreated: addIncidentFromSignalR,
    onIncidentCancelled: removeIncidentFromSignalR,
  });

  const value = useMemo(() => ({
    incidents,
    focusedIncidentId,
    setFocusedIncidentId,
    lastCreatedIncidentId,
    clearLastCreatedIncidentId,
    confirmIncident,
    dispatchIncident,
    cancelDispatch,
    refreshIncidents,
    hasError,
    isLoading,
  }), [incidents, focusedIncidentId, lastCreatedIncidentId, clearLastCreatedIncidentId, confirmIncident, dispatchIncident, cancelDispatch, refreshIncidents, hasError, isLoading]);

  return value;
}
