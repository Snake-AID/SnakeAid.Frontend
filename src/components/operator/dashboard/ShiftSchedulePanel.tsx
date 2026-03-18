import type { ShiftAssignmentWithStatus } from '@/hooks/useOperatorRescuers';
import { UserCheck } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import ShiftAssignmentCard from '@/components/operator/ShiftAssignmentCard';

interface ShiftSchedulePanelProps {
  isOpen: boolean;
  onClose: () => void;
  shiftAssignmentsWithStatus: ShiftAssignmentWithStatus[];
}

export default function ShiftSchedulePanel({
  isOpen,
  onClose,
  shiftAssignmentsWithStatus,
}: ShiftSchedulePanelProps) {
  const [shiftTab, setShiftTab] = useState<'current' | 'past'>('current');
  const [panelPosition, setPanelPosition] = useState({ right: 16, bottom: 96 });
  const panelDragRef = useRef({ active: false, startX: 0, startY: 0, startRight: 16, startBottom: 96 });

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
      className="fixed z-20 w-[min(420px,calc(100%-2rem))] bg-white shadow-xl pointer-events-auto"
      style={{ right: panelPosition.right, bottom: panelPosition.bottom }}
    >
      <div
        className="flex cursor-grab items-center justify-between border-b border-slate-200 px-4 py-3"
        onPointerDown={handlePanelDragStart}
      >
        <div className="flex items-center gap-2">
          <UserCheck className="size-4.5 text-teal-700" />
          <h3 className="text-base font-bold text-slate-900">Shift schedule</h3>
        </div>
        <button
          type="button"
          onPointerDown={e => e.stopPropagation()}
          onClick={onClose}
          className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
          aria-label="Close panel"
        >
          ×
        </button>
      </div>

      <div className="h-[calc(100%-56px)] overflow-y-auto p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-full px-4 py-1 text-sm font-semibold transition ${shiftTab === 'current'
              ? 'bg-teal-500 text-white shadow-sm'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            onClick={() => setShiftTab('current')}
          >
            Current / Upcoming
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-1 text-sm font-semibold transition ${shiftTab === 'past'
              ? 'bg-gray-300 text-black shadow-sm'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            onClick={() => setShiftTab('past')}
          >
            Past shifts
          </button>
        </div>

        {shiftTab === 'current'
          ? (
              shiftAssignmentsWithStatus.filter(a => !a.isPast).length === 0
                ? (
                    <p className="text-sm text-slate-500">No upcoming shifts.</p>
                  )
                : (
                    <div className="space-y-2">
                      {shiftAssignmentsWithStatus
                        .filter(a => !a.isPast)
                        .map(assignment => (
                          <ShiftAssignmentCard key={assignment.id} assignment={assignment} showStatus />
                        ))}
                    </div>
                  )
            )
          : (
              shiftAssignmentsWithStatus.filter(a => a.isPast).length === 0
                ? (
                    <p className="text-sm text-slate-500">No past shifts.</p>
                  )
                : (
                    <div className="space-y-2">
                      {shiftAssignmentsWithStatus
                        .filter(a => a.isPast)
                        .map(assignment => (
                          <ShiftAssignmentCard key={assignment.id} assignment={assignment} showStatus={false} />
                        ))}
                    </div>
                  )
            )}
      </div>
    </div>
  );
}
