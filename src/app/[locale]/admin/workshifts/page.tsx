'use client';

import type {
  BriefRescuerProfileResponse,
  ShiftAssignmentResponse as TodayShiftAssignmentResponse,
} from '@/types/operator.type';
import type {
  CreateWorkShiftRequest,
  ShiftAssignmentResponse,
  ShiftAssignmentStatus,
  UpdateShiftAssignmentRequest,
  UpdateWorkShiftRequest,
  WorkShiftResponse,
} from '@/types/workshift.type';
import {
  CalendarDays,
  // Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  HelpCircle,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  // ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ApiClientError } from '@/apis/client';
import { operatorApi } from '@/apis/operator.api';
import { workShiftApi } from '@/apis/workshift.api';
import { useToast } from '@/components/ToastProvider';

interface ShiftFormDraft {
  name: string;
  startTime: string;
  endTime: string;
  requiredRescuers: number;
  isActive: boolean;
}

interface AssignmentDraft {
  rescuerId: string;
  date: string;
  status: ShiftAssignmentStatus;
  notes: string;
}

const SHIFT_STATUS_OPTIONS: ShiftAssignmentStatus[] = [
  'Scheduled',
  'Active',
  'Completed',
  'Cancelled',
  'NoShow',
];

const FALLBACK_STATUS: ShiftAssignmentStatus = 'Scheduled';

const STATUS_BADGE_CLASS: Record<ShiftAssignmentStatus, string> = {
  Scheduled: 'bg-slate-100 text-slate-700',
  Active: 'bg-emerald-100 text-emerald-700',
  Completed: 'bg-blue-100 text-blue-700',
  Cancelled: 'bg-rose-100 text-rose-700',
  NoShow: 'bg-amber-100 text-amber-700',
};

const STATUS_LABEL: Record<ShiftAssignmentStatus, string> = {
  Scheduled: 'Đã lên lịch',
  Active: 'Đang trực',
  Completed: 'Hoàn thành',
  Cancelled: 'Đã hủy',
  NoShow: 'Vắng mặt',
};

const STATUS_SET = new Set<ShiftAssignmentStatus>(SHIFT_STATUS_OPTIONS);

const normalizeStatus = (value: unknown): ShiftAssignmentStatus => {
  if (typeof value === 'string' && STATUS_SET.has(value as ShiftAssignmentStatus)) {
    return value as ShiftAssignmentStatus;
  }

  return FALLBACK_STATUS;
};

const safeString = (value: unknown, fallback = '') => {
  return typeof value === 'string' ? value : fallback;
};

const safeNumber = (value: unknown, fallback = 0) => {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
};

const safeBoolean = (value: unknown, fallback = false) => {
  return typeof value === 'boolean' ? value : fallback;
};

const pad2 = (value: number) => `${value}`.padStart(2, '0');

const toDateInput = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const createDefaultRange = () => {
  const today = new Date();
  return {
    start: toDateInput(today),
    end: toDateInput(addDays(today, 6)),
  };
};

const DAYS_PER_VIEW = 7;

const parseDateInput = (value: string) => {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getWeekStartDate = (date: Date) => {
  const copy = new Date(date);
  const day = copy.getDay();
  const diffFromMonday = (day + 6) % 7;
  copy.setDate(copy.getDate() - diffFromMonday);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const isCloneSourceWeekAllowed = (sourceDate: string) => {
  const parsed = parseDateInput(sourceDate);
  if (!parsed) {
    return false;
  }

  const sourceWeekStart = getWeekStartDate(parsed);
  const currentWeekStart = getWeekStartDate(new Date());
  const previousWeekStart = addDays(currentWeekStart, -DAYS_PER_VIEW);

  return sourceWeekStart.getTime() === currentWeekStart.getTime()
    || sourceWeekStart.getTime() === previousWeekStart.getTime();
};

const getWindowEndDate = (startDate: string) => {
  const parsedStart = parseDateInput(startDate);
  if (!parsedStart) {
    return startDate;
  }

  return toDateInput(addDays(parsedStart, DAYS_PER_VIEW - 1));
};

const normalizeTimeToApi = (value: string) => {
  if (!value) {
    return '00:00:00';
  }

  if (value.length === 5) {
    return `${value}:00`;
  }

  return value;
};

const toTimeInput = (value: string) => {
  if (!value) {
    return '00:00';
  }

  if (value.length >= 5) {
    return value.slice(0, 5);
  }

  return value;
};

const getDateRange = (startDate: string, endDate: string) => {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [] as string[];
  }

  const result: string[] = [];

  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    result.push(toDateInput(cursor));
  }

  return result;
};

const parseIsoLikeLocal = (value: string) => {
  if (!value) {
    return null;
  }

  const normalized = value.includes('T') ? value : `${value}T00:00:00`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const formatHmFromIsoLike = (value: string) => {
  const parsed = parseIsoLikeLocal(value);
  if (!parsed) {
    const timePart = value.includes('T') ? (value.split('T')[1] ?? '') : value;
    return timePart.slice(0, 5);
  }

  return `${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}`;
};

const formatUtcToLocalHm = (value: string | null) => {
  if (!value) {
    return '--:--';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '--:--';
  }

  return parsed.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const getAssignmentCellDate = (assignment: ShiftAssignmentResponse) => {
  if (typeof assignment.shiftStartLocal === 'string' && assignment.shiftStartLocal.length >= 10) {
    return assignment.shiftStartLocal.slice(0, 10);
  }

  return toDateInput(new Date());
};

const getValidationMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof ApiClientError)) {
    return fallback;
  }

  const validationEntries = Object.entries(error.error?.validationErrors ?? {});
  if (!validationEntries.length) {
    return error.message || fallback;
  }

  return validationEntries
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join(' | ');
};

