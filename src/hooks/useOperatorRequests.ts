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

const toOperatorRequestSummary = (item: CreateSnakeCatchingRequestResponse): OperatorRequestSummary => {
  const lat = item.lat ?? item.locationCoordinates?.latitude ?? null;
  const lng = item.lng ?? item.locationCoordinates?.longitude ?? null;

  return {
    id: item.id,
    status: item.status,
    address: item.address ?? null,
    lat,
    lng,
    distanceKm: item.distanceKm ?? null,
    assignedRescuerId: item.assignedRescuerId ?? null,
    needsRedispatch: false,
  };
};

export function useOperatorRequests(): UseOperatorRequestsResult {
  const [requests, setRequests] = useState<OperatorRequestSummary[]>([]);
  const [focusedRequestId, setFocusedRequestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const requestsRef = useRef<OperatorRequestSummary[]>([]);

  const upsertRequest = useCallback((payload: CreateSnakeCatchingRequestResponse) => {
    const next = requestsRef.current.slice();
    const existingIndex = next.findIndex(r => r.id === payload.id);
    const nextItem = toOperatorRequestSummary(payload);

    if (existingIndex >= 0) {
      next[existingIndex] = {
        ...next[existingIndex],
        ...nextItem,
      };
    } else {
      next.unshift(nextItem);
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
    upsertRequest(payload as CreateSnakeCatchingRequestResponse);
    setFocusedRequestId(payload.id);
  }, [upsertRequest]);

  const handleUpdated = useCallback((payload: SnakeCatchingRequestAcceptedPayload | SnakeCatchingRequestAssignedPayload | SnakeCatchingRequestCancelledPayload) => {
    upsertRequest(payload as CreateSnakeCatchingRequestResponse);
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
