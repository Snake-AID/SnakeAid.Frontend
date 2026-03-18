'use client';

import type { OperatorSnakeCatchingRequestSummaryResponse } from '@/types/operator.type';
import type {
  CreateSnakeCatchingRequestResponse,
  SnakeCatchingRequestAcceptedPayload,
  SnakeCatchingRequestAssignedPayload,
  SnakeCatchingRequestCancelledPayload,
  SnakeCatchingRequestCreatedPayload,
} from '@/types/snakecatching-request.type';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { snakeCatchingRequestApi } from '@/apis/snake-catching-request.api';
import { useRescuerHub } from '@/hooks/useRescuerHub';

export interface OperatorRequestSummary {
  id: string;
  status: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  distanceKm?: number | null;
  assignedRescuerId?: string | null;
  needsRedispatch?: boolean;
}

export interface UseOperatorRequestsResult {
  requests: OperatorRequestSummary[];
  focusedRequestId: string | null;
  setFocusedRequestId: (id: string | null) => void;
  confirmRequest: (requestId: string) => Promise<void>;
  assignRequest: (requestId: string, rescuerId: string) => Promise<void>;
  cancelRequest: (requestId: string, reason: string) => Promise<void>;
  refreshRequests: () => Promise<void>;
  hasError: boolean;
  isLoading: boolean;
}

export function useOperatorRequests(): UseOperatorRequestsResult {
  const [requests, setRequests] = useState<OperatorRequestSummary[]>([]);
  const [focusedRequestId, setFocusedRequestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const requestsRef = useRef<OperatorRequestSummary[]>([]);

  const upsertRequest = useCallback((payload: Partial<CreateSnakeCatchingRequestResponse> & { id: string }) => {
    const next = requestsRef.current.slice();
    const existingIndex = next.findIndex(r => r.id === payload.id);

    if (existingIndex >= 0) {
      const existing = next[existingIndex]!;
      const lat = payload.lat ?? payload.locationCoordinates?.latitude ?? existing.lat;
      const lng = payload.lng ?? payload.locationCoordinates?.longitude ?? existing.lng;

      next[existingIndex] = {
        ...existing,
        id: existing.id,
        status: payload.status ?? existing.status,
        address: payload.address !== undefined ? payload.address : existing.address,
        lat,
        lng,
        distanceKm: payload.distanceKm !== undefined ? payload.distanceKm : existing.distanceKm,
        assignedRescuerId: payload.assignedRescuerId !== undefined ? payload.assignedRescuerId : existing.assignedRescuerId,
      };
    } else {
      const lat = payload.lat ?? payload.locationCoordinates?.latitude ?? null;
      const lng = payload.lng ?? payload.locationCoordinates?.longitude ?? null;

      next.unshift({
        id: payload.id,
        status: payload.status ?? 'Pending',
        address: payload.address ?? null,
        lat,
        lng,
        distanceKm: payload.distanceKm ?? null,
        assignedRescuerId: payload.assignedRescuerId ?? null,
        needsRedispatch: false,
      });
    }

    requestsRef.current = next;
    setRequests(next);
  }, []);

  const refreshRequests = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const response = await snakeCatchingRequestApi.getActiveRequests({ page: 1, pageSize: 100 });
      const mapped = response.items.map((item: OperatorSnakeCatchingRequestSummaryResponse) => ({
        id: item.id,
        status: item.status,
        address: '',
        lat: item.locationCoordinates.latitude,
        lng: item.locationCoordinates.longitude,
        distanceKm: null,
        assignedRescuerId: item.assignedRescuerId ?? null,
        needsRedispatch: false,
      }));
      requestsRef.current = mapped;
      setRequests(mapped);
      setFocusedRequestId(mapped[0]?.id ?? null);
    } catch (err) {
      console.error('Failed to load snake catching requests', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRequests();
  }, [refreshRequests]);

  const handleCreated = useCallback((payload: SnakeCatchingRequestCreatedPayload) => {
    upsertRequest(payload as Partial<CreateSnakeCatchingRequestResponse> & { id: string });
    setFocusedRequestId(payload.id);
  }, [upsertRequest, setFocusedRequestId]);

  const handleUpdated = useCallback((payload: SnakeCatchingRequestAcceptedPayload | SnakeCatchingRequestAssignedPayload | SnakeCatchingRequestCancelledPayload) => {
    upsertRequest(payload as Partial<CreateSnakeCatchingRequestResponse> & { id: string });
  }, [upsertRequest]);

  useRescuerHub({
    onSnakeCatchingRequestCreated: handleCreated,
    onSnakeCatchingRequestAccepted: handleUpdated,
    onSnakeCatchingRequestAssigned: handleUpdated,
    onSnakeCatchingRequestCancelled: handleUpdated,
  });

  const confirmRequest = useCallback(async (requestId: string) => {
    await snakeCatchingRequestApi.confirmRequest(requestId);
  }, []);

  const assignRequest = useCallback(async (requestId: string, rescuerId: string) => {
    await snakeCatchingRequestApi.assignRequest(requestId, { rescuerId });
  }, []);

  const cancelRequest = useCallback(async (requestId: string, reason: string) => {
    await snakeCatchingRequestApi.cancelRequest(requestId, { reason });
  }, []);

  const value = useMemo(() => ({
    requests,
    focusedRequestId,
    setFocusedRequestId,
    confirmRequest,
    assignRequest,
    cancelRequest,
    refreshRequests,
    hasError,
    isLoading,
  }), [
    requests,
    focusedRequestId,
    confirmRequest,
    assignRequest,
    cancelRequest,
    refreshRequests,
    hasError,
    isLoading,
  ]);

  return value;
}
