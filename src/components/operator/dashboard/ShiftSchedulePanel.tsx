import type { ShiftAssignmentWithStatus } from '@/hooks/useOperatorRescuers';
import { Clock, UserCheck } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import ShiftAssignmentCard from '@/components/operator/ShiftAssignmentCard';

interface ShiftSchedulePanelProps {
  isOpen: boolean;
  onClose: () => void;
  shiftAssignmentsWithStatus: ShiftAssignmentWithStatus[];
}

const classifyShifts = (assignments: ShiftAssignmentWithStatus[]) => {
  const now = new Date();

  const current = assignments.filter((a) => {
    if (!a.shiftStartLocal || !a.shiftEndLocal) {
      return false;
    }
    const start = new Date(a.shiftStartLocal);
    const end = new Date(a.shiftEndLocal);
    return start <= now && now <= end;
  });

  const upcoming = assignments.filter((a) => {
    if (!a.shiftStartLocal || !a.shiftEndLocal) {
      return false;
    }
    const start = new Date(a.shiftStartLocal);
    const eightHoursLater = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return start > now && start <= eightHoursLater;
  });

  return { current, upcoming };
};

const getTimeUntilStart = (shiftStartLocal: string | null | undefined) => {
  if (!shiftStartLocal) {
    return '';
  }
  const now = new Date();
  const start = new Date(shiftStartLocal);
  const diffMs = start.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `Bắt đầu sau: ${diffHours}h ${diffMinutes}p`;
  }
  return `Bắt đầu sau: ${diffMinutes}p`;
};

export default function ShiftSchedulePanel({
  isOpen,
  onClose,
  shiftAssignmentsWithStatus,
}: ShiftSchedulePanelProps) {
  const [shiftTab, setShiftTab] = useState<'current' | 'upcoming'>('current');
  const [panelPosition, setPanelPosition] = useState({ right: 16, bottom: 96 });
  const panelDragRef = useRef({ active: false, startX: 0, startY: 0, startRight: 16, startBottom: 96 });

  const { current, upcoming } = useMemo(() => classifyShifts(shiftAssignmentsWithStatus), [shiftAssignmentsWithStatus]);

  const clampPanelPosition = (right: number, bottom: number) => {
    const maxRight = Math.max(0, window.innerWidth - 420 - 16);
    const maxBottom = Math.max(0, window.innerHeight - 100 - 16);
    return {
      right: Math.min(Math.max(0, right), maxRight),
      bottom: Math.min(Math.max(0, bottom), maxBottom),
    };
  };

  const handlePanelDragMove = useCallback((event: PointerEvent) => {
    if (!panelDragRef.current.active) {
      return;
    }
    const dx = event.clientX - panelDragRef.current.startX;
    const dy = event.clientY - panelDragRef.current.startY;
    const nextRight = panelDragRef.current.startRight - dx;
    const nextBottom = panelDragRef.current.startBottom - dy;

    setPanelPosition(clampPanelPosition(nextRight, nextBottom));
  }, []);

  const handlePanelDragEnd = useCallback(function onDragEnd() {
    panelDragRef.current.active = false;
    window.removeEventListener('pointermove', handlePanelDragMove);
    window.removeEventListener('pointerup', onDragEnd);
  }, [handlePanelDragMove]);

  const handlePanelDragStart = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    panelDragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      startRight: panelPosition.right,
      startBottom: panelPosition.bottom,
    };

    window.addEventListener('pointermove', handlePanelDragMove);
    window.addEventListener('pointerup', handlePanelDragEnd);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [handlePanelDragEnd, handlePanelDragMove, panelPosition.bottom, panelPosition.right]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed z-20 w-[min(420px,calc(100%-2rem))] bg-white shadow-xl rounded-2xl
      border-b border-slate-200 pointer-events-auto"
      style={{ right: panelPosition.right, bottom: panelPosition.bottom }}
    >
      <div
        className="flex cursor-grab items-center justify-between border-b border-slate-200 px-4 py-3"
        onPointerDown={handlePanelDragStart}
      >
        <div className="flex items-center gap-2">
          <UserCheck className="size-4.5 text-teal-700" />
          <h3 className="text-base font-bold text-slate-900">Lịch trực</h3>
        </div>
        <button
          type="button"
          onPointerDown={e => e.stopPropagation()}
          onClick={onClose}
          className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
          aria-label="Đóng bảng"
        >
          ×
        </button>
      </div>

      <div className="h-[calc(100%-56px)] overflow-y-auto p-4">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${shiftTab === 'current'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            onClick={() => setShiftTab('current')}
          >
            <div className="flex items-center justify-center gap-2">
              <UserCheck className="size-4" />
              <span>
                Đang trực (
                {current.length}
                )
              </span>
            </div>
          </button>
          <button
            type="button"
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${shiftTab === 'upcoming'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            onClick={() => setShiftTab('upcoming')}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="size-4" />
              <span>
                Sắp tới (
                {upcoming.length}
                )
              </span>
            </div>
          </button>
        </div>

        {shiftTab === 'current'
          ? (
              current.length === 0
                ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                      <UserCheck className="mx-auto mb-2 size-8 text-slate-400" />
                      <p className="text-sm text-slate-500">Chưa có ai đang trực.</p>
                    </div>
                  )
                : (
                    <div className="space-y-2">
                      {current.map(assignment => (
                        <ShiftAssignmentCard key={assignment.id} assignment={assignment} showStatus />
                      ))}
                    </div>
                  )
            )
          : (
              upcoming.length === 0
                ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                      <Clock className="mx-auto mb-2 size-8 text-slate-400" />
                      <p className="text-sm text-slate-500">Không có ca sắp tới trong 8 giờ.</p>
                    </div>
                  )
                : (
                    <div className="space-y-2">
                      {upcoming.map(assignment => (
                        <div key={assignment.id} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-800">{assignment.fullName}</p>
                              <p className="text-xs text-slate-500">
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 font-semibold text-blue-800">
                                  {assignment.shift?.name ?? assignment.shiftId}
                                </span>
                                {' '}
                                <span className="ml-2">
                                  {assignment.shift?.startTime ?? (assignment.shiftStartLocal ? new Date(assignment.shiftStartLocal).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '')}
                                  {' '}
                                  -
                                  {' '}
                                  {assignment.shift?.endTime ?? (assignment.shiftEndLocal ? new Date(assignment.shiftEndLocal).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '')}
                                </span>
                              </p>
                            </div>
                            <div className="text-right text-xs">
                              <div className="rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-700">
                                {getTimeUntilStart(assignment.shiftStartLocal)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
            )}
      </div>
    </div>
  );
}
