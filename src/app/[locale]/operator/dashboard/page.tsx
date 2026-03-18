'use client';

import type { LiveIncident } from '@/components/operator/dashboard/OperatorMap';
import type { DetailSnakebiteIncidentResponse } from '@/types/snakebite-incident.type';
import { UserCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { incidentApi } from '@/apis/incident.api';
import OperatorInfoPanels from '@/components/operator/dashboard/OperatorInfoPanels';
import OperatorMap from '@/components/operator/dashboard/OperatorMap';
import PendingIncidentAlert from '@/components/operator/dashboard/PendingIncidentAlert';
import ShiftSchedulePanel from '@/components/operator/dashboard/ShiftSchedulePanel';
import IncidentDetailModal from '@/components/operator/IncidentDetailModal';
import { useToast } from '@/components/ToastProvider';
import { useOperatorIncidents } from '@/hooks/useOperatorIncidents';
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

  const [pendingConfirmIncidentId, setPendingConfirmIncidentId] = useState<string | null>(null);
  const [detailIncident, setDetailIncident] = useState<DetailSnakebiteIncidentResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [urgentIncidentIds, setUrgentIncidentIds] = useState<Set<string>>(new Set());
  const [shiftPanelOpen, setShiftPanelOpen] = useState(false);

  const incidentRowRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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

  const handleRescuerAborted = useCallback((payload: { incidentId: string; rescuerId: string; reason?: string }) => {
    showToast('Rescuer đã abort. Vui lòng xử lý case này.', { type: 'info' });
    setUrgentIncidentIds(prev => new Set(prev).add(payload.incidentId));
    setFocusedIncidentId(payload.incidentId);

    // Scroll item into view if rendered
    const el = incidentRowRefs.current[payload.incidentId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Optionally refresh list so UI state (needsRedispatch etc) stays fresh
    refreshIncidents();
  }, [refreshIncidents]);

  useRescuerHub({
    onRescuerAborted: handleRescuerAborted,
  });

  const handleIncidentClick = useCallback((incidentId: string) => {
    setFocusedIncidentId(incidentId);
    openIncidentDetail(incidentId);
    setUrgentIncidentIds((prev) => {
      const next = new Set(prev);
      next.delete(incidentId);
      return next;
    });
  }, [setFocusedIncidentId, setUrgentIncidentIds]);

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

      <OperatorMap
        liveIncidents={liveIncidents}
        liveRescuers={liveRescuers}
        focusedIncidentId={focusedIncidentId}
        onIncidentClick={handleIncidentClick}
      />

      <OperatorInfoPanels
        incidents={incidents}
        liveRescuers={liveRescuers}
        rescuerRegistry={rescuerRegistry}
        focusedIncidentId={focusedIncidentId}
        urgentIncidentIds={urgentIncidentIds}
        incidentRowRefs={incidentRowRefs}
        onIncidentClick={handleIncidentClick}
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
