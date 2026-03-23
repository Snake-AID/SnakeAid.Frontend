import type { ShiftAssignmentResponse } from '@/types/operator.type';

type ShiftAssignmentWithStatus = ShiftAssignmentResponse & {
  fullName: string;
  isOnline: boolean;
  isAvailable: boolean;
  isPast: boolean;
};

interface Props {
  assignment: ShiftAssignmentWithStatus;
  showStatus: boolean;
}

const getShiftStartEnd = (shiftDate: Date, shift: { startTime: string; endTime: string }) => {
  const [startHourStr, startMinStr] = (shift.startTime ?? '').split(':');
  const [endHourStr, endMinStr] = (shift.endTime ?? '').split(':');

  const startHour = Number(startHourStr);
  const startMin = Number(startMinStr);
  const endHour = Number(endHourStr);
  const endMin = Number(endMinStr);

  const start = new Date(shiftDate);
  const end = new Date(shiftDate);

  if (Number.isNaN(startHour) || Number.isNaN(startMin) || Number.isNaN(endHour) || Number.isNaN(endMin)) {
    return { start: null, end: null };
  }

  start.setHours(startHour, startMin, 0, 0);
  end.setHours(endHour, endMin, 0, 0);

  // Overnight shift (end <= start means end is next day)
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  return { start, end };
};

const getShiftDate = (assignment: ShiftAssignmentWithStatus) => {
  if (assignment.shiftStartLocal) {
    const parsed = new Date(assignment.shiftStartLocal);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date(assignment.date);
};

const getShiftBadgeClasses = (shiftDate: Date, shift: { startTime: string; endTime: string }) => {
  const now = new Date();
  const { start, end } = getShiftStartEnd(shiftDate, shift);

  if (!start || !end) {
    return 'bg-slate-100 text-slate-600';
  }

  if (now < start) {
    return 'bg-blue-100 text-blue-800';
  }

  if (now >= start && now <= end) {
    return 'bg-emerald-100 text-emerald-800';
  }

  return 'bg-slate-100 text-slate-600';
};

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
              className={`rounded-full px-2 py-0.5 font-semibold ${getShiftBadgeClasses(getShiftDate(assignment), {
                startTime: assignment.shift?.startTime ?? '',
                endTime: assignment.shift?.endTime ?? '',
              })}`}
            >
              {assignment.shift?.name ?? assignment.shiftId}
            </span>
            {' '}
            <span className="ml-2">
              {assignment.shift?.startTime ?? (assignment.shiftStartLocal ? new Date(assignment.shiftStartLocal).toLocaleTimeString() : new Date(assignment.date).toLocaleTimeString())}
              {' '}
              -
              {' '}
              {assignment.shift?.endTime ?? (assignment.shiftEndLocal ? new Date(assignment.shiftEndLocal).toLocaleTimeString() : new Date(assignment.date).toLocaleTimeString())}
            </span>
          </p>
        </div>

        <div className="text-right text-xs">
          {showStatus
            ? (
                <>
                  <div className={`rounded-full px-2 py-0.5 font-semibold ${getOnlineBadgeClasses(assignment.isOnline)}`}>
                    {assignment.isOnline ? 'Online' : 'Offline'}
                  </div>
                  <div className={`mt-1 rounded-full px-2 py-0.5 font-semibold ${getAvailableBadgeClasses(assignment.isAvailable)}`}>
                    {assignment.isAvailable ? 'Available' : 'Busy'}
                  </div>
                </>
              )
            : (
                <div className="rounded-full bg-slate-200 px-2 py-0.5 font-semibold text-slate-600">
                  Past
                </div>
              )}
        </div>
      </div>
    </div>
  );
}