const createShiftDraft = (): ShiftFormDraft => ({
  name: '',
  startTime: '08:00',
  endTime: '16:00',
  requiredRescuers: 1,
  isActive: true,
});

const normalizeShift = (item: unknown): WorkShiftResponse | null => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const source = item as Partial<WorkShiftResponse>;
  const id = safeString(source.id);
  if (!id) {
    return null;
  }

  return {
    id,
    name: safeString(source.name, 'Ca chưa đặt tên'),
    startTime: safeString(source.startTime, '00:00:00'),
    endTime: safeString(source.endTime, '00:00:00'),
    requiredRescuers: Math.max(0, safeNumber(source.requiredRescuers, 0)),
    isActive: safeBoolean(source.isActive, true),
  };
};

const normalizeAssignment = (item: unknown): ShiftAssignmentResponse | null => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const source = item as Partial<ShiftAssignmentResponse>;
  const id = safeString(source.id);
  const shiftId = safeString(source.shiftId);
  const rescuerId = safeString(source.rescuerId);

  if (!id || !shiftId) {
    return null;
  }

  const shiftStartLocal = safeString(source.shiftStartLocal, `${toDateInput(new Date())}T00:00:00`);
  const shiftEndLocal = safeString(source.shiftEndLocal, shiftStartLocal);

  return {
    id,
    shiftId,
    rescuerId: rescuerId || 'unknown-rescuer',
    shiftStartLocal,
    shiftEndLocal,
    checkInAtUtc: typeof source.checkInAtUtc === 'string' ? source.checkInAtUtc : null,
    checkOutAtUtc: typeof source.checkOutAtUtc === 'string' ? source.checkOutAtUtc : null,
    status: normalizeStatus(source.status),
    checkInAt: typeof source.checkInAt === 'string' ? source.checkInAt : null,
    checkOutAt: typeof source.checkOutAt === 'string' ? source.checkOutAt : null,
    notes: typeof source.notes === 'string' ? source.notes : null,
    shift: source.shift,
    rescuer: source.rescuer,
  };
};

const normalizeRescuer = (item: unknown): BriefRescuerProfileResponse | null => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const source = item as Partial<BriefRescuerProfileResponse>;
  const accountSource = (source.account ?? {}) as Partial<BriefRescuerProfileResponse['account']>;

  const accountId = safeString(source.accountId) || safeString(accountSource.id);
  if (!accountId) {
    return null;
  }

  return {
    accountId,
    isOnline: safeBoolean(source.isOnline, false),
    isAvailable: safeBoolean(source.isAvailable, false),
    phoneNumber: safeString(source.phoneNumber),
    rating: safeNumber(source.rating, 0),
    ratingCount: safeNumber(source.ratingCount, 0),
    type: (source.type ?? 'Both') as BriefRescuerProfileResponse['type'],
    lastLocationUpdate: typeof source.lastLocationUpdate === 'string' ? source.lastLocationUpdate : null,
    latitude: typeof source.latitude === 'number' ? source.latitude : null,
    longitude: typeof source.longitude === 'number' ? source.longitude : null,
    totalMissions: safeNumber(source.totalMissions, 0),
    completedMissions: safeNumber(source.completedMissions, 0),
    account: {
      id: safeString(accountSource.id, accountId),
      email: safeString(accountSource.email),
      fullName: safeString(accountSource.fullName, 'Rescuer chưa có tên'),
      avatarUrl: safeString(accountSource.avatarUrl),
      role: accountSource.role ?? 'Operator',
      isActive: safeBoolean(accountSource.isActive, true),
    },
  };
};

