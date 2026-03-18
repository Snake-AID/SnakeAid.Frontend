'use client';

import type { LiveIncident } from '@/components/operator/dashboard/OperatorMap';
import type { DetailSnakebiteIncidentResponse } from '@/types/snakebite-incident.type';
import { UserCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { incidentApi } from '@/apis/incident.api';
import { snakeCatchingRequestApi } from '@/apis/snake-catching-request.api';
import CatchingRequestDetailModal from '@/components/operator/CatchingRequestDetailModal';
import OperatorInfoPanels from '@/components/operator/dashboard/OperatorInfoPanels';
import OperatorMap from '@/components/operator/dashboard/OperatorMap';
import PendingIncidentAlert from '@/components/operator/dashboard/PendingIncidentAlert';
import ShiftSchedulePanel from '@/components/operator/dashboard/ShiftSchedulePanel';
import IncidentDetailModal from '@/components/operator/IncidentDetailModal';
import { useToast } from '@/components/ToastProvider';
import { useOperatorIncidents } from '@/hooks/useOperatorIncidents';
import { useOperatorRequests } from '@/hooks/useOperatorRequests';
import { useOperatorRescuers } from '@/hooks/useOperatorRescuers';
import { useRescuerHub } from '@/hooks/useRescuerHub';

export default function OperatorDashboardPage() {
  const {
    incidents,
    focusedIncidentId,
    setFocusedIncidentId,
    confirmIncident,
    refreshIncidents,
  } = useOperatorIncidents();

  const { showToast } = useToast();
  const { rescuerRegistry, liveRescuers, shiftAssignmentsWithStatus } = useOperatorRescuers();

  const {
    requests,
    focusedRequestId,
    setFocusedRequestId,
    refreshRequests,
    confirmRequest,
    assignRequest,
    cancelRequest,
    isLoading: isRequestsLoading,
    hasError: hasRequestsError,
  } = useOperatorRequests();

  const liveRequests = useMemo(() => {
    return requests
      .filter(r => r.lat != null && r.lng != null)
      .map(r => ({
        id: r.id,
        address: r.address ?? null,
        lat: r.lat as number,
        lng: r.lng as number,
        status: r.status,
      }));
  }, [requests]);

  const [pendingConfirmIncidentId, setPendingConfirmIncidentId] = useState<string | null>(null);
  const [detailIncident, setDetailIncident] = useState<DetailSnakebiteIncidentResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [detailRequestId, setDetailRequestId] = useState<string | null>(null);
  const [detailRequest, setDetailRequest] = useState<any | null>(null);
  const [detailRequestOpen, setDetailRequestOpen] = useState(false);
  const [detailRequestLoading, setDetailRequestLoading] = useState(false);
  const [detailRequestError, setDetailRequestError] = useState<string | null>(null);
  const [urgentIncidentIds, setUrgentIncidentIds] = useState<Set<string>>(new Set());
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
    await incidentApi.confirmIncident(incidentId);
  };

  const handleFalseAlarm = async (incidentId: string) => {
    await incidentApi.markFalseAlarm(incidentId, {
      reason: 'Operator marked as false alarm',
    });
  };

  const handleDispatch = async (incidentId: string, rescuerId: string) => {
    await incidentApi.dispatchIncident(incidentId, { rescuerId });
  };

  const handleCancelDispatch = async (incidentId: string) => {
    await incidentApi.cancelDispatch(incidentId);
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

  useEffect(() => {
    if (!focusedIncident) {
      return;
    }

    if (focusedIncident.stage === 'Pending') {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setPendingConfirmIncidentId(focusedIncident.id);
    }
  }, [focusedIncident]);

  useEffect(() => {
    if (!focusedRequestId) {
      return;
    }

    const el = requestRowRefs.current[focusedRequestId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusedRequestId]);

  const handleRescuerAborted = useCallback((payload: { incidentId: string; rescuerId: string; reason?: string }) => {
    showToast('Rescuer đã abort. Vui lòng xử lý case này.', { type: 'info' });
    setUrgentIncidentIds(prev => new Set(prev).add(payload.incidentId));
    setFocusedRequestId(null);
    setFocusedIncidentId(payload.incidentId);

    // Scroll item into view if rendered
    const el = incidentRowRefs.current[payload.incidentId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Optionally refresh list so UI state (needsRedispatch etc) stays fresh
    refreshIncidents();
  }, [refreshIncidents, setFocusedRequestId]);

  useRescuerHub({
    onRescuerAborted: handleRescuerAborted,
  });

  const handleIncidentClick = useCallback((incidentId: string) => {
    setFocusedRequestId(null);
    setFocusedIncidentId(incidentId);
    openIncidentDetail(incidentId);
    setUrgentIncidentIds((prev) => {
      const next = new Set(prev);
      next.delete(incidentId);
      return next;
    });
  }, [setFocusedIncidentId, setFocusedRequestId, setUrgentIncidentIds]);

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
    setFocusedRequestId(requestId);
    openRequestDetail(requestId);
  }, [setFocusedRequestId]);

  return (
    <main className="relative h-[calc(100vh-81px)] overflow-hidden bg-slate-50">
      {pendingConfirmIncidentId && (
        <PendingIncidentAlert
          incidentId={pendingConfirmIncidentId}
          focusedIncident={focusedIncident}
          onViewDetail={openIncidentDetail}
          onHide={() => setPendingConfirmIncidentId(null)}
          onConfirm={async (id) => {
            await confirmIncident(id);
            setPendingConfirmIncidentId(null);
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
        onCancelDispatch={handleCancelDispatch}
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
