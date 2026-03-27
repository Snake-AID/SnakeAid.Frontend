'use client';

import type { OperatorSnakeCatchingRequestSummaryResponse } from '@/types/operator.type';
import type {
  SnakeCatchingRequestCancelledPayload,
  SnakeCatchingRequestCreatedPayload,
} from '@/types/snakecatching-request.type';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { snakeCatchingRequestApi } from '@/apis/snake-catching-request.api';
import { useToast } from '@/components/ToastProvider';

export interface OperatorRequestSummary {
  id: string;
  status: string;
  statusLabel: string;
  address?: string | null;
  lat: number;
  lng: number;
  distanceKm?: number | null;
  assignedRescuerId?: string | null;
  needsRedispatch?: boolean;
}

const translateRequestStatus = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'Chờ xác minh';
    case 'Confirmed':
      return 'Đã xác nhận';
    case 'Assigned':
      return 'Đã điều phối';
    case 'Cancelled':
      return 'Đã hủy';
    case 'Completed':
      return 'Hoàn tất';
    case 'Declined':
      return 'Từ chối';
    default:
      return status;
  }
};

export interface UseOperatorRequestsResult {
  requests: OperatorRequestSummary[];
  focusedRequestId: string | null;
  setFocusedRequestId: (id: string | null) => void;
  lastCreatedRequestId: string | null;
  clearLastCreatedRequestId: () => void;
  confirmRequest: (requestId: string) => Promise<void>;
  assignRequest: (requestId: string, rescuerId: string) => Promise<void>;
  cancelRequest: (requestId: string, reason: string) => Promise<void>;
  refreshRequests: () => Promise<void>;
  hasError: boolean;
  isLoading: boolean;
  handleRequestCreated: (payload: SnakeCatchingRequestCreatedPayload) => void;
  handleRequestCancelled: (payload: SnakeCatchingRequestCancelledPayload) => void;
}

export function useOperatorRequests(): UseOperatorRequestsResult {
  const [requests, setRequests] = useState<OperatorRequestSummary[]>([]);
  const [focusedRequestId, setFocusedRequestId] = useState<string | null>(null);
  const [lastCreatedRequestId, setLastCreatedRequestId] = useState<string | null>(null);
  const clearLastCreatedRequestId = useCallback(() => {
    setLastCreatedRequestId(null);
  }, []);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const requestsRef = useRef<OperatorRequestSummary[]>([]);
  const { showToast } = useToast();

  const addRequestFromSignalR = useCallback((payload: SnakeCatchingRequestCreatedPayload) => {
    const id = payload.id;
    const requestCode = `CAR-${id.slice(-6).toUpperCase()}`;
    showToast(`Yêu cầu ${requestCode} đã tạo`, { type: 'info' });

    if (requestsRef.current.some(r => r.id === id)) {
      setRequests((prev) => {
        const next = prev.map(r => (
          r.id === id ? { ...r, lat: payload.lat, lng: payload.lng } : r
        ));
        requestsRef.current = next;
        return next;
      });
      return;
    }

    const newRequest: OperatorRequestSummary = {
      id,
      status: payload.status,
      statusLabel: translateRequestStatus(payload.status),
      address: payload.address ?? null,
      lat: payload.lat,
      lng: payload.lng,
      distanceKm: null,
      assignedRescuerId: null,
      needsRedispatch: false,
    };

    requestsRef.current = [newRequest, ...requestsRef.current];
    setRequests(requestsRef.current);
    setFocusedRequestId(id);
  }, [setFocusedRequestId, showToast]);

  const refreshRequests = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const response = await snakeCatchingRequestApi.getActiveRequests({ page: 1, pageSize: 100 });
      const mapped = response.items.map((item: OperatorSnakeCatchingRequestSummaryResponse) => ({
        id: item.id,
        status: item.status,
        statusLabel: translateRequestStatus(item.status),
        address: item.address ?? '',
        lat: item.locationCoordinates.latitude,
        lng: item.locationCoordinates.longitude,
        distanceKm: null,
        assignedRescuerId: item.assignedRescuerId ?? null,
        needsRedispatch: false,
      }));
      requestsRef.current = mapped;
      setRequests(mapped);
      setFocusedRequestId(prev => prev ?? mapped[0]?.id ?? null);
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
    addRequestFromSignalR(payload);
    setLastCreatedRequestId(payload.id);
  }, [addRequestFromSignalR]);

  const handleCancelled = useCallback((payload: SnakeCatchingRequestCancelledPayload) => {
    const id = payload.id;
    const requestCode = `CAR-${id.slice(-6).toUpperCase()}`;
    const reason = payload.cancellationReason ? `: ${payload.cancellationReason}` : '';

    setRequests((prev) => {
      const next = prev.filter(r => r.id !== id);
      requestsRef.current = next;
      return next;
    });

    setFocusedRequestId((current) => {
      if (current === id) {
        return requestsRef.current[0]?.id ?? null;
      }
      return current;
    });

    showToast(`Yêu cầu ${requestCode} đã hủy${reason}`, { type: 'info' });
  }, [showToast]);

  // Don't call useRescuerHub here - will be called centrally in page
  // useRescuerHub({
  //   onSnakeCatchingRequestCreated: handleCreated,
  //   onSnakeCatchingRequestCancelled: handleCancelled,
  // });

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
    lastCreatedRequestId,
    clearLastCreatedRequestId,
    confirmRequest,
    assignRequest,
    cancelRequest,
    refreshRequests,
    hasError,
    isLoading,
    handleRequestCreated: handleCreated,
    handleRequestCancelled: handleCancelled,
  }), [
    requests,
    focusedRequestId,
    lastCreatedRequestId,
    clearLastCreatedRequestId,
    confirmRequest,
    assignRequest,
    cancelRequest,
    refreshRequests,
    hasError,
    isLoading,
    handleCreated,
    handleCancelled,
  ]);

  return value;
}
