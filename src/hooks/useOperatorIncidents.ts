'use client';

import type { OperatorIncidentSummaryResponse } from '@/types/operator.type';
import type {
  IncidentCancelledPayload,
  IncidentCompletedPayload,
  NewIncidentCreatedPayload,
  RescuerDispatchedPayload,
} from '@/types/signalr.type';
import type { CreateIncidentResponse } from '@/types/snakebite-incident.type';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { incidentApi } from '@/apis/incident.api';
import { useToast } from '@/components/ToastProvider';

export interface RescuerAbortedUiPayload {
  incidentId: string;
  rescuerId?: string;
  operatorId?: string | null;
  reason?: string;
}

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
    case 'Finished':
      return 'Đã kết thúc';
    case 'Completed':
      return 'Hoàn thành';
    case 'FalseAlarm':
      return 'Báo động giả';
    case 'Cancelled':
      return 'Đã hủy';
    case 'NoRescuerFound':
      return 'Không tìm được cứu hộ';
    case 'Disputed':
      return 'Tranh chấp';
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
  abortedIncident: { incidentId: string; reason?: string } | null;
  setAbortedIncident: (incident: { incidentId: string; reason?: string } | null) => void;
  clearAbortedIncident: () => void;
  confirmIncident: (incidentId: string) => Promise<void>;
  dispatchIncident: (incidentId: string, rescuerId: string) => Promise<void>;
  refreshIncidents: () => Promise<void>;
  hasError: boolean;
  isLoading: boolean;
  urgentIncidentIds: Set<string>;
  setUrgentIncidentIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  clearUrgentIncident: (incidentId: string) => void;
  handleIncidentCreated: (payload: NewIncidentCreatedPayload) => void;
  handleIncidentCancelled: (payload: IncidentCancelledPayload) => void;
  handleIncidentCompleted: (payload: IncidentCompletedPayload) => void;
  handleRescuerDispatched: (payload: RescuerDispatchedPayload) => void;
  handleRescuerAborted: (payload: RescuerAbortedUiPayload) => void;
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

