'use client';

import type { OperatorIncidentSummaryResponse } from '@/types/operator.type';
import type { NewIncidentCreatedPayload } from '@/types/signalr.type';
import { useEffect, useMemo, useRef, useState } from 'react';

import { incidentApi } from '@/apis/incident.api';
import { useRescuerHub } from '@/hooks/useRescuerHub';

export interface OperatorMapIncident {
  id: string;
  code: string;
  stage: string;
  lat: number;
  lng: number;
  address: string;
  needsRedispatch: boolean;
}

export interface UseOperatorIncidentsResult {
  incidents: OperatorMapIncident[];
  focusedIncidentId: string | null;
  setFocusedIncidentId: (id: string | null) => void;
  confirmIncident: (incidentId: string) => Promise<void>;
  refreshIncidents: () => Promise<void>;
  hasError: boolean;
  isLoading: boolean;
}

const toOperatorMapIncident = (incident: OperatorIncidentSummaryResponse): OperatorMapIncident => ({
  id: incident.id,
  code: incident.id,
  stage: incident.status,
  lat: incident.locationCoordinates.latitude,
  lng: incident.locationCoordinates.longitude,
  address: '',
  needsRedispatch: incident.needsRedispatch,
});

export function useOperatorIncidents(): UseOperatorIncidentsResult {
  const [incidents, setIncidents] = useState<OperatorMapIncident[]>([]);
  const [focusedIncidentId, setFocusedIncidentId] = useState<string | null>(null);
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
      lat: payload.latitude,
      lng: payload.longitude,
      address: 'Chưa rõ',
      needsRedispatch: false,
    };

    incidentsRef.current = [newIncident, ...incidentsRef.current];
    setIncidents(incidentsRef.current);
    setFocusedIncidentId(id);
  };

  const confirmIncident = async (incidentId: string) => {
    try {
      await incidentApi.confirmIncident(incidentId);
      setIncidents((prev) => {
        const next = prev.map(i => (
          i.id === incidentId ? { ...i, stage: 'Verified' } : i
        ));
        incidentsRef.current = next;
        return next;
      });
    } catch (err) {
      console.error('Failed to confirm incident', err);
      throw err;
    }
  };

  const refreshIncidents = async () => {
    try {
      const response = await incidentApi.getActiveIncidents({ page: 1, pageSize: 100 });
      const mapped = response.items.map(toOperatorMapIncident);
      incidentsRef.current = mapped;
      setIncidents(mapped);
    } catch (err) {
      console.error('Failed to refresh incidents', err);
      setHasError(true);
    }
  };

  useRescuerHub({
    onNewIncidentCreated: addIncidentFromSignalR,
  });

  const value = useMemo(() => ({
    incidents,
    focusedIncidentId,
    setFocusedIncidentId,
    confirmIncident,
    refreshIncidents,
    hasError,
    isLoading,
  }), [incidents, focusedIncidentId, hasError, isLoading]);

  return value;
}
