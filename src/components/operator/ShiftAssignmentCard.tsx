import type { ShiftAssignmentWithStatus } from '@/hooks/useOperatorRescuers';

interface Props {
  assignment: ShiftAssignmentWithStatus;
  showStatus: boolean;
}

const SHIFT_BADGE_CLASSES = {
  blue: 'bg-blue-100 text-blue-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  slate: 'bg-slate-100 text-slate-600',
} as const;

const getOnlineBadgeClasses = (isOnline: boolean) =>
  isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600';

const getAvailableBadgeClasses = (isAvailable: boolean) =>
  isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';

export default function ShiftAssignmentCard({ assignment, showStatus }: Props) {
  return (
    <div
      className={`rounded-xl border border-slate-200 p-3 ${assignment.isPast ? 'bg-slate-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-800">{assignment.fullName}</p>
          <p className="text-xs text-slate-500">
            <span
              className={`rounded-full px-2 py-0.5 font-semibold ${SHIFT_BADGE_CLASSES[assignment.shiftBadgeColor]}`}
            >
              {assignment.shift?.name ?? assignment.shiftId}
            </span>
            {' '}
            <span className="ml-2">
              {assignment.shift?.startTime ?? (assignment.shiftStartLocal ? new Date(assignment.shiftStartLocal).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : new Date(assignment.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }))}
              {' '}
              -
              {' '}
              {assignment.shift?.endTime ?? (assignment.shiftEndLocal ? new Date(assignment.shiftEndLocal).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : new Date(assignment.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }))}
            </span>
          </p>
        </div>

        <div className="text-right text-xs">
          {showStatus
            ? (
                <>
                  <div className={`rounded-full px-2 py-0.5 font-semibold ${getOnlineBadgeClasses(assignment.isOnline)}`}>
                    {assignment.isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                  </div>
                  <div className={`mt-1 rounded-full px-2 py-0.5 font-semibold ${getAvailableBadgeClasses(assignment.isAvailable)}`}>
                    {assignment.isAvailable ? 'Sẵn sàng' : 'Bận'}
                  </div>
                </>
              )
            : (
                <div className="rounded-full bg-slate-200 px-2 py-0.5 font-semibold text-slate-600">
                  Đã qua
                </div>
              )}
        </div>
      </div>
    </div>
  );
}