export function useOperatorIncidents(clearRequestFocus?: () => void): UseOperatorIncidentsResult {
  const [incidents, setIncidents] = useState<OperatorMapIncident[]>([]);
  const [focusedIncidentId, setFocusedIncidentId] = useState<string | null>(null);
  const [lastCreatedIncidentId, setLastCreatedIncidentId] = useState<string | null>(null);
  const clearLastCreatedIncidentId = useCallback(() => {
    setLastCreatedIncidentId(null);
  }, []);
  const [abortedIncident, setAbortedIncident] = useState<{ incidentId: string; reason?: string } | null>(null);
  const clearAbortedIncident = useCallback(() => {
    setAbortedIncident(null);
  }, []);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [urgentIncidentIds, setUrgentIncidentIds] = useState<Set<string>>(() => new Set());
  const clearUrgentIncident = useCallback((incidentId: string) => {
    setUrgentIncidentIds((prev) => {
      const next = new Set(prev);
      next.delete(incidentId);
      return next;
    });
  }, []);

  const incidentsRef = useRef<OperatorMapIncident[]>([]);
  const { showToast } = useToast();

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

  const addIncidentFromSignalR = useCallback((payload: NewIncidentCreatedPayload) => {
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

    // Clear request focus before setting incident focus
    if (clearRequestFocus) {
      clearRequestFocus();
    }

    setFocusedIncidentId(id);
    setLastCreatedIncidentId(id);
  }, [clearRequestFocus]);

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

  const removeIncidentFromSignalR = useCallback((payload: IncidentCancelledPayload) => {
    const removedId = payload.incidentId;
    const incidentCode = `INC-${removedId.slice(-6).toUpperCase()}`;
    const reasonText = payload.reason ? `: ${payload.reason}` : '';

    showToast(`Ca ${incidentCode} đã hủy bởi người dùng với lí do: ${reasonText}`, { type: 'info' });

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
  }, [showToast]);

  const completeIncidentFromSignalR = useCallback((payload: IncidentCompletedPayload) => {
    const completedId = payload.incidentId;
    if (!completedId) {
      return;
    }

    const incidentCode = `INC-${completedId.slice(-6).toUpperCase()}`;
    showToast(`Case ${incidentCode} đã hoàn thành.`, { type: 'success' });

    setIncidents((prev) => {
      const next = prev.filter(incident => incident.id !== completedId);
      incidentsRef.current = next;
      return next;
    });

    setFocusedIncidentId((current) => {
      if (current === completedId) {
        return incidentsRef.current[0]?.id ?? null;
      }
      return current;
    });

    setUrgentIncidentIds((prev) => {
      if (!prev.has(completedId)) {
        return prev;
      }

      const next = new Set(prev);
      next.delete(completedId);
      return next;
    });
  }, [showToast]);

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

  const refreshIncidents = useCallback(async () => {
    try {
      const response = await incidentApi.getActiveIncidents({ page: 1, pageSize: 100 });

      // Map and ensure each object is a new reference
      const mapped = response.items.map((item) => {
        const incident = toOperatorMapIncident(item);
        return { ...incident }; // Force new object
      });

      incidentsRef.current = mapped;
      setIncidents(mapped);
    } catch (err) {
      console.error('Failed to refresh incidents', err);
      setHasError(true);
    }
  }, []);

  const handleRescuerDispatched = useCallback((payload: RescuerDispatchedPayload) => {
    // Update incident status to Assigned
    setIncidents((prev) => {
      const next = prev.map(incident =>
        incident.id === payload.incidentId
          ? { ...incident, stage: 'Assigned', stageLabel: translateIncidentStage('Assigned') }
          : incident,
      );
      incidentsRef.current = next;
      return next;
    });

    // Show toast notification
    const incidentCode = `INC-${payload.incidentId.slice(-6).toUpperCase()}`;
    showToast(`Rescuer đã chấp nhận nhiệm vụ cho case ${incidentCode}`, { type: 'success' });
  }, [showToast]);

  const handleRescuerAborted = useCallback((payload: RescuerAbortedUiPayload) => {
    const incidentId = payload.incidentId;
    if (!incidentId) {
      return;
    }

    setUrgentIncidentIds(prev => new Set(prev).add(incidentId));
    setFocusedIncidentId(incidentId);
    setAbortedIncident({
      incidentId,
      reason: payload.reason,
    });

    const incidentCode = `INC-${incidentId.slice(-6).toUpperCase()}`;
    const reasonText = payload.reason ? `: ${payload.reason}` : '';
    showToast(`Rescuer đã abort mission cho case ${incidentCode}${reasonText}`, { type: 'warning' });

    // Reflect abort immediately while waiting for API refresh.
    setIncidents((prev) => {
      const next = prev.map(incident =>
        incident.id === incidentId
          ? {
              ...incident,
              stage: 'Verified',
              stageLabel: translateIncidentStage('Verified'),
              needsRedispatch: true,
            }
          : incident,
      );
      incidentsRef.current = next;
      return next;
    });
  }, [showToast]);

  const value = useMemo(() => ({
    incidents,
    focusedIncidentId,
    setFocusedIncidentId,
    lastCreatedIncidentId,
    clearLastCreatedIncidentId,
    abortedIncident,
    setAbortedIncident,
    clearAbortedIncident,
    confirmIncident,
    dispatchIncident,
    refreshIncidents,
    hasError,
    isLoading,
    urgentIncidentIds,
    setUrgentIncidentIds,
    clearUrgentIncident,
    handleIncidentCreated: addIncidentFromSignalR,
    handleIncidentCancelled: removeIncidentFromSignalR,
    handleIncidentCompleted: completeIncidentFromSignalR,
    handleRescuerDispatched,
    handleRescuerAborted,
  }), [incidents, focusedIncidentId, lastCreatedIncidentId, clearLastCreatedIncidentId, abortedIncident, clearAbortedIncident, confirmIncident, dispatchIncident, refreshIncidents, hasError, isLoading, urgentIncidentIds, clearUrgentIncident, addIncidentFromSignalR, removeIncidentFromSignalR, completeIncidentFromSignalR, handleRescuerDispatched, handleRescuerAborted]);

  return value;
}