export default function WorkShiftsPage() {
  const { showToast } = useToast();
  const initialRange = useMemo(() => createDefaultRange(), []);

  const [windowStartDate, setWindowStartDate] = useState(initialRange.start);

  const [shifts, setShifts] = useState<WorkShiftResponse[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignmentResponse[]>([]);
  const [rescuers, setRescuers] = useState<BriefRescuerProfileResponse[]>([]);
  const [todayAssignments, setTodayAssignments] = useState<TodayShiftAssignmentResponse[]>([]);
  const [selectedRescuerDetail, setSelectedRescuerDetail] = useState<BriefRescuerProfileResponse | null>(null);
  const [isRescuerDetailLoading, setIsRescuerDetailLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftModalMode, setShiftModalMode] = useState<'create' | 'update'>('create');
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [shiftDraft, setShiftDraft] = useState<ShiftFormDraft>(() => createShiftDraft());
  const [shiftModalError, setShiftModalError] = useState<string | null>(null);
  const [isShiftSubmitting, setIsShiftSubmitting] = useState(false);
  const [isShiftDeleting, setIsShiftDeleting] = useState(false);

  const [selectedCell, setSelectedCell] = useState<{ shiftId: string; date: string } | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [singleRescuerId, setSingleRescuerId] = useState('');
  const [singleNotes, setSingleNotes] = useState('');
  const [bulkRescuerIds, setBulkRescuerIds] = useState<string[]>([]);
  const [bulkNotes, setBulkNotes] = useState('');
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, AssignmentDraft>>({});
  const [isAssignmentSubmitting, setIsAssignmentSubmitting] = useState(false);
  const [isCloneSubmitting, setIsCloneSubmitting] = useState(false);

  const windowEndDate = useMemo(() => getWindowEndDate(windowStartDate), [windowStartDate]);

  const canCloneCurrentWeek = useMemo(
    () => isCloneSourceWeekAllowed(windowStartDate),
    [windowStartDate],
  );

  const dateColumns = useMemo(() => getDateRange(windowStartDate, windowEndDate), [windowEndDate, windowStartDate]);

  const rescuerMap = useMemo(() => {
    return rescuers.reduce<Record<string, BriefRescuerProfileResponse>>((acc, item) => {
      acc[item.accountId] = item;
      return acc;
    }, {});
  }, [rescuers]);

  const assignmentByCell = useMemo(() => {
    return assignments.reduce<Record<string, ShiftAssignmentResponse[]>>((acc, item) => {
      const cellDate = getAssignmentCellDate(item);
      const key = `${item.shiftId}__${cellDate}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});
  }, [assignments]);

  const activeShifts = useMemo(() => {
    return shifts.filter(item => item.isActive);
  }, [shifts]);

  const selectedShift = useMemo(() => {
    if (!selectedCell) {
      return null;
    }

    return activeShifts.find(item => item.id === selectedCell.shiftId) ?? null;
  }, [activeShifts, selectedCell]);

  const selectedCellAssignments = useMemo(() => {
    if (!selectedCell) {
      return [] as ShiftAssignmentResponse[];
    }

    return assignmentByCell[`${selectedCell.shiftId}__${selectedCell.date}`] ?? [];
  }, [assignmentByCell, selectedCell]);

  const availableRescuersForSelectedCell = useMemo(() => {
    const assignedIds = new Set(selectedCellAssignments.map(item => item.rescuerId));
    return rescuers.filter(item => !assignedIds.has(item.accountId));
  }, [rescuers, selectedCellAssignments]);

  const loadShifts = async () => {
    const data = await workShiftApi.getAllShifts();
    const normalized = Array.isArray(data)
      ? data.map(item => normalizeShift(item)).filter((item): item is WorkShiftResponse => item != null)
      : [];
    setShifts(normalized);
  };

  const loadRescuers = async () => {
    const data = await operatorApi.getRescuerRegistry();
    const normalized = Array.isArray(data)
      ? data.map(item => normalizeRescuer(item)).filter((item): item is BriefRescuerProfileResponse => item != null)
      : [];
    setRescuers(normalized);
  };

  const loadTodayAssignments = async () => {
    try {
      const data = await operatorApi.getTodayShiftAssignments();
      setTodayAssignments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load today shift assignments snapshot', error);
      setTodayAssignments([]);
    }
  };

  const loadAssignments = async (start: string, end: string) => {
    setIsAssignmentsLoading(true);

    try {
      const data = start === end
        ? await workShiftApi.getAssignmentsByDate(start)
        : await workShiftApi.getAssignmentsByDateRange(start, end);

      const normalized = Array.isArray(data)
        ? data.map(item => normalizeAssignment(item)).filter((item): item is ShiftAssignmentResponse => item != null)
        : [];

      setAssignments(normalized);
    } finally {
      setIsAssignmentsLoading(false);
    }
  };

  const buildCloneTargetRange = (sourceDate: string) => {
    const parsed = parseDateInput(sourceDate);
    if (!parsed) {
      return null;
    }

    const targetStart = addDays(parsed, DAYS_PER_VIEW);
    const targetEnd = addDays(targetStart, DAYS_PER_VIEW - 1);
    return {
      start: toDateInput(targetStart),
      end: toDateInput(targetEnd),
    };
  };

  const reloadPageData = async (notify = false) => {
    setIsLoading(true);
    setPageError(null);

    try {
      await Promise.all([
        loadShifts(),
        loadRescuers(),
        loadTodayAssignments(),
        loadAssignments(windowStartDate, windowEndDate),
      ]);
      if (notify) {
        showToast('Đã làm mới dữ liệu lịch làm việc.', { type: 'success' });
      }
    } catch (error) {
      console.error('Failed to load workshift schedule page', error);
      setPageError('Không thể tải dữ liệu lịch làm việc. Vui lòng thử lại.');
      showToast('Không thể tải dữ liệu lịch làm việc.', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const cloneAssignmentsToNextWeek = async () => {
    const cloneSourceDate = windowStartDate;
    const targetRange = buildCloneTargetRange(cloneSourceDate);

    if (!targetRange) {
      const message = 'Ngày nguồn sao chép không hợp lệ.';
      setActionError(message);
      showToast(message, { type: 'error' });
      return;
    }

    setActionError(null);
    setIsCloneSubmitting(true);

    try {
      const fetchedTarget = await workShiftApi.getAssignmentsByDateRange(targetRange.start, targetRange.end);
      const existingTarget = Array.isArray(fetchedTarget) ? fetchedTarget : [];

      if (existingTarget.length > 0) {
        // eslint-disable-next-line dot-notation
        const confirmed = (globalThis as any)['confirm'](
          `Tuần mục tiêu ${targetRange.start} - ${targetRange.end} đã có ${existingTarget.length} phân công. Chức năng này chỉ thêm phân công thiếu, không xóa hoặc ghi đè phân công hiện có. Bạn có muốn tiếp tục?`,
        );

        if (!confirmed) {
          return;
        }
      }

      const clonedAssignments = await workShiftApi.cloneAssignmentsToNextWeek(cloneSourceDate);
      const addedCount = Array.isArray(clonedAssignments) ? clonedAssignments.length : 0;

      if (addedCount === 0) {
        const message = existingTarget.length > 0
          ? 'Không có phân công mới nào được sao chép vì tuần mục tiêu đã có phân công.'
          : 'Không có phân công mới nào được sao chép sang tuần tiếp theo.';
        showToast(message, { type: 'info' });
      } else {
        const message = existingTarget.length > 0
          ? `Đã sao chép ${addedCount} phân công mới sang tuần tiếp theo. Một số phân công đã tồn tại và được bỏ qua.`
          : `Đã sao chép ${addedCount} phân công mới sang tuần tiếp theo.`;
        showToast(message, { type: 'success' });
      }

      await reloadPageData();
    } catch (error) {
      console.error('Failed to clone assignments to next week', error);
      const message = getValidationMessage(error, 'Sao chép phân công sang tuần tiếp theo thất bại.');
      setActionError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsCloneSubmitting(false);
    }
  };

  const reloadAssignmentsOnly = async (notify = false) => {
    setActionError(null);

    try {
      await loadAssignments(windowStartDate, windowEndDate);
      if (notify) {
        showToast('Đã làm mới dữ liệu phân công.', { type: 'success' });
      }
    } catch (error) {
      console.error('Failed to reload assignments', error);
      setActionError('Không thể tải lại lịch phân công.');
      showToast('Không thể tải lại lịch phân công.', { type: 'error' });
    }
  };

  const moveDateWindow = (days: number) => {
    setWindowStartDate((prev) => {
      const parsed = parseDateInput(prev) ?? new Date();
      return toDateInput(addDays(parsed, days));
    });
  };

  const openCreateShiftModal = () => {
    setActionError(null);
    setShiftModalError(null);
    setShiftModalMode('create');
    setSelectedShiftId(null);
    setShiftDraft(createShiftDraft());
    setIsShiftModalOpen(true);
  };

  const openUpdateShiftModal = async (shiftId: string) => {
    setActionError(null);

    try {
      const latest = await workShiftApi.getShiftById(shiftId);
      const shiftData = normalizeShift(latest);
      if (!shiftData) {
        throw new Error('Shift data is invalid');
      }
      setShiftModalMode('update');
      setSelectedShiftId(shiftId);
      setShiftModalError(null);
      setShiftDraft({
        name: shiftData.name,
        startTime: toTimeInput(shiftData.startTime),
        endTime: toTimeInput(shiftData.endTime),
        requiredRescuers: shiftData.requiredRescuers,
        isActive: shiftData.isActive,
      });
      setIsShiftModalOpen(true);
    } catch (error) {
      console.error('Failed to load shift before update', error);
      setActionError('Không thể tải dữ liệu ca để chỉnh sửa.');
      showToast('Không thể tải dữ liệu ca để chỉnh sửa.', { type: 'error' });
    }
  };

  const submitShift = async () => {
    const trimmedShiftName = shiftDraft.name.trim();
    if (!trimmedShiftName) {
      const message = 'Tên ca làm việc không được để trống.';
      setShiftModalError(message);
      showToast(message, { type: 'error' });
      return;
    }

    setShiftModalError(null);
    setIsShiftSubmitting(true);
    setActionError(null);

    try {
      if (shiftModalMode === 'create') {
        const payload: CreateWorkShiftRequest = {
          name: trimmedShiftName,
          startTime: normalizeTimeToApi(shiftDraft.startTime),
          endTime: normalizeTimeToApi(shiftDraft.endTime),
          requiredRescuers: Number(shiftDraft.requiredRescuers),
        };
        await workShiftApi.createShift(payload);
        showToast('Đã tạo mẫu ca mới.', { type: 'success' });
      } else if (selectedShiftId) {
        const payload: UpdateWorkShiftRequest = {
          name: trimmedShiftName,
          startTime: normalizeTimeToApi(shiftDraft.startTime),
          endTime: normalizeTimeToApi(shiftDraft.endTime),
          requiredRescuers: Number(shiftDraft.requiredRescuers),
          isActive: shiftDraft.isActive,
        };
        await workShiftApi.updateShift(selectedShiftId, payload);
        showToast('Đã cập nhật mẫu ca.', { type: 'success' });
      }

      await reloadPageData();
      setIsShiftModalOpen(false);
      setShiftModalError(null);
    } catch (error) {
      console.error('Failed to submit shift form', error);
      const fallback = shiftModalMode === 'create'
        ? 'Tạo mẫu ca thất bại.'
        : 'Cập nhật mẫu ca thất bại.';
      const message = getValidationMessage(error, fallback);
      setShiftModalError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsShiftSubmitting(false);
    }
  };

  const deleteShift = async (shiftId: string) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm('Bạn có chắc muốn xóa mẫu ca này? (xóa mềm)');
    if (!confirmed) {
      return;
    }

    setIsShiftDeleting(true);
    setActionError(null);

    try {
      await workShiftApi.deleteShift(shiftId);
      await reloadPageData();
      showToast('Đã xóa mẫu ca.', { type: 'success' });
    } catch (error) {
      console.error('Failed to delete shift', error);
      const message = getValidationMessage(error, 'Xóa mẫu ca thất bại.');
      setActionError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsShiftDeleting(false);
    }
  };

  const openAssignmentModal = (shiftId: string, date: string) => {
    setActionError(null);
    setSelectedRescuerDetail(null);
    const seededAssignments = assignmentByCell[`${shiftId}__${date}`] ?? [];
    const nextDrafts: Record<string, AssignmentDraft> = {};

    seededAssignments.forEach((item) => {
      nextDrafts[item.id] = {
        rescuerId: item.rescuerId,
        date: getAssignmentCellDate(item),
        status: normalizeStatus(item.status),
        notes: item.notes ?? '',
      };
    });

    setAssignmentDrafts(nextDrafts);
    setSelectedCell({ shiftId, date });
    setSingleRescuerId('');
    setSingleNotes('');
    setBulkRescuerIds([]);
    setBulkNotes('');
    setIsAssignmentModalOpen(true);
  };

  const updateAssignmentDraft = <K extends keyof AssignmentDraft>(
    assignmentId: string,
    field: K,
    value: AssignmentDraft[K],
  ) => {
    setAssignmentDrafts((prev) => {
      const base = prev[assignmentId] ?? {
        rescuerId: '',
        date: selectedCell?.date ?? toDateInput(new Date()),
        status: 'Scheduled' as ShiftAssignmentStatus,
        notes: '',
      };

      return {
        ...prev,
        [assignmentId]: {
          ...base,
          [field]: value,
        },
      };
    });
  };

  const assignOneRescuer = async () => {
    if (!selectedCell || !singleRescuerId) {
      return;
    }

    setIsAssignmentSubmitting(true);
    setActionError(null);

    try {
      await workShiftApi.assignOne(selectedCell.shiftId, {
        rescuerId: singleRescuerId,
        date: selectedCell.date,
        notes: singleNotes.trim() || undefined,
      });

      await reloadAssignmentsOnly();
      setSingleRescuerId('');
      setSingleNotes('');
      showToast('Đã gán cứu hộ viên vào ca.', { type: 'success' });
    } catch (error) {
      console.error('Failed to assign one rescuer', error);
      const message = getValidationMessage(error, 'Không thể gán rescuer vào ca.');
      setActionError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsAssignmentSubmitting(false);
    }
  };

  const assignBulkRescuers = async () => {
    if (!selectedCell || bulkRescuerIds.length === 0) {
      return;
    }

    setIsAssignmentSubmitting(true);
    setActionError(null);

    try {
      await workShiftApi.assignBulk(selectedCell.shiftId, {
        rescuerIds: bulkRescuerIds,
        date: selectedCell.date,
        notes: bulkNotes.trim() || undefined,
      });

      await reloadAssignmentsOnly();
      setBulkRescuerIds([]);
      setBulkNotes('');
      showToast('Đã gán hàng loạt cứu hộ viên.', { type: 'success' });
    } catch (error) {
      console.error('Failed to assign bulk rescuers', error);
      const message = getValidationMessage(error, 'Không thể gán hàng loạt rescuers.');
      setActionError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsAssignmentSubmitting(false);
    }
  };

  const updateAssignment = async (assignmentId: string) => {
    const draft = assignmentDrafts[assignmentId];
    if (!draft) {
      return;
    }

    setIsAssignmentSubmitting(true);
    setActionError(null);

    try {
      const payload: UpdateShiftAssignmentRequest = {
        rescuerId: draft.rescuerId,
        date: draft.date,
        notes: draft.notes.trim() || undefined,
        status: draft.status,
      };

      await workShiftApi.updateAssignment(assignmentId, payload);
      await reloadAssignmentsOnly();
      showToast('Đã cập nhật phân công.', { type: 'success' });
    } catch (error) {
      console.error('Failed to update assignment', error);
      const message = getValidationMessage(error, 'Cập nhật phân công thất bại.');
      setActionError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsAssignmentSubmitting(false);
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm('Bạn có chắc muốn xóa phân công này?');
    if (!confirmed) {
      return;
    }

    setIsAssignmentSubmitting(true);
    setActionError(null);

    try {
      await workShiftApi.deleteAssignment(assignmentId);
      await reloadAssignmentsOnly();
      showToast('Đã xóa phân công.', { type: 'success' });
    } catch (error) {
      console.error('Failed to delete assignment', error);
      const message = getValidationMessage(error, 'Xóa phân công thất bại.');
      setActionError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsAssignmentSubmitting(false);
    }
  };

  // const checkInAssignment = async (assignmentId: string) => {
  //   setIsAssignmentSubmitting(true);
  //   setActionError(null);

  //   try {
  //     await workShiftApi.checkInAssignment(assignmentId);
  //     await reloadAssignmentsOnly();
  //     showToast('Check-in thành công.', { type: 'success' });
  //   } catch (error) {
  //     console.error('Failed to check-in assignment', error);
  //     const message = getValidationMessage(error, 'Check-in thất bại.');
  //     setActionError(message);
  //     showToast(message, { type: 'error' });
  //   } finally {
  //     setIsAssignmentSubmitting(false);
  //   }
  // };

  // const checkOutAssignment = async (assignmentId: string) => {
  //   setIsAssignmentSubmitting(true);
  //   setActionError(null);

  //   try {
  //     await workShiftApi.checkOutAssignment(assignmentId);
  //     await reloadAssignmentsOnly();
  //     showToast('Check-out thành công.', { type: 'success' });
  //   } catch (error) {
  //     console.error('Failed to check-out assignment', error);
  //     const message = getValidationMessage(error, 'Check-out thất bại.');
  //     setActionError(message);
  //     showToast(message, { type: 'error' });
  //   } finally {
  //     setIsAssignmentSubmitting(false);
  //   }
  // };

  const openRescuerDetail = async (rescuerId: string) => {
    setIsRescuerDetailLoading(true);

    try {
      const detail = await operatorApi.getRescuerById(rescuerId);
      setSelectedRescuerDetail(normalizeRescuer(detail));
    } catch (error) {
      console.error('Failed to load rescuer detail', error);
      const message = getValidationMessage(error, 'Không thể tải chi tiết rescuer.');
      setActionError(message);
      showToast(message, { type: 'error' });
      setSelectedRescuerDetail(null);
    } finally {
      setIsRescuerDetailLoading(false);
    }
  };

  const getRescuerName = (assignment: ShiftAssignmentResponse) => {
    return assignment.rescuer?.userInfo?.fullName
      || rescuerMap[assignment.rescuerId]?.account?.fullName
      || assignment.rescuerId;
  };

  const getRescuerAvatar = (assignment: ShiftAssignmentResponse) => {
    return assignment.rescuer?.userInfo?.avatarUrl
      || rescuerMap[assignment.rescuerId]?.account?.avatarUrl
      || '';
  };

  const getShiftTimeLabel = (shift: WorkShiftResponse) => {
    const startHm = formatHmFromIsoLike(shift.startTime);
    const endHm = formatHmFromIsoLike(shift.endTime);
    return `${startHm} - ${endHm}`;
  };

  const getAssignmentTimeLabel = (assignment: ShiftAssignmentResponse) => {
    const start = parseIsoLikeLocal(assignment.shiftStartLocal);
    const end = parseIsoLikeLocal(assignment.shiftEndLocal);
    const startHm = formatHmFromIsoLike(assignment.shiftStartLocal);
    const endHm = formatHmFromIsoLike(assignment.shiftEndLocal);

    const isOvernight = start && end ? end.getDate() !== start.getDate() || end.getMonth() !== start.getMonth() : false;
    return isOvernight ? `${startHm} - ${endHm} (+1)` : `${startHm} - ${endHm}`;
  };

  const todayActiveCount = useMemo(
    () => todayAssignments.filter(item => item.status === 'Active').length,
    [todayAssignments],
  );

  useEffect(() => {
    void reloadPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void reloadAssignmentsOnly();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowStartDate]);

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-360 flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Quản lý lịch làm việc nhân viên cứu hộ</h2>
              <p className="mt-1 text-sm text-slate-500">
                Theo dõi phân công theo ngày và ca, và tối ưu nhân sự cứu hộ.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-600">Ngày bắt đầu</p>
                <input
                  type="date"
                  value={windowStartDate}
                  onChange={event => setWindowStartDate(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-600">Đến ngày</p>
                <input
                  type="date"
                  value={windowEndDate}
                  disabled
                  className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                />
              </div>
              <button
                type="button"
                onClick={() => moveDateWindow(-DAYS_PER_VIEW)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <ChevronLeft className="size-4" />
                Lùi 7 ngày
              </button>
              <button
                type="button"
                onClick={() => moveDateWindow(DAYS_PER_VIEW)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Tới 7 ngày
                <ChevronRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => void reloadPageData(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <RefreshCcw className="size-4" />
                Làm mới
              </button>
              <button
                type="button"
                disabled={isCloneSubmitting || !canCloneCurrentWeek}
                onClick={() => void cloneAssignmentsToNextWeek()}
                title={canCloneCurrentWeek ? undefined : 'Chỉ cho phép sao chép tuần hiện tại hoặc tuần trước.'}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CalendarDays className="size-4" />
                Sao chép phân công sang tuần kế tiếp
                <span title="Sao chép các phân công từ thứ Hai đến hết tuần sang tuần kế tiếp">
                  <HelpCircle className="size-4 text-white/80" />
                </span>
              </button>
              <button
                type="button"
                onClick={openCreateShiftModal}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800"
              >
                <Plus className="size-4" />
                Thêm mẫu ca
              </button>
            </div>
          </div>

          {actionError && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {actionError}
            </div>
          )}
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Mẫu ca làm việc</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {activeShifts.length}
              {' '}
              ca
            </span>
          </div>
          <div className="space-y-2">
            {activeShifts.map(shift => (
              <div
                key={shift.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{shift.name}</p>
                  <p className="text-xs text-slate-500">
                    {getShiftTimeLabel(shift)}
                    {' • Cần '}
                    {shift.requiredRescuers}
                    {' cứu hộ viên'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void openUpdateShiftModal(shift.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Pencil className="size-3.5" />
                    Sửa
                  </button>
                  <button
                    type="button"
                    disabled={isShiftDeleting}
                    onClick={() => void deleteShift(shift.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="size-3.5" />
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hôm nay</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{todayAssignments.length}</p>
              <p className="text-xs text-slate-600">Tổng phân công trong ngày</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Đang trực</p>
              <p className="mt-1 text-2xl font-bold text-emerald-800">{todayActiveCount}</p>
              <p className="text-xs text-emerald-700">Theo dữ liệu hôm nay</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Danh sách cứu hộ viên</p>
              <p className="mt-1 text-2xl font-bold text-sky-800">{rescuers.length}</p>
              <p className="text-xs text-sky-700">Tổng cứu hộ viên khả dụng để gán</p>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Thời khóa biểu theo ngày và ca</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveDateWindow(-DAYS_PER_VIEW)}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-100"
                aria-label="Lùi 7 ngày"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-xs font-semibold text-slate-600">
                {windowStartDate}
                {' - '}
                {windowEndDate}
              </span>
              <button
                type="button"
                onClick={() => moveDateWindow(DAYS_PER_VIEW)}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-100"
                aria-label="Tới 7 ngày"
              >
                <ChevronRight className="size-4" />
              </button>
              {isAssignmentsLoading && <span className="ml-1 text-xs text-slate-500">Đang tải phân công...</span>}
            </div>
          </div>

          {pageError && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {pageError}
            </div>
          )}

          {isLoading && (
            <div className="flex h-40 items-center justify-center text-sm text-slate-500">
              Đang tải dữ liệu...
            </div>
          )}

          {!isLoading && dateColumns.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              Khoảng ngày không hợp lệ. Vui lòng kiểm tra lại bộ lọc ngày.
            </div>
          )}

          {!isLoading && dateColumns.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-250 table-fixed border-collapse">
                <thead>
                  <tr>
                    <th className="w-52 border-b border-slate-200 bg-slate-50 p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Ca làm việc
                    </th>
                    {dateColumns.map(date => (
                      <th key={date} className="border-b border-slate-200 bg-slate-50 p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {date}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeShifts.map(shift => (
                    <tr key={shift.id} className="align-top">
                      <td className="border-b border-slate-200 p-3">
                        <p className="text-sm font-bold text-slate-800">{shift.name}</p>
                        <p className="text-xs text-slate-500">{getShiftTimeLabel(shift)}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Cần:
                          {' '}
                          {shift.requiredRescuers}
                        </p>
                      </td>

                      {dateColumns.map((date) => {
                        const key = `${shift.id}__${date}`;
                        const cellAssignments = assignmentByCell[key] ?? [];
                        const assignedCount = cellAssignments.length;
                        const overbooked = assignedCount > shift.requiredRescuers;

                        return (
                          <td key={key} className="border-b border-slate-200 p-2">
                            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${overbooked ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                                  {assignedCount}
                                  /
                                  {shift.requiredRescuers}
                                </span>
                                <button
                                  type="button"
                                  disabled={!shift.isActive}
                                  onClick={() => openAssignmentModal(shift.id, date)}
                                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <UserPlus className="size-3" />
                                  Chi tiết
                                </button>
                              </div>

                              {cellAssignments.length === 0 && (
                                <p className="text-xs text-slate-500">Chưa có cứu hộ viên.</p>
                              )}

                              {cellAssignments.slice(0, 4).map(item => (
                                <div key={item.id} className="rounded border border-slate-200 bg-white p-2">
                                  <p className="line-clamp-1 text-xs font-semibold text-slate-800">{getRescuerName(item)}</p>
                                  <div className="mt-1 flex items-center justify-between gap-2">
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE_CLASS[normalizeStatus(item.status)]}`}>
                                      {STATUS_LABEL[normalizeStatus(item.status)]}
                                    </span>
                                    <span className="text-[10px] text-slate-500">{getAssignmentTimeLabel(item)}</span>
                                  </div>
                                </div>
                              ))}

                              {cellAssignments.length > 4 && (
                                <p className="text-[11px] text-slate-500">
                                  +
                                  {cellAssignments.length - 4}
                                  {' cứu hộ viên khác'}
                                </p>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {isShiftModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="button"
          tabIndex={0}
          aria-label="Đóng hộp thoại mẫu ca"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsShiftModalOpen(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsShiftModalOpen(false);
            }
          }}
        >
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            {shiftModalError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {shiftModalError}
              </div>
            )}

            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {shiftModalMode === 'create' ? 'Thêm mẫu ca' : 'Cập nhật mẫu ca'}
                </h3>
                <p className="text-sm text-slate-500">Thiết lập khung giờ và số cứu hộ viên cần thiết cho ca.</p>
              </div>
              <button type="button" onClick={() => setIsShiftModalOpen(false)} className="rounded-lg p-2 hover:bg-slate-100">
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-700">Tên ca</p>
                <input
                  value={shiftDraft.name}
                  onChange={(event) => {
                    setShiftDraft(prev => ({ ...prev, name: event.target.value }));
                    if (shiftModalError) {
                      setShiftModalError(null);
                    }
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    !shiftDraft.name.trim() && shiftModalError
                      ? 'border-rose-300 bg-rose-50 text-rose-900 placeholder:text-rose-400'
                      : 'border-slate-300'
                  }`}
                />
                {!shiftDraft.name.trim() && shiftModalError && (
                  <p className="mt-1 text-xs text-rose-600">Tên ca làm việc không được để trống.</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-700">Giờ bắt đầu</p>
                  <input
                    type="time"
                    value={shiftDraft.startTime}
                    onChange={event => setShiftDraft(prev => ({ ...prev, startTime: event.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-700">Giờ kết thúc</p>
                  <input
                    type="time"
                    value={shiftDraft.endTime}
                    onChange={event => setShiftDraft(prev => ({ ...prev, endTime: event.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-slate-700">Số cứu hộ viên yêu cầu</p>
                <input
                  type="number"
                  min={1}
                  value={shiftDraft.requiredRescuers}
                  onChange={event => setShiftDraft(prev => ({ ...prev, requiredRescuers: Number(event.target.value) }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              {shiftModalMode === 'update' && (
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={shiftDraft.isActive}
                    onChange={event => setShiftDraft(prev => ({ ...prev, isActive: event.target.checked }))}
                  />
                  Mẫu ca đang hoạt động
                </label>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isShiftSubmitting}
                onClick={() => void submitShift()}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isShiftSubmitting ? 'Đang lưu...' : shiftModalMode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAssignmentModalOpen && selectedCell && selectedShift && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="button"
          tabIndex={0}
          aria-label="Đóng hộp thoại phân công"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsAssignmentModalOpen(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsAssignmentModalOpen(false);
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Chi tiết phân công ca</h3>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <CalendarDays className="size-4" />
                  {selectedCell.date}
                  <span>•</span>
                  <Clock3 className="size-4" />
                  {selectedShift.name}
                  {' ('}
                  {getShiftTimeLabel(selectedShift)}
                  )
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAssignmentModalOpen(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <span className="font-semibold">Đã phân công:</span>
              {' '}
              {selectedCellAssignments.length}
              {' / '}
              {selectedShift.requiredRescuers}
              {' cứu hộ viên'}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <UserPlus className="size-4" />
                  Phân công 1 người
                </h4>
                <div className="space-y-2">
                  <select
                    value={singleRescuerId}
                    onChange={event => setSingleRescuerId(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Chọn cứu hộ viên</option>
                    {availableRescuersForSelectedCell.map(rescuer => (
                      <option key={rescuer.accountId} value={rescuer.accountId}>
                        {rescuer.account.fullName}
                      </option>
                    ))}
                  </select>
                  <input
                    value={singleNotes}
                    onChange={event => setSingleNotes(event.target.value)}
                    placeholder="Ghi chú"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={isAssignmentSubmitting || !singleRescuerId || !selectedShift.isActive}
                    onClick={() => void assignOneRescuer()}
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus className="size-4" />
                    Gán 1 cứu hộ viên
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Users className="size-4" />
                  Phân công hàng loạt
                </h4>

                <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
                  {availableRescuersForSelectedCell.length === 0 && (
                    <p className="text-sm text-slate-500">Không còn cứu hộ viên khả dụng trong ô này.</p>
                  )}

                  {availableRescuersForSelectedCell.map(rescuer => (
                    <label key={rescuer.accountId} className="flex items-center gap-2 rounded bg-white px-2 py-1.5 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={bulkRescuerIds.includes(rescuer.accountId)}
                        onChange={(event) => {
                          setBulkRescuerIds((prev) => {
                            if (event.target.checked) {
                              return [...prev, rescuer.accountId];
                            }
                            return prev.filter(id => id !== rescuer.accountId);
                          });
                        }}
                      />
                      {rescuer.account.fullName}
                    </label>
                  ))}
                </div>

                <input
                  value={bulkNotes}
                  onChange={event => setBulkNotes(event.target.value)}
                  placeholder="Ghi chú bulk assign"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />

                <button
                  type="button"
                  disabled={isAssignmentSubmitting || bulkRescuerIds.length === 0 || !selectedShift.isActive}
                  onClick={() => void assignBulkRescuers()}
                  className="mt-2 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="size-4" />
                  Gán hàng loạt
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 p-4">
              <h4 className="mb-3 text-sm font-bold text-slate-900">Thông tin cứu hộ viên đã chọn</h4>

              {isRescuerDetailLoading && (
                <p className="mb-3 text-sm text-slate-500">Đang tải hồ sơ rescuer...</p>
              )}

              {!isRescuerDetailLoading && !selectedRescuerDetail && (
                <p className="mb-3 text-sm text-slate-500">Bấm nút "Hồ sơ" ở một phân công để xem chi tiết cứu hộ viên.</p>
              )}

              {!isRescuerDetailLoading && selectedRescuerDetail && (
                <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p className="font-semibold text-slate-900">{selectedRescuerDetail.account.fullName}</p>
                  <p className="text-slate-600">{selectedRescuerDetail.account.email}</p>
                  <p className="text-slate-600">
                    {selectedRescuerDetail.phoneNumber}
                    {' • Đánh giá: '}
                    {selectedRescuerDetail.rating}
                    {' • Trực tuyến: '}
                    {selectedRescuerDetail.isOnline ? 'Có' : 'Không'}
                  </p>
                </div>
              )}

              <h4 className="mb-3 text-sm font-bold text-slate-900">Danh sách phân công hiện tại</h4>

              {selectedCellAssignments.length === 0 && (
                <p className="text-sm text-slate-500">Chưa có rescuer nào trong ca này.</p>
              )}

              <div className="space-y-3">
                {selectedCellAssignments.map((assignment) => {
                  const draft = assignmentDrafts[assignment.id];
                  const avatar = getRescuerAvatar(assignment);

                  return (
                    <div key={assignment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {avatar
                            ? <img src={avatar} alt={getRescuerName(assignment)} className="size-8 rounded-full border border-slate-200 object-cover" />
                            : <div className="flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-500">R</div>}
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{getRescuerName(assignment)}</p>
                            <p className="text-xs text-slate-500">{getAssignmentTimeLabel(assignment)}</p>
                          </div>
                        </div>

                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[normalizeStatus(assignment.status)]}`}>
                          {STATUS_LABEL[normalizeStatus(assignment.status)]}
                        </span>
                      </div>

                      {draft && (
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                          <select
                            value={draft.rescuerId}
                            onChange={event => updateAssignmentDraft(assignment.id, 'rescuerId', event.target.value)}
                            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                          >
                            {rescuers.map(rescuer => (
                              <option key={rescuer.accountId} value={rescuer.accountId}>
                                {rescuer.account.fullName}
                              </option>
                            ))}
                          </select>

                          <input
                            type="date"
                            value={draft.date}
                            onChange={event => updateAssignmentDraft(assignment.id, 'date', event.target.value)}
                            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                          />

                          <select
                            value={draft.status}
                            onChange={event => updateAssignmentDraft(assignment.id, 'status', event.target.value as ShiftAssignmentStatus)}
                            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                          >
                            {SHIFT_STATUS_OPTIONS.map(status => (
                              <option key={status} value={status}>
                                {STATUS_LABEL[status]}
                              </option>
                            ))}
                          </select>

                          <input
                            value={draft.notes}
                            onChange={event => updateAssignmentDraft(assignment.id, 'notes', event.target.value)}
                            placeholder="Ghi chú"
                            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={isAssignmentSubmitting}
                          onClick={() => void openRescuerDetail(assignment.rescuerId)}
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Users className="size-3.5" />
                          Hồ sơ
                        </button>

                        <button
                          type="button"
                          disabled={isAssignmentSubmitting}
                          onClick={() => void updateAssignment(assignment.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Save className="size-3.5" />
                          Lưu
                        </button>

                        {/* <button
                          type="button"
                          disabled={isAssignmentSubmitting}
                          onClick={() => void checkInAssignment(assignment.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Check className="size-3.5" />
                          Điểm danh vào ca
                        </button>

                        <button
                          type="button"
                          disabled={isAssignmentSubmitting}
                          onClick={() => void checkOutAssignment(assignment.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <ShieldCheck className="size-3.5" />
                          Điểm danh ra ca
                        </button> */}

                        <button
                          type="button"
                          disabled={isAssignmentSubmitting}
                          onClick={() => void deleteAssignment(assignment.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="size-3.5" />
                          Xóa
                        </button>

                        <span className="ml-auto text-xs text-slate-500">
                          Vào ca:
                          {' '}
                          {formatUtcToLocalHm(assignment.checkInAtUtc)}
                          {' • Ra ca: '}
                          {formatUtcToLocalHm(assignment.checkOutAtUtc)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
