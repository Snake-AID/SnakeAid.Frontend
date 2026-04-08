'use client';

import type { LiveIncident } from '@/components/operator/dashboard/OperatorMap';
import type { RescuerAbortedUiPayload } from '@/hooks/useOperatorIncidents';
import type { IncidentCompletedPayload } from '@/types/signalr.type';
import type { DetailSnakebiteIncidentResponse } from '@/types/snakebite-incident.type';
import { UserCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { incidentApi } from '@/apis/incident.api';
import { snakeCatchingRequestApi } from '@/apis/snake-catching-request.api';
import CatchingRequestDetailModal from '@/components/operator/CatchingRequestDetailModal';
import OperatorInfoPanels from '@/components/operator/dashboard/OperatorInfoPanels';
import OperatorMap from '@/components/operator/dashboard/OperatorMap';
import PendingIncidentAlert from '@/components/operator/dashboard/PendingIncidentAlert';
import PendingRequestAlert from '@/components/operator/dashboard/PendingRequestAlert';
import RescuerAbortAlert from '@/components/operator/dashboard/RescuerAbortAlert';
import ShiftSchedulePanel from '@/components/operator/dashboard/ShiftSchedulePanel';
import IncidentDetailModal from '@/components/operator/IncidentDetailModal';
import { useToast } from '@/components/ToastProvider';
import { useOperatorIncidents } from '@/hooks/useOperatorIncidents';
import { useOperatorRequests } from '@/hooks/useOperatorRequests';
import { useOperatorRescuers } from '@/hooks/useOperatorRescuers';
import { useRescuerHub } from '@/hooks/useRescuerHub';
import { getStoredUser } from '@/utils/auth-session';

export default function OperatorDashboardPage() {
  const { showToast } = useToast();
  const [focusTrigger, setFocusTrigger] = useState(0);
  const currentOperatorId = getStoredUser()?.id ?? null;

  const normalizeRescuerAbortedPayload = (payload: unknown): RescuerAbortedUiPayload | null => {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const data = payload as Record<string, unknown>;
    const incidentId = (typeof data.incidentId === 'string' ? data.incidentId : data.IncidentId) as string | undefined;
    if (!incidentId) {
      return null;
    }

    const rescuerId = (typeof data.rescuerId === 'string' ? data.rescuerId : data.RescuerId) as string | undefined;
    const operatorId = (typeof data.operatorId === 'string' ? data.operatorId : data.OperatorId) as string | null | undefined;
    const reason = (typeof data.reason === 'string' ? data.reason : data.Reason) as string | undefined;

    return {
      incidentId,
      rescuerId,
      operatorId: operatorId ?? null,
      reason,
    };
  };

  const normalizeIncidentCompletedPayload = (payload: unknown): IncidentCompletedPayload | null => {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const data = payload as Record<string, unknown>;
    const incidentId = (typeof data.incidentId === 'string' ? data.incidentId : data.IncidentId) as string | undefined;
    const rescuerId = (typeof data.rescuerId === 'string' ? data.rescuerId : data.RescuerId) as string | undefined;
    const completedAt = (typeof data.completedAt === 'string' ? data.completedAt : data.CompletedAt) as string | undefined;

    if (!incidentId || !rescuerId || !completedAt) {
      return null;
    }

    return {
      incidentId,
      rescuerId,
      completedAt,
    };
  };

  const {
    requests,
    focusedRequestId,
    setFocusedRequestId,
    lastCreatedRequestId,
    clearLastCreatedRequestId,
    refreshRequests,
    confirmRequest,
    assignRequest,
    cancelRequest,
    isLoading: isRequestsLoading,
    hasError: hasRequestsError,
    handleRequestCreated,
    handleRequestCancelled,
  } = useOperatorRequests();

  const {
    incidents,
    focusedIncidentId,
    setFocusedIncidentId,
    lastCreatedIncidentId,
    clearLastCreatedIncidentId,
    abortedIncident,
    clearAbortedIncident,
    confirmIncident,
    dispatchIncident,
    refreshIncidents,
    urgentIncidentIds,
    clearUrgentIncident,
    handleIncidentCreated,
    handleIncidentCancelled,
    handleIncidentCompleted: applyIncidentCompleted,
    handleRescuerDispatched,
    handleRescuerAborted: applyRescuerAborted,
  } = useOperatorIncidents(() => setFocusedRequestId(null));

  const {
    rescuerRegistry,
    liveRescuers,
    shiftAssignmentsWithStatus,
    loadRescuerData,
    loadOnlineRescuers,
    clearMissionLocation,
    handleRescuerOnlineStatus,
    handleRescuerIdleLocationUpdated,
    handleRescuerMissionLocationUpdated,
    handleMissionCompleted,
    handleIncidentCompleted: syncRescuerAfterIncidentCompleted,
  } = useOperatorRescuers();

  // Handle rescuer abort at page level to ensure toast and alert work properly
  const handleRescuerAborted = useCallback((payload: unknown) => {
    const normalizedPayload = normalizeRescuerAbortedPayload(payload);
    if (!normalizedPayload) {
      return;
    }

    if (normalizedPayload.operatorId && normalizedPayload.operatorId !== currentOperatorId) {
      return;
    }

    // Clear request focus when rescuer aborts
    setFocusedRequestId(null);

    // Clear mission location for this rescuer
    if (normalizedPayload.rescuerId) {
      clearMissionLocation(normalizedPayload.rescuerId);
    }

    applyRescuerAborted(normalizedPayload);

    // Refresh incidents to get updated status from backend
    void refreshIncidents();

    // Reload rescuer data to get updated status
    void loadRescuerData();
  }, [currentOperatorId, setFocusedRequestId, clearMissionLocation, refreshIncidents, loadRescuerData, applyRescuerAborted]);

  const handleIncidentCompleted = useCallback((payload: unknown) => {
    const normalizedPayload = normalizeIncidentCompletedPayload(payload);
    if (!normalizedPayload) {
      console.error('[SignalR][OperatorDashboard] Failed to normalize IncidentCompleted payload:', payload);
      return;
    }

    // Keep incident list in sync and notify operator.
    applyIncidentCompleted(normalizedPayload);

    // Keep rescuer layer in sync.
    syncRescuerAfterIncidentCompleted(normalizedPayload);

    // Ensure active list is consistent with backend source of truth.
    void refreshIncidents();
  }, [applyIncidentCompleted, syncRescuerAfterIncidentCompleted, refreshIncidents]);

  // Central SignalR hub connection with all handlers merged
  useRescuerHub({
    onNewIncidentCreated: handleIncidentCreated,
    onIncidentCancelled: handleIncidentCancelled,
    onRescuerAborted: handleRescuerAborted,
    onRescuerDispatched: handleRescuerDispatched,
    onSnakeCatchingRequestCreated: handleRequestCreated,
    onSnakeCatchingRequestCancelled: handleRequestCancelled,
    onRescuerOnlineStatus: handleRescuerOnlineStatus,
    onRescuerIdleLocationUpdated: handleRescuerIdleLocationUpdated,
    onRescuerMissionLocationUpdated: handleRescuerMissionLocationUpdated,
    onMissionCompleted: handleMissionCompleted,
    onIncidentCompleted: handleIncidentCompleted,
  });

  const liveRequests = useMemo(() => {
    return requests
      .filter(r => r.lat != null && r.lng != null)
      .map(r => ({
        id: r.id,
        address: r.address ?? null,
        lat: r.lat as number,
        lng: r.lng as number,
        status: r.statusLabel ?? r.status,
      }));
  }, [requests]);

  const [detailIncident, setDetailIncident] = useState<DetailSnakebiteIncidentResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [detailRequestId, setDetailRequestId] = useState<string | null>(null);
  const [detailRequest, setDetailRequest] = useState<any | null>(null);
  const [detailRequestOpen, setDetailRequestOpen] = useState(false);
  const [detailRequestLoading, setDetailRequestLoading] = useState(false);
  const [detailRequestError, setDetailRequestError] = useState<string | null>(null);
  const [shiftPanelOpen, setShiftPanelOpen] = useState(false);

  const incidentRowRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const requestRowRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const liveIncidents = useMemo<LiveIncident[]>(() => {
    return incidents.map(i => ({
      id: i.id,
      code: i.code,
      address: i.address,
      lat: i.lat,
      lng: i.lng,
      stage: i.stage,
      stageLabel: i.stageLabel,
      needsRedispatch: i.needsRedispatch,
    }));
  }, [incidents]);

  const openIncidentDetail = async (incidentId: string) => {
    setDetailError(null);
    setDetailLoading(true);
    setDetailOpen(true);

    try {
      const detail = await incidentApi.getIncident(incidentId);
      setDetailIncident(detail);
    } catch (err) {
      console.error('Failed to load incident detail', err);
      setDetailError('Không thể tải thông tin case.');
      setDetailIncident(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeIncidentDetail = () => {
    setDetailOpen(false);
    setDetailIncident(null);
    setDetailError(null);
  };

  const handleVerify = async (incidentId: string) => {
    try {
      await confirmIncident(incidentId);
      showToast('Case đã được xác nhận.', { type: 'success' });
    } catch (err) {
      console.error('Failed to confirm incident', err);
      showToast('Không thể xác nhận case. Vui lòng thử lại.', { type: 'error' });
    }
  };

  const handleFalseAlarm = async (incidentId: string) => {
    try {
      await incidentApi.markFalseAlarm(incidentId, {
        reason: 'Operator marked as false alarm',
      });
      showToast('Case đã được đánh dấu là báo động giả.', { type: 'success' });
      refreshIncidents();
    } catch (err) {
      console.error('Failed to mark false alarm', err);
      showToast('Không thể đánh dấu case là báo động giả. Vui lòng thử lại.', { type: 'error' });
    }
  };

  const handleDispatch = async (incidentId: string, rescuerId: string) => {
    try {
      await dispatchIncident(incidentId, rescuerId);
      showToast('Case đã được điều phối.', { type: 'success' });
    } catch (err) {
      console.error('Failed to dispatch incident', err);
      showToast('Không thể điều phối case. Vui lòng thử lại.', { type: 'error' });
    }
  };

  const handleConfirmRequest = async (requestId: string) => {
    try {
      await confirmRequest(requestId);
      showToast('Yêu cầu đã được xác nhận.', { type: 'success' });
      await refreshRequests();
    } catch (err) {
      console.error('Failed to confirm request', err);
      showToast('Không thể xác nhận yêu cầu. Vui lòng thử lại.', { type: 'error' });
    }
  };

  const handleAssignRequest = async (requestId: string, rescuerId: string) => {
    try {
      await assignRequest(requestId, rescuerId);
      showToast('Đã điều phối cứu hộ.', { type: 'success' });
      await refreshRequests();
    } catch (err) {
      console.error('Failed to assign request', err);
      showToast('Không thể điều phối. Vui lòng thử lại.', { type: 'error' });
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelRequest(requestId, 'Cancelled by operator');
      showToast('Yêu cầu đã được hủy.', { type: 'success' });
      await refreshRequests();
    } catch (err) {
      console.error('Failed to cancel request', err);
      showToast('Không thể hủy yêu cầu. Vui lòng thử lại.', { type: 'error' });
    }
  };

  const focusedIncident = useMemo(() => {
    if (!focusedIncidentId) {
      return null;
    }
    return liveIncidents.find(i => i.id === focusedIncidentId) ?? null;
  }, [focusedIncidentId, liveIncidents]);

  const focusedRequest = useMemo(() => {
    if (!focusedRequestId) {
      return null;
    }
    return requests.find(r => r.id === focusedRequestId) ?? null;
  }, [focusedRequestId, requests]);

  useEffect(() => {
    if (!focusedIncident) {
      return;
    }

    const el = incidentRowRefs.current[focusedIncident.id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusedIncident]);

  useEffect(() => {
    if (!focusedRequest) {
      return;
    }

    const el = requestRowRefs.current[focusedRequest.id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusedRequest]);

  // Scroll incident row into view when aborted incident is focused
  useEffect(() => {
    if (!abortedIncident) {
      return;
    }

    const el = incidentRowRefs.current[abortedIncident.incidentId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [abortedIncident]);

  const handleIncidentClick = useCallback((incidentId: string) => {
    setFocusedRequestId(null);
    setFocusedIncidentId(incidentId);
    setFocusTrigger(prev => prev + 1);
    openIncidentDetail(incidentId);
    clearUrgentIncident(incidentId);
  }, [setFocusedIncidentId, setFocusedRequestId, clearUrgentIncident]);

  const openRequestDetail = async (requestId: string) => {
    setDetailRequestError(null);
    setDetailRequestLoading(true);
    setDetailRequestOpen(true);

    try {
      const detail = await snakeCatchingRequestApi.getRequest(requestId);
      setDetailRequest(detail);
      setDetailRequestId(requestId);
    } catch (err) {
      console.error('Failed to load request detail', err);
      setDetailRequestError('Không thể tải thông tin request.');
      setDetailRequest(null);
    } finally {
      setDetailRequestLoading(false);
    }
  };

  const handleRequestClick = useCallback((requestId: string) => {
    setFocusedIncidentId(null);
    setFocusedRequestId(requestId);
    setFocusTrigger(prev => prev + 1);
    openRequestDetail(requestId);
  }, [setFocusedIncidentId, setFocusedRequestId]);

  return (
    <main className="relative h-[calc(100vh-81px)] overflow-hidden bg-slate-50">
      {lastCreatedIncidentId && (
        <PendingIncidentAlert
          incidentId={lastCreatedIncidentId}
          focusedIncident={focusedIncident}
          onViewDetail={openIncidentDetail}
          onHide={() => {
            clearLastCreatedIncidentId();
          }}
          onConfirm={async (id) => {
            await confirmIncident(id);
            clearLastCreatedIncidentId();
          }}
        />
      )}

      {lastCreatedRequestId && (
        <PendingRequestAlert
          requestId={lastCreatedRequestId}
          focusedRequest={focusedRequest}
          onViewDetail={openRequestDetail}
          onHide={() => {
            clearLastCreatedRequestId();
          }}
          onConfirm={async (id) => {
            await handleConfirmRequest(id);
            clearLastCreatedRequestId();
          }}
        />
      )}

      {abortedIncident && (
        <RescuerAbortAlert
          incidentId={abortedIncident.incidentId}
          reason={abortedIncident.reason}
          onViewDetail={openIncidentDetail}
          onDismiss={clearAbortedIncident}
          onRedispatch={(id) => {
            openIncidentDetail(id);
            clearAbortedIncident();
          }}
        />
      )}

      <IncidentDetailModal
        incident={detailIncident}
        isOpen={detailOpen}
        isLoading={detailLoading}
        error={detailError}
        onClose={closeIncidentDetail}
        onVerify={handleVerify}
        onFalseAlarm={handleFalseAlarm}
        onDispatch={handleDispatch}
        onRefresh={refreshIncidents}
      />

      <CatchingRequestDetailModal
        request={detailRequest}
        requestId={detailRequestId}
        isOpen={detailRequestOpen}
        isLoading={detailRequestLoading}
        error={detailRequestError}
        onClose={() => {
          setDetailRequestOpen(false);
          setDetailRequest(null);
          setDetailRequestId(null);
          setDetailRequestError(null);
        }}
        onConfirm={handleConfirmRequest}
        onAssign={handleAssignRequest}
        onCancel={handleCancelRequest}
        onRefresh={refreshRequests}
      />

      <OperatorMap
        liveIncidents={liveIncidents}
        liveRequests={liveRequests}
        liveRescuers={liveRescuers}
        focusedIncidentId={focusedIncidentId}
        focusedRequestId={focusedRequestId}
        focusTrigger={focusTrigger}
        onIncidentClick={handleIncidentClick}
        onRequestClick={handleRequestClick}
      />

      <OperatorInfoPanels
        incidents={incidents}
        requests={requests}
        liveRescuers={liveRescuers}
        rescuerRegistry={rescuerRegistry}
        focusedIncidentId={focusedIncidentId}
        focusedRequestId={focusedRequestId}
        urgentIncidentIds={urgentIncidentIds}
        incidentRowRefs={incidentRowRefs}
        requestRowRefs={requestRowRefs}
        onIncidentClick={handleIncidentClick}
        onRequestClick={handleRequestClick}
        isRequestsLoading={isRequestsLoading}
        hasRequestsError={hasRequestsError}
        onRefreshRequests={refreshRequests}
        onRefreshIncidents={refreshIncidents}
        onRefreshRescuers={loadOnlineRescuers}
      />

      <ShiftSchedulePanel
        isOpen={shiftPanelOpen}
        onClose={() => setShiftPanelOpen(false)}
        shiftAssignmentsWithStatus={shiftAssignmentsWithStatus}
      />

      {/* Bubble icon for shift schedule */}
      <div
        className="fixed right-5 bottom-20 z-30 flex flex-col gap-3 pointer-events-auto"
      >
        <button
          type="button"
          onClick={() => setShiftPanelOpen(prev => !prev)}
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition ${shiftPanelOpen ? 'ring-4 ring-teal-300' : 'hover:bg-slate-100'}`}
          aria-label="Shift schedule"
        >
          <UserCheck className="size-6 text-teal-700" />
        </button>
      </div>
    </main>
  );
}
