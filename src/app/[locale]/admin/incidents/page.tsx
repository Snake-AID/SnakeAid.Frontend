'use client';

import type {
  AdminDetailSnakebiteIncidentResponse,
  AdminIncidentSummaryResponse,
  AdminMissionDetailResponse,
  AdminMissionSummaryResponse,
} from '@/types/admin-management.type';
import type { PaginationMeta } from '@/types/api-response';
import { Eye, Loader2, SearchX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ApiClientError } from '@/apis/client';
import { incidentApi } from '@/apis/incident.api';
import { useToast } from '@/components/ToastProvider';

type IncidentTab = 'incidents' | 'missions';

const DEFAULT_PAGINATION: PaginationMeta = {
  total_pages: 1,
  total_items: 0,
  current_page: 1,
  page_size: 10,
};

const toIso = (value: string) => {
  if (!value.trim()) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('vi-VN', { hour12: false });
};

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return null;
  }

  return `${value.toLocaleString('vi-VN')} VND`;
};

const NO_INFO_TEXT = 'Chưa có thông tin';

const displayOrNoInfo = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return NO_INFO_TEXT;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : NO_INFO_TEXT;
};

const formatDateTimeOrNoInfo = (value: string | null | undefined) => {
  if (!value) {
    return NO_INFO_TEXT;
  }

  return formatDateTime(value);
};

const formatCurrencyOrNoInfo = (value: number | null | undefined) => {
  return formatCurrency(value) ?? NO_INFO_TEXT;
};

const getSeverityBadgeClass = (severity: number | null | undefined) => {
  if (severity === null || severity === undefined) {
    return 'bg-slate-100 text-slate-700';
  }

  if (severity >= 70) {
    return 'bg-rose-600 text-white';
  }

  if (severity >= 40) {
    return 'bg-amber-500 text-white';
  }

  return 'bg-emerald-600 text-white';
};

const getSeverityLabel = (severity: number | null | undefined) => {
  if (severity === null || severity === undefined) {
    return NO_INFO_TEXT;
  }

  if (severity >= 70) {
    return 'Nghiêm trọng';
  }

  if (severity >= 40) {
    return 'Trung bình';
  }

  return 'Nhẹ';
};

const getSnakeRiskClass = (riskLevel: number | null | undefined) => {
  if (riskLevel === null || riskLevel === undefined) {
    return 'bg-slate-100 text-slate-700';
  }

  if (riskLevel >= 8) {
    return 'bg-rose-700 text-white';
  }

  if (riskLevel >= 6) {
    return 'bg-orange-600 text-white';
  }

  if (riskLevel >= 4) {
    return 'bg-amber-500 text-white';
  }

  return 'bg-emerald-600 text-white';
};

const getVenomTypeLabel = (value: string | null | undefined) => {
  switch (value) {
    case 'Neurotoxic':
      return 'Độc thần kinh';
    case 'Hemotoxic':
      return 'Độc máu';
    case 'Cytotoxic':
      return 'Độc tế bào';
    case 'Myotoxic':
      return 'Độc cơ';
    case 'None':
      return 'Không có độc tố';
    default:
      return displayOrNoInfo(value);
  }
};

const getDispatchStatusLabel = (value: string | number | null | undefined) => {
  switch (String(value)) {
    case 'Pending':
      return 'Chờ phản hồi';
    case 'Accepted':
      return 'Đã chấp nhận';
    case 'Declined':
      return 'Đã từ chối';
    case 'Cancelled':
      return 'Đã hủy';
    default:
      return displayOrNoInfo(value == null ? null : String(value));
  }
};

const getDispatchStatusBadgeClass = (value: string | number | null | undefined) => {
  switch (String(value)) {
    case 'Pending':
      return 'bg-amber-100 text-amber-700';
    case 'Accepted':
      return 'bg-emerald-100 text-emerald-700';
    case 'Declined':
      return 'bg-rose-100 text-rose-700';
    case 'Cancelled':
      return 'bg-slate-200 text-slate-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const getInitialLetters = (name: string | null | undefined) => {
  const normalized = (name ?? '').trim();
  if (!normalized) {
    return '?';
  }

  const parts = normalized.split(/\s+/).filter(Boolean);
  const firstPart = parts[0] ?? '';
  const lastPart = parts.at(-1) ?? '';

  if (parts.length === 1) {
    return firstPart.charAt(0).toUpperCase() || '?';
  }

  return `${firstPart.charAt(0)}${lastPart.charAt(0)}`.toUpperCase() || '?';
};

const renderAvatar = (avatarUrl: string | null | undefined, name: string | null | undefined) => {
  if (avatarUrl?.trim()) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? 'Avatar'}
        className="size-12 rounded-full border border-slate-200 object-cover"
      />
    );
  }

  return (
    <div className="inline-flex size-12 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-sm font-bold text-slate-700">
      {getInitialLetters(name)}
    </div>
  );
};

const isImageAttachment = (contentType?: string | null, fileName?: string | null, mediaUrl?: string | null) => {
  if (contentType?.toLowerCase().startsWith('image/')) {
    return true;
  }

  const candidate = `${fileName || ''} ${mediaUrl || ''}`.toLowerCase();
  return /\.(?:png|jpe?g|webp|gif|bmp|svg)(?:\?|$)/.test(candidate);
};

const getMissionStatusLabel = (status: string) => {
  switch (status) {
    case 'Preparing':
      return 'Đang chuẩn bị';
    case 'EnRoute':
      return 'Đang di chuyển';
    case 'RescuerArrived':
      return 'Đã đến nơi';
    case 'MissionCompleted':
      return 'Hoàn thành';
    case 'MissionUncompleted':
      return 'Chưa hoàn thành';
    case 'MissionAborted':
      return 'Đã hủy bởi cứu hộ viên';
    case 'Cancelled':
      return 'Đã hủy bởi người dùng';
    default:
      return status;
  }
};

const translateIncidentStage = (stage: string) => {
  switch (stage) {
    case 'Pending':
      return 'Chờ xác minh';
    case 'Verified':
      return 'Chờ điều phối';
    case 'Contacting':
      return 'Đang liên hệ';
    case 'Dispatched':
      return 'Đã điều phối';
    case 'Assigned':
      return 'Đã nhận lệnh';
    case 'Finished':
      return 'Đã kết thúc';
    case 'Completed':
      return 'Hoàn thành';
    case 'FalseAlarm':
      return 'Báo động giả';
    case 'Cancelled':
      return 'Đã hủy';
    case 'NoRescuerFound':
      return 'Không tìm được cứu hộ';
    case 'Disputed':
      return 'Tranh chấp';
    default:
      return stage;
  }
};

const INCIDENT_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'Pending', label: 'Chờ xác minh' },
  { value: 'Verified', label: 'Chờ điều phối' },
  { value: 'Contacting', label: 'Đang liên hệ' },
  { value: 'Dispatched', label: 'Đã điều phối' },
  { value: 'Assigned', label: 'Đã nhận lệnh' },
  { value: 'Finished', label: 'Đã kết thúc' },
  { value: 'Completed', label: 'Hoàn thành' },
  { value: 'FalseAlarm', label: 'Báo động giả' },
  { value: 'Cancelled', label: 'Đã hủy' },
  { value: 'NoRescuerFound', label: 'Không tìm được cứu hộ' },
  { value: 'Disputed', label: 'Tranh chấp' },
] as const;

const MISSION_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'Preparing', label: 'Đang chuẩn bị' },
  { value: 'EnRoute', label: 'Đang di chuyển' },
  { value: 'RescuerArrived', label: 'Đã đến nơi' },
  { value: 'MissionCompleted', label: 'Hoàn thành' },
  { value: 'MissionUncompleted', label: 'Chưa hoàn thành' },
  { value: 'MissionAborted', label: 'Đã hủy bởi cứu hộ viên' },
  { value: 'Cancelled', label: 'Đã hủy bởi người dùng' },
] as const;

const STATUS_BADGE_BASE_CLASS = 'inline-flex items-center justify-center rounded-full px-2.5 py-1 text-center text-xs leading-tight font-semibold';

const getIncidentStatusBadgeClass = (stage: string) => {
  switch (stage) {
    case 'Pending':
      return 'bg-amber-100 text-amber-700';
    case 'Verified':
      return 'bg-indigo-100 text-indigo-700';
    case 'Contacting':
      return 'bg-sky-100 text-sky-700';
    case 'Dispatched':
      return 'bg-cyan-100 text-cyan-700';
    case 'Assigned':
      return 'bg-blue-100 text-blue-700';
    case 'Finished':
    case 'Completed':
      return 'bg-emerald-100 text-emerald-700';
    case 'FalseAlarm':
      return 'bg-slate-200 text-slate-700';
    case 'Cancelled':
      return 'bg-rose-100 text-rose-700';
    case 'NoRescuerFound':
      return 'bg-orange-100 text-orange-700';
    case 'Disputed':
      return 'bg-fuchsia-100 text-fuchsia-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const getMissionStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'Preparing':
      return 'bg-amber-100 text-amber-700';
    case 'EnRoute':
      return 'bg-blue-100 text-blue-700';
    case 'RescuerArrived':
      return 'bg-cyan-100 text-cyan-700';
    case 'MissionCompleted':
      return 'bg-emerald-100 text-emerald-700';
    case 'MissionUncompleted':
      return 'bg-orange-100 text-orange-700';
    case 'MissionAborted':
    case 'Cancelled':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const formatShortId = (id: string | null | undefined) => {
  if (!id) {
    return '-';
  }

  if (id.length <= 13) {
    return id;
  }

  return `${id.slice(0, 8)}...${id.slice(-4)}`;
};

const formatIncidentId = (id: string | null | undefined) => {
  if (!id) {
    return '-';
  }

  const cleanId = id.replace(/-/g, '');
  return `INC-${cleanId.slice(-6).toUpperCase()}`;
};

const formatMissionId = (id: string | null | undefined) => {
  if (!id) {
    return '-';
  }

  const cleanId = id.replace(/-/g, '');
  return `MIS-${cleanId.slice(-6).toUpperCase()}`;
};

const formatPersonDisplayName = (name: string | null | undefined, fallbackId: string | null | undefined) => {
  if (name?.trim()) {
    return name;
  }

  return formatShortId(fallbackId);
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof ApiClientError)) {
    return fallback;
  }

  const validationEntries = Object.entries(error.error?.validationErrors ?? {});
  if (validationEntries.length > 0) {
    return validationEntries
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join(' | ');
  }

  return fallback;
};

const buildPageItems = (current: number, total: number): Array<number | '...'> => {
  if (total <= 1) {
    return [1];
  }

  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total, current - 2, current - 1, current, current + 1, current + 2]);
  const normalized = Array.from(pages)
    .filter(page => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const result: Array<number | '...'> = [];
  normalized.forEach((page, index) => {
    const previous = normalized[index - 1];
    if (previous !== undefined && page - previous > 1) {
      result.push('...');
    }
    result.push(page);
  });

  return result;
};

export default function IncidentsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<IncidentTab>('incidents');

  const [incidents, setIncidents] = useState<AdminIncidentSummaryResponse[]>([]);
  const [incidentsMeta, setIncidentsMeta] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [incidentsError, setIncidentsError] = useState<string | null>(null);
  const [incidentStatus, setIncidentStatus] = useState('');
  const [incidentSince, setIncidentSince] = useState('');
  const [incidentUntil, setIncidentUntil] = useState('');
  const [incidentsPage, setIncidentsPage] = useState(1);
  const [incidentsPageSize, setIncidentsPageSize] = useState(10);

  const [missions, setMissions] = useState<AdminMissionSummaryResponse[]>([]);
  const [missionsMeta, setMissionsMeta] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [missionsLoading, setMissionsLoading] = useState(false);
  const [missionsError, setMissionsError] = useState<string | null>(null);
  const [missionStatus, setMissionStatus] = useState('');
  const [missionSince, setMissionSince] = useState('');
  const [missionUntil, setMissionUntil] = useState('');
  const [missionsPage, setMissionsPage] = useState(1);
  const [missionsPageSize, setMissionsPageSize] = useState(10);

  const [selectedIncidentDetail, setSelectedIncidentDetail] = useState<AdminDetailSnakebiteIncidentResponse | null>(null);
  const [selectedMissionDetail, setSelectedMissionDetail] = useState<AdminMissionDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [detailModal, setDetailModal] = useState<
    | { type: 'incident'; id: string }
    | { type: 'mission'; id: string }
    | null
  >(null);

  const incidentsCanPrev = incidentsPage > 1;
  const incidentsCanNext = incidentsPage < incidentsMeta.total_pages;
  const missionsCanPrev = missionsPage > 1;
  const missionsCanNext = missionsPage < missionsMeta.total_pages;
  const incidentPageItems = useMemo(() => buildPageItems(incidentsMeta.current_page, incidentsMeta.total_pages), [incidentsMeta.current_page, incidentsMeta.total_pages]);
  const missionPageItems = useMemo(() => buildPageItems(missionsMeta.current_page, missionsMeta.total_pages), [missionsMeta.current_page, missionsMeta.total_pages]);

  useEffect(() => {
    if (activeTab !== 'incidents') {
      return;
    }

    let cancelled = false;

    const loadIncidents = async () => {
      setIncidentsLoading(true);
      setIncidentsError(null);

      try {
        const response = await incidentApi.getAdminIncidentList({
          status: incidentStatus.trim() || undefined,
          since: toIso(incidentSince),
          until: toIso(incidentUntil),
          page: incidentsPage,
          pageSize: incidentsPageSize,
        });

        if (cancelled) {
          return;
        }

        setIncidents(Array.isArray(response.items) ? response.items : []);
        setIncidentsMeta(response.meta ?? DEFAULT_PAGINATION);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error('Failed to load admin incidents', error);
        setIncidents([]);
        const message = getApiErrorMessage(error, 'Không thể tải danh sách sự cố.');
        setIncidentsError(message);
        showToast(message, { type: 'error' });
      } finally {
        if (!cancelled) {
          setIncidentsLoading(false);
        }
      }
    };

    void loadIncidents();

    return () => {
      cancelled = true;
    };
  }, [activeTab, incidentSince, incidentStatus, incidentUntil, incidentsPage, incidentsPageSize, showToast]);

  useEffect(() => {
    if (activeTab !== 'missions') {
      return;
    }

    let cancelled = false;

    const loadMissions = async () => {
      setMissionsLoading(true);
      setMissionsError(null);

      try {
        const response = await incidentApi.getAdminMissionList({
          status: missionStatus.trim() || undefined,
          since: toIso(missionSince),
          until: toIso(missionUntil),
          page: missionsPage,
          pageSize: missionsPageSize,
        });

        if (cancelled) {
          return;
        }

        setMissions(Array.isArray(response.items) ? response.items : []);
        setMissionsMeta(response.meta ?? DEFAULT_PAGINATION);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error('Failed to load admin missions', error);
        setMissions([]);
        const message = getApiErrorMessage(error, 'Không thể tải danh sách nhiệm vụ cứu hộ.');
        setMissionsError(message);
        showToast(message, { type: 'error' });
      } finally {
        if (!cancelled) {
          setMissionsLoading(false);
        }
      }
    };

    void loadMissions();

    return () => {
      cancelled = true;
    };
  }, [activeTab, missionSince, missionStatus, missionUntil, missionsPage, missionsPageSize, showToast]);

  const openIncidentDetail = async (incidentId: string) => {
    setDetailModal({ type: 'incident', id: incidentId });
    setDetailLoading(true);
    setDetailError(null);
    setSelectedIncidentDetail(null);
    setSelectedMissionDetail(null);

    try {
      const detail = await incidentApi.getAdminIncidentDetail(incidentId);
      setSelectedIncidentDetail(detail);
    } catch (error) {
      console.error('Failed to load incident detail', error);
      const message = getApiErrorMessage(error, 'Không thể tải chi tiết sự cố.');
      setDetailError(message);
      showToast(message, { type: 'error' });
    } finally {
      setDetailLoading(false);
    }
  };

  const openMissionDetail = async (missionId: string) => {
    setDetailModal({ type: 'mission', id: missionId });
    setDetailLoading(true);
    setDetailError(null);
    setSelectedIncidentDetail(null);
    setSelectedMissionDetail(null);

    try {
      const detail = await incidentApi.getAdminMissionDetail(missionId);
      setSelectedMissionDetail(detail);
    } catch (error) {
      console.error('Failed to load mission detail', error);
      const message = getApiErrorMessage(error, 'Không thể tải chi tiết nhiệm vụ cứu hộ.');
      setDetailError(message);
      showToast(message, { type: 'error' });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setDetailModal(null);
    setDetailError(null);
    setSelectedIncidentDetail(null);
    setSelectedMissionDetail(null);
  };

  const selectedIncidentMedia = selectedIncidentDetail?.incidentMedia ?? selectedIncidentDetail?.media ?? [];
  const selectedIncidentMissionHistory = selectedIncidentDetail?.missionHistory ?? [];
  const selectedIncidentRescueMissionMedia = selectedIncidentDetail?.rescueMissionMedia ?? [];

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-360 flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Quản lý sự cố</h2>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý danh sách sự cố và nhiệm vụ cứu hộ.
            </p>
          </div>

          <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('incidents')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${activeTab === 'incidents' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Sự cố
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('missions')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${activeTab === 'missions' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Nhiệm vụ
            </button>
          </div>
        </header>

        {activeTab === 'incidents' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-700">Trạng thái</p>
                <select
                  value={incidentStatus}
                  onChange={(event) => {
                    setIncidentStatus(event.target.value);
                    setIncidentsPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                >
                  {INCIDENT_STATUS_OPTIONS.map(option => (
                    <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-slate-700">Từ ngày</p>
                <input
                  type="date"
                  value={incidentSince}
                  onChange={(event) => {
                    setIncidentSince(event.target.value);
                    setIncidentsPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-slate-700">Đến ngày</p>
                <input
                  type="date"
                  value={incidentUntil}
                  onChange={(event) => {
                    setIncidentUntil(event.target.value);
                    setIncidentsPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-slate-700">Số dòng / trang</p>
                <select
                  value={incidentsPageSize}
                  onChange={(event) => {
                    setIncidentsPageSize(Number(event.target.value));
                    setIncidentsPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                >
                  {[10, 20, 50].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>

            {incidentsError && (
              <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {incidentsError}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-500">
                    <th className="border-b border-slate-200 px-3 py-2">Mã sự cố</th>
                    <th className="border-b border-slate-200 px-3 py-2 text-center">Trạng thái</th>
                    <th className="border-b border-slate-200 px-3 py-2 text-center">Nhiệm vụ hiện tại</th>
                    <th className="border-b border-slate-200 px-3 py-2 text-center">Cần điều phối lại</th>
                    <th className="border-b border-slate-200 px-3 py-2">Địa chỉ</th>
                    <th className="border-b border-slate-200 px-3 py-2">Tạo lúc</th>
                    <th className="border-b border-slate-200 px-3 py-2">Điều phối viên phụ trách</th>
                    <th className="border-b border-slate-200 px-3 py-2">Cứu hộ phụ trách</th>
                    <th className="border-b border-slate-200 px-3 py-2 whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {incidentsLoading && (
                    <tr>
                      <td colSpan={9} className="px-3 py-10 text-center text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" />
                          Đang tải...
                        </span>
                      </td>
                    </tr>
                  )}

                  {!incidentsLoading && incidents.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-3 py-10 text-center text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <SearchX className="size-4" />
                          Không có dữ liệu
                        </span>
                      </td>
                    </tr>
                  )}

                  {!incidentsLoading && incidents.map(item => (
                    <tr key={item.id} className="group transition-colors hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-3 py-2 font-mono text-sm font-bold tracking-[0.1em] text-indigo-700" title={formatIncidentId(item.id)}>{formatIncidentId(item.id)}</td>
                      <td className="border-b border-slate-100 px-3 py-2 text-center">
                        <span className={`${STATUS_BADGE_BASE_CLASS} ${getIncidentStatusBadgeClass(String(item.status))}`}>
                          {translateIncidentStage(String(item.status))}
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2 text-center">
                        {item.activeMissionStatus
                          ? (
                              <span className={`${STATUS_BADGE_BASE_CLASS} ${getMissionStatusBadgeClass(String(item.activeMissionStatus))}`}>
                                {getMissionStatusLabel(String(item.activeMissionStatus))}
                              </span>
                            )
                          : '-'}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2 text-center">
                        {item.needsRedispatch
                          ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Có</span>
                          : <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Không</span>}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2 max-w-[20rem] whitespace-normal wrap-break-word">{item.address || '-'}</td>
                      <td className="border-b border-slate-100 px-3 py-2">{formatDateTime(item.createdAt)}</td>
                      <td className="border-b border-slate-100 px-3 py-2">
                        <div className="space-y-1">
                          <p className="font-medium text-slate-800">
                            {formatPersonDisplayName(item.handlingOperatorName, item.handlingOperatorId)}
                          </p>
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2">
                        <div className="space-y-1">
                          <p className="font-medium text-slate-800">
                            {formatPersonDisplayName(item.assignedRescuerName, item.assignedRescuerId)}
                          </p>
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => void openIncidentDetail(item.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="size-3.5" />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <p>
                Trang
                {' '}
                {incidentsMeta.current_page}
                /
                {incidentsMeta.total_pages}
                {' '}
                • Tổng
                {' '}
                {incidentsMeta.total_items}
                {' '}
                sự cố
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => incidentsCanPrev && setIncidentsPage(prev => prev - 1)}
                  disabled={!incidentsCanPrev}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Trước
                </button>
                {incidentPageItems.map((pageItem, index, allPages) => (
                  pageItem === '...'
                    ? (
                        <span
                          key={`incident-ellipsis-${String(allPages[index - 1])}-${String(allPages[index + 1])}`}
                          className="px-1 text-slate-400"
                        >
                          ...
                        </span>
                      )
                    : (
                        <button
                          key={pageItem}
                          type="button"
                          onClick={() => setIncidentsPage(pageItem)}
                          className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold ${pageItem === incidentsMeta.current_page ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                        >
                          {pageItem}
                        </button>
                      )
                ))}
                <button
                  type="button"
                  onClick={() => incidentsCanNext && setIncidentsPage(prev => prev + 1)}
                  disabled={!incidentsCanNext}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'missions' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-700">Trạng thái</p>
                <select
                  value={missionStatus}
                  onChange={(event) => {
                    setMissionStatus(event.target.value);
                    setMissionsPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                >
                  {MISSION_STATUS_OPTIONS.map(option => (
                    <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-slate-700">Từ ngày</p>
                <input
                  type="date"
                  value={missionSince}
                  onChange={(event) => {
                    setMissionSince(event.target.value);
                    setMissionsPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-slate-700">Đến ngày</p>
                <input
                  type="date"
                  value={missionUntil}
                  onChange={(event) => {
                    setMissionUntil(event.target.value);
                    setMissionsPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-slate-700">Số dòng / trang</p>
                <select
                  value={missionsPageSize}
                  onChange={(event) => {
                    setMissionsPageSize(Number(event.target.value));
                    setMissionsPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                >
                  {[10, 20, 50].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>

            {missionsError && (
              <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {missionsError}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-500">
                    <th className="border-b border-slate-200 px-3 py-2">Mã nhiệm vụ</th>
                    <th className="border-b border-slate-200 px-3 py-2 text-center">Trạng thái</th>
                    <th className="border-b border-slate-200 px-3 py-2 text-center">Trạng thái sự cố</th>
                    <th className="border-b border-slate-200 px-3 py-2">Người cứu hộ</th>
                    <th className="border-b border-slate-200 px-3 py-2">Chi phí mission</th>
                    <th className="border-b border-slate-200 px-3 py-2">Chi phí thực tế</th>
                    <th className="border-b border-slate-200 px-3 py-2">Chi phí từ trung tâm</th>
                    <th className="border-b border-slate-200 px-3 py-2">Sự cố</th>
                    <th className="border-b border-slate-200 px-3 py-2">Tạo lúc</th>
                    <th className="border-b border-slate-200 px-3 py-2">Cập nhật lúc</th>
                    <th className="border-b border-slate-200 px-3 py-2 whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {missionsLoading && (
                    <tr>
                      <td colSpan={11} className="px-3 py-10 text-center text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" />
                          Đang tải...
                        </span>
                      </td>
                    </tr>
                  )}

                  {!missionsLoading && missions.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-3 py-10 text-center text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <SearchX className="size-4" />
                          Không có dữ liệu
                        </span>
                      </td>
                    </tr>
                  )}

                  {!missionsLoading && missions.map(item => (
                    <tr key={item.id} className="group transition-colors hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-3 py-2 font-mono text-sm font-bold tracking-[0.1em] text-indigo-700" title={formatMissionId(item.id)}>{formatMissionId(item.id)}</td>
                      <td className="border-b border-slate-100 px-3 py-2 text-center">
                        <span className={`${STATUS_BADGE_BASE_CLASS} ${getMissionStatusBadgeClass(item.status)}`}>
                          {getMissionStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2 text-center">
                        <span className={`${STATUS_BADGE_BASE_CLASS} ${getIncidentStatusBadgeClass(String(item.incidentStatus))}`}>
                          {translateIncidentStage(String(item.incidentStatus))}
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2">{item.rescuerName || '-'}</td>
                      <td className="border-b border-slate-100 px-3 py-2">{formatCurrencyOrNoInfo(item.price)}</td>
                      <td className="border-b border-slate-100 px-3 py-2">{formatCurrencyOrNoInfo(item.actualCost)}</td>
                      <td className="border-b border-slate-100 px-3 py-2">{formatCurrencyOrNoInfo(item.costFromCenter)}</td>
                      <td className="border-b border-slate-100 px-3 py-2 max-w-[20rem] whitespace-normal wrap-break-word">{item.incidentAddress || '-'}</td>
                      <td className="border-b border-slate-100 px-3 py-2">{formatDateTime(item.createdAt)}</td>
                      <td className="border-b border-slate-100 px-3 py-2">{formatDateTime(item.updatedAt)}</td>
                      <td className="border-b border-slate-100 px-3 py-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => void openMissionDetail(item.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="size-3.5" />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <p>
                Trang
                {' '}
                {missionsMeta.current_page}
                /
                {missionsMeta.total_pages}
                {' '}
                • Tổng
                {' '}
                {missionsMeta.total_items}
                {' '}
                nhiệm vụ
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => missionsCanPrev && setMissionsPage(prev => prev - 1)}
                  disabled={!missionsCanPrev}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Trước
                </button>
                {missionPageItems.map((pageItem, index, allPages) => (
                  pageItem === '...'
                    ? (
                        <span
                          key={`mission-ellipsis-${String(allPages[index - 1])}-${String(allPages[index + 1])}`}
                          className="px-1 text-slate-400"
                        >
                          ...
                        </span>
                      )
                    : (
                        <button
                          key={pageItem}
                          type="button"
                          onClick={() => setMissionsPage(pageItem)}
                          className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold ${pageItem === missionsMeta.current_page ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                        >
                          {pageItem}
                        </button>
                      )
                ))}
                <button
                  type="button"
                  onClick={() => missionsCanNext && setMissionsPage(prev => prev + 1)}
                  disabled={!missionsCanNext}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-slate-100 shadow-2xl">
            <div className="flex items-center justify-between rounded-t-2xl border-b border-slate-200 bg-white px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {detailModal.type === 'incident' && 'Chi tiết sự cố'}
                {detailModal.type === 'mission' && 'Chi tiết nhiệm vụ cứu hộ'}
              </h3>
              <button
                type="button"
                onClick={closeDetailModal}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-5 text-sm text-slate-700">
              {detailLoading && (
                <div className="flex h-40 items-center justify-center text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Đang tải chi tiết...
                  </span>
                </div>
              )}

              {detailError && !detailLoading && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {detailError}
                </div>
              )}

              {!detailLoading && !detailError && detailModal.type === 'incident' && selectedIncidentDetail && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-emerald-200 bg-linear-to-r from-emerald-50 via-teal-50 to-cyan-50 p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`${STATUS_BADGE_BASE_CLASS} ${getIncidentStatusBadgeClass(String(selectedIncidentDetail.status))}`}>
                        {translateIncidentStage(String(selectedIncidentDetail.status))}
                      </span>
                      {selectedIncidentDetail.activeMission?.status && (
                        <span className={`${STATUS_BADGE_BASE_CLASS} ${getMissionStatusBadgeClass(String(selectedIncidentDetail.activeMission.status))}`}>
                          Nhiệm vụ:
                          {' '}
                          {getMissionStatusLabel(String(selectedIncidentDetail.activeMission.status))}
                        </span>
                      )}
                      {selectedIncidentDetail.totalRescueAttempts !== undefined && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          Lần điều phối:
                          {' '}
                          {selectedIncidentDetail.totalRescueAttempts}
                        </span>
                      )}
                      {selectedIncidentDetail.failedAttemptsCount !== undefined && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          Thất bại:
                          {' '}
                          {selectedIncidentDetail.failedAttemptsCount}
                        </span>
                      )}
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getSeverityBadgeClass(selectedIncidentDetail.severityLevel)}`}>
                        Mức độ:
                        {' '}
                        {getSeverityLabel(selectedIncidentDetail.severityLevel)}
                      </span>
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Mã sự cố
                    </p>
                    <p className="mt-1 font-mono text-2xl font-black tracking-[0.22em] text-slate-900">
                      {formatIncidentId(selectedIncidentDetail.id)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 shadow-sm">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Thông tin sự cố</p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                        <span className="font-semibold">Tạo lúc:</span>
                        {' '}
                        {formatDateTimeOrNoInfo(selectedIncidentDetail.createdAt)}
                      </p>
                      <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                        <span className="font-semibold">Địa chỉ:</span>
                        {' '}
                        {displayOrNoInfo(selectedIncidentDetail.address)}
                      </p>
                      <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                        <span className="font-semibold">Tọa độ:</span>
                        {' '}
                        {selectedIncidentDetail.locationCoordinates.latitude}
                        ,
                        {' '}
                        {selectedIncidentDetail.locationCoordinates.longitude}
                      </p>
                      <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                        <span className="font-semibold">Xảy ra lúc:</span>
                        {' '}
                        {formatDateTimeOrNoInfo(selectedIncidentDetail.incidentOccurredAt)}
                      </p>
                      <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                        <span className="font-semibold">Xác nhận lúc:</span>
                        {' '}
                        {formatDateTimeOrNoInfo(selectedIncidentDetail.confirmedAt)}
                      </p>
                      <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                        <span className="font-semibold">Điều phối lúc:</span>
                        {' '}
                        {formatDateTimeOrNoInfo(selectedIncidentDetail.dispatchedAt)}
                      </p>
                      <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                        <span className="font-semibold">Phân công lúc:</span>
                        {' '}
                        {formatDateTimeOrNoInfo(selectedIncidentDetail.assignedAt)}
                      </p>
                      <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                        <span className="font-semibold">Operator xử lý:</span>
                        {' '}
                        {displayOrNoInfo(formatPersonDisplayName(selectedIncidentDetail.handlingOperatorName, selectedIncidentDetail.handlingOperatorId))}
                      </p>
                      <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                        <span className="font-semibold">Cứu hộ phụ trách:</span>
                        {' '}
                        {displayOrNoInfo(formatPersonDisplayName(selectedIncidentDetail.assignedRescuer?.account?.fullName ?? selectedIncidentDetail.assignedRescuer?.fullName ?? selectedIncidentDetail.assignedRescuerName, selectedIncidentDetail.assignedRescuerId))}
                      </p>
                      <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                        <span className="font-semibold">Mức độ nghiêm trọng:</span>
                        {' '}
                        {displayOrNoInfo(selectedIncidentDetail.severityLevel)}
                      </p>
                      <p className="rounded-lg border border-sky-100 bg-white px-3 py-2 md:col-span-2">
                        <span className="font-semibold">Lý do hủy:</span>
                        {' '}
                        {displayOrNoInfo(selectedIncidentDetail.cancellationReason)}
                      </p>
                    </div>
                  </div>

                  {selectedIncidentDetail.symptomsReport && selectedIncidentDetail.symptomsReport.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Triệu chứng ghi nhận</p>
                      <ul className="space-y-2">
                        {selectedIncidentDetail.symptomsReport.map(symptom => (
                          <li key={symptom.symptomId} className="rounded-xl border border-amber-100 bg-white p-3">
                            <p className="font-semibold text-slate-800">{symptom.symptomName}</p>
                            {symptom.symptomDescription && <p className="text-xs text-slate-600">{symptom.symptomDescription}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-4 shadow-sm">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Nạn nhân</p>
                    <div className="mb-3 flex items-center gap-3 rounded-xl border border-violet-100 bg-white px-3 py-2">
                      {renderAvatar(
                        selectedIncidentDetail.user?.account?.avatarUrl,
                        selectedIncidentDetail.user?.account?.fullName ?? selectedIncidentDetail.user?.fullName ?? selectedIncidentDetail.user?.userName,
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {displayOrNoInfo(selectedIncidentDetail.user?.account?.fullName ?? selectedIncidentDetail.user?.fullName ?? selectedIncidentDetail.user?.userName)}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {displayOrNoInfo(selectedIncidentDetail.user?.phoneNumber)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <p className="rounded-lg border border-violet-100 bg-white px-3 py-2">
                        <span className="font-semibold">Họ tên:</span>
                        {' '}
                        {displayOrNoInfo(selectedIncidentDetail.user?.account?.fullName ?? selectedIncidentDetail.user?.fullName ?? selectedIncidentDetail.user?.userName)}
                      </p>
                      <p className="rounded-lg border border-violet-100 bg-white px-3 py-2">
                        <span className="font-semibold">Tên tài khoản:</span>
                        {' '}
                        {displayOrNoInfo(selectedIncidentDetail.user?.userName)}
                      </p>
                      <p className="rounded-lg border border-violet-100 bg-white px-3 py-2">
                        <span className="font-semibold">Email:</span>
                        {' '}
                        {displayOrNoInfo(selectedIncidentDetail.user?.email)}
                      </p>
                      <p className="rounded-lg border border-violet-100 bg-white px-3 py-2">
                        <span className="font-semibold">Số điện thoại:</span>
                        {' '}
                        {displayOrNoInfo(selectedIncidentDetail.user?.phoneNumber)}
                      </p>
                      <p className="rounded-lg border border-violet-100 bg-white px-3 py-2">
                        <span className="font-semibold">Điểm đánh giá:</span>
                        {' '}
                        {displayOrNoInfo(selectedIncidentDetail.user?.rating)}
                        {' '}
                        (
                        {displayOrNoInfo(selectedIncidentDetail.user?.ratingCount)}
                        {' '}
                        lượt)
                      </p>
                      <p className="rounded-lg border border-violet-100 bg-white px-3 py-2">
                        <span className="font-semibold">Role:</span>
                        {' '}
                        {displayOrNoInfo(selectedIncidentDetail.user?.account?.role == null ? null : String(selectedIncidentDetail.user.account.role))}
                      </p>
                      <p className="rounded-lg border border-violet-100 bg-white px-3 py-2">
                        <span className="font-semibold">Bệnh nền:</span>
                        {' '}
                        {selectedIncidentDetail.user == null ? NO_INFO_TEXT : selectedIncidentDetail.user.hasUnderlyingDisease ? 'Có' : 'Không'}
                      </p>
                      <p className="rounded-lg border border-violet-100 bg-white px-3 py-2 md:col-span-2">
                        <span className="font-semibold">Liên hệ khẩn cấp:</span>
                        {' '}
                        {selectedIncidentDetail.user?.emergencyContacts?.length
                          ? selectedIncidentDetail.user.emergencyContacts.join(', ')
                          : NO_INFO_TEXT}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-4 shadow-sm">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Cứu hộ được phân công</p>
                    <div className="mb-3 flex items-center gap-3 rounded-xl border border-cyan-100 bg-white px-3 py-2">
                      {renderAvatar(
                        selectedIncidentDetail.assignedRescuer?.account?.avatarUrl,
                        selectedIncidentDetail.assignedRescuer?.account?.fullName ?? selectedIncidentDetail.assignedRescuer?.fullName,
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {displayOrNoInfo(selectedIncidentDetail.assignedRescuer?.account?.fullName ?? selectedIncidentDetail.assignedRescuer?.fullName)}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {displayOrNoInfo(selectedIncidentDetail.assignedRescuer?.phoneNumber)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                        <span className="font-semibold">Họ tên:</span>
                        {' '}
                        {displayOrNoInfo(selectedIncidentDetail.assignedRescuer?.account?.fullName ?? selectedIncidentDetail.assignedRescuer?.fullName ?? selectedIncidentDetail.assignedRescuer?.accountId)}
                      </p>
                      <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                        <span className="font-semibold">Số điện thoại:</span>
                        {' '}
                        {displayOrNoInfo(selectedIncidentDetail.assignedRescuer?.phoneNumber)}
                      </p>
                      <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                        <span className="font-semibold">Loại cứu hộ:</span>
                        {' '}
                        {displayOrNoInfo(selectedIncidentDetail.assignedRescuer?.type == null ? null : String(selectedIncidentDetail.assignedRescuer.type))}
                      </p>
                    </div>
                  </div>

                  {(selectedIncidentDetail.totalDispatchRequests !== undefined
                    || selectedIncidentDetail.acceptedDispatchCount !== undefined
                    || selectedIncidentDetail.declinedDispatchCount !== undefined
                    || selectedIncidentDetail.cancelledDispatchCount !== undefined
                    || selectedIncidentDetail.operatorNotes) && (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-sm">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Điều phối</p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {selectedIncidentDetail.totalDispatchRequests !== undefined && (
                          <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                            <span className="font-semibold">Tổng yêu cầu:</span>
                            {' '}
                            {selectedIncidentDetail.totalDispatchRequests}
                          </p>
                        )}
                        {selectedIncidentDetail.acceptedDispatchCount !== undefined && (
                          <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                            <span className="font-semibold">Đã nhận:</span>
                            {' '}
                            {selectedIncidentDetail.acceptedDispatchCount}
                          </p>
                        )}
                        {selectedIncidentDetail.declinedDispatchCount !== undefined && (
                          <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                            <span className="font-semibold">Từ chối:</span>
                            {' '}
                            {selectedIncidentDetail.declinedDispatchCount}
                          </p>
                        )}
                        {selectedIncidentDetail.cancelledDispatchCount !== undefined && (
                          <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                            <span className="font-semibold">Đã hủy:</span>
                            {' '}
                            {selectedIncidentDetail.cancelledDispatchCount}
                          </p>
                        )}
                        {selectedIncidentDetail.operatorNotes && (
                          <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2 md:col-span-2">
                            <span className="font-semibold">Ghi chú operator:</span>
                            {' '}
                            {selectedIncidentDetail.operatorNotes}
                          </p>
                        )}
                        <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2 md:col-span-2">
                          <span className="font-semibold">Operator:</span>
                          {' '}
                          {displayOrNoInfo(selectedIncidentDetail.handlingOperatorName)}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedIncidentDetail.identifiedSnake && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 shadow-sm">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Rắn được nhận diện</p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[120px_1fr]">
                        {selectedIncidentDetail.identifiedSnake.imageUrl && (
                          <img
                            src={selectedIncidentDetail.identifiedSnake.imageUrl}
                            alt={selectedIncidentDetail.identifiedSnake.commonName}
                            className="h-28 w-28 rounded-xl border border-slate-200 object-cover"
                          />
                        )}
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <p className="rounded-lg border border-rose-100 bg-white px-3 py-2">
                            <span className="font-semibold">Tên thường gọi:</span>
                            {' '}
                            {selectedIncidentDetail.identifiedSnake.commonName}
                          </p>
                          <p className="rounded-lg border border-rose-100 bg-white px-3 py-2">
                            <span className="font-semibold">Tên khoa học:</span>
                            {' '}
                            {selectedIncidentDetail.identifiedSnake.scientificName}
                          </p>
                          <p className="rounded-lg border border-rose-100 bg-white px-3 py-2">
                            <span className="font-semibold">Loại độc:</span>
                            {' '}
                            {getVenomTypeLabel(selectedIncidentDetail.identifiedSnake.primaryVenomType)}
                          </p>
                          <p className="rounded-lg border border-rose-100 bg-white px-3 py-2">
                            <span className="font-semibold">Mức nguy cơ:</span>
                            {' '}
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getSnakeRiskClass(selectedIncidentDetail.identifiedSnake.riskLevel)}`}>
                              {selectedIncidentDetail.identifiedSnake.riskLevel}
                              /10
                            </span>
                          </p>
                          <p className="rounded-lg border border-rose-100 bg-white px-3 py-2 md:col-span-2">
                            <span className="font-semibold">Slug:</span>
                            {' '}
                            {displayOrNoInfo(selectedIncidentDetail.identifiedSnake.slug)}
                          </p>
                          <p className="rounded-lg border border-rose-100 bg-white px-3 py-2 md:col-span-2">
                            <span className="font-semibold">Tóm tắt nhận diện:</span>
                            {' '}
                            {displayOrNoInfo(selectedIncidentDetail.identifiedSnake.identificationSummary)}
                          </p>
                          <p className="rounded-lg border border-rose-100 bg-white px-3 py-2">
                            <span className="font-semibold">Độc tính:</span>
                            {' '}
                            {selectedIncidentDetail.identifiedSnake.isVenomous ? 'Có độc' : 'Không độc'}
                          </p>
                          <p className="rounded-lg border border-rose-100 bg-white px-3 py-2">
                            <span className="font-semibold">Đang hoạt động:</span>
                            {' '}
                            {selectedIncidentDetail.identifiedSnake.isActive ? 'Có' : 'Không'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedIncidentDetail.identificationContext && (
                    <div className="rounded-xl border border-fuchsia-200 bg-fuchsia-50/70 p-4 shadow-sm">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Ngữ cảnh nhận diện</p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <p className="rounded-lg border border-fuchsia-100 bg-white px-3 py-2">
                          <span className="font-semibold">Phương thức:</span>
                          {' '}
                          {selectedIncidentDetail.identificationContext.method}
                        </p>
                        {((selectedIncidentDetail.identificationContext.aIConfidence ?? selectedIncidentDetail.identificationContext.aiConfidence) !== null
                          && (selectedIncidentDetail.identificationContext.aIConfidence ?? selectedIncidentDetail.identificationContext.aiConfidence) !== undefined) && (
                          <p className="rounded-lg border border-fuchsia-100 bg-white px-3 py-2">
                            <span className="font-semibold">Độ tin cậy AI:</span>
                            {' '}
                            {(((selectedIncidentDetail.identificationContext.aIConfidence ?? selectedIncidentDetail.identificationContext.aiConfidence) as number) * 100).toFixed(2)}
                            %
                          </p>
                        )}
                        {selectedIncidentDetail.identificationContext.identifiedAt && (
                          <p className="rounded-lg border border-fuchsia-100 bg-white px-3 py-2">
                            <span className="font-semibold">Thời điểm nhận diện:</span>
                            {' '}
                            {formatDateTime(selectedIncidentDetail.identificationContext.identifiedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedIncidentMedia.length > 0 && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tệp đính kèm sự cố</p>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {selectedIncidentMedia.map(media => (
                          <a
                            key={media.id}
                            href={media.mediaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="overflow-hidden rounded-xl border border-emerald-100 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <div className="h-40 w-full bg-slate-100">
                              <img src={media.mediaUrl} alt={media.fileName ?? media.id} className="h-full w-full object-cover" />
                            </div>
                            <div className="space-y-2 p-3">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {media.fileName ?? media.purpose}
                              </p>
                              <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                                <span className="rounded-full bg-white px-2 py-0.5">{media.purpose}</span>
                                <span className="rounded-full bg-white px-2 py-0.5">{media.referenceType}</span>
                                {media.contentType && <span className="rounded-full bg-white px-2 py-0.5">{media.contentType}</span>}
                                {'isProcessed' in media && (
                                  <span className={`rounded-full px-2 py-0.5 ${media.isProcessed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {media.isProcessed ? 'Đã xử lý AI' : 'Chưa xử lý AI'}
                                  </span>
                                )}
                              </div>
                              {'processedAt' in media && (
                                <p className="text-[11px] text-slate-500">
                                  Xử lý lúc:
                                  {' '}
                                  {formatDateTimeOrNoInfo(media.processedAt)}
                                </p>
                              )}
                              {'sequenceOrder' in media && (
                                <p className="text-[11px] text-slate-500">
                                  Thứ tự:
                                  {' '}
                                  {displayOrNoInfo(media.sequenceOrder)}
                                </p>
                              )}
                              {'detectedSpecies' in media && Array.isArray(media.detectedSpecies) && media.detectedSpecies.length > 0 && (
                                <p className="text-[11px] text-slate-500">
                                  Species AI:
                                  {' '}
                                  {media.detectedSpecies.map(species => species.commonName).join(', ')}
                                </p>
                              )}
                              <p className="text-[11px] text-slate-400">Mở tệp</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedIncidentMissionHistory.length > 0 || selectedIncidentRescueMissionMedia.length > 0) && (
                    <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-4 shadow-sm">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Lịch sử nhiệm vụ cứu hộ</p>
                      <div className="space-y-3">
                        {selectedIncidentMissionHistory.map(mission => (
                          <div key={mission.missionId} className="rounded-xl border border-orange-100 bg-white p-3">
                            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                              <span>
                                Nhiệm vụ
                                {' '}
                                <span className="font-bold text-indigo-700">{formatMissionId(mission.missionId)}</span>
                              </span>
                              <span className={`${STATUS_BADGE_BASE_CLASS} ${getMissionStatusBadgeClass(String(mission.status))}`}>
                                {getMissionStatusLabel(String(mission.status))}
                              </span>
                              <span className="text-slate-500">
                                {formatPersonDisplayName(mission.rescuerName, mission.rescuerId)}
                              </span>
                            </div>
                            <div className="mb-3 grid grid-cols-1 gap-2 text-xs text-slate-600 md:grid-cols-2">
                              <p>
                                <span className="font-semibold">Rescuer phone:</span>
                                {' '}
                                {displayOrNoInfo(mission.rescuerPhone)}
                              </p>
                              <p>
                                <span className="font-semibold">Tạo lúc:</span>
                                {' '}
                                {formatDateTimeOrNoInfo(mission.createdAt)}
                              </p>
                              <p>
                                <span className="font-semibold">Bắt đầu:</span>
                                {' '}
                                {formatDateTimeOrNoInfo(mission.startedAt)}
                              </p>
                              <p>
                                <span className="font-semibold">Đến nơi:</span>
                                {' '}
                                {formatDateTimeOrNoInfo(mission.arrivedAt)}
                              </p>
                              <p>
                                <span className="font-semibold">Hoàn tất:</span>
                                {' '}
                                {formatDateTimeOrNoInfo(mission.completedAt)}
                              </p>
                              <p>
                                <span className="font-semibold">Giá/Thực tế:</span>
                                {' '}
                                {formatCurrencyOrNoInfo(mission.price)}
                                /
                                {formatCurrencyOrNoInfo(mission.actualCost)}
                              </p>
                              <p className="md:col-span-2">
                                <span className="font-semibold">Ghi chú:</span>
                                {' '}
                                {displayOrNoInfo(mission.notes)}
                              </p>
                              <p className="md:col-span-2">
                                <span className="font-semibold">Lý do hủy:</span>
                                {' '}
                                {displayOrNoInfo(mission.cancellationReason)}
                              </p>
                            </div>
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                              {(mission.media ?? []).map(file => (
                                <a
                                  key={file.id}
                                  href={file.mediaUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-sm"
                                >
                                  {isImageAttachment(file.contentType, file.fileName, file.mediaUrl) && (
                                    <img
                                      src={file.mediaUrl}
                                      alt={file.fileName}
                                      className="h-28 w-full object-cover"
                                    />
                                  )}
                                  <div className="space-y-1 p-2">
                                    <p className="truncate text-xs font-semibold text-slate-800">{file.fileName}</p>
                                    <p className="truncate text-xs text-slate-500">{file.contentType}</p>
                                    <p className="text-[11px] text-slate-400">
                                      {file.fileSize?.toLocaleString('vi-VN') ?? 0}
                                      {' '}
                                      bytes
                                    </p>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        ))}

                        {selectedIncidentRescueMissionMedia.map(group => (
                          <div key={group.missionId} className="rounded-xl border border-orange-100 bg-white p-3">
                            <p className="mb-2 text-xs text-slate-600">
                              Nhiệm vụ
                              {' '}
                              <span className="font-bold text-indigo-700">{formatMissionId(group.missionId)}</span>
                              {' '}
                              •
                              {' '}
                              <span className={`${STATUS_BADGE_BASE_CLASS} ${getMissionStatusBadgeClass(String(group.missionStatus))}`}>
                                {getMissionStatusLabel(String(group.missionStatus))}
                              </span>
                            </p>
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                              {(group.media ?? []).map(file => (
                                <a
                                  key={file.id}
                                  href={file.mediaUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-sm"
                                >
                                  {isImageAttachment(file.contentType, file.fileName, file.mediaUrl) && (
                                    <img
                                      src={file.mediaUrl}
                                      alt={file.fileName}
                                      className="h-28 w-full object-cover"
                                    />
                                  )}
                                  <div className="space-y-1 p-2">
                                    <p className="truncate text-xs font-semibold text-slate-800">{file.fileName}</p>
                                    <p className="truncate text-xs text-slate-500">{file.contentType}</p>
                                    <p className="text-[11px] text-slate-400">
                                      {file.fileSize?.toLocaleString('vi-VN') ?? 0}
                                      {' '}
                                      bytes
                                    </p>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedIncidentDetail.dispatchRequests && selectedIncidentDetail.dispatchRequests.length > 0 && (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Lịch sử dispatch</p>
                      <div className="space-y-2">
                        {selectedIncidentDetail.dispatchRequests.map(request => (
                          <div key={request.requestId} className="rounded-lg border border-indigo-100 bg-white p-3">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                              <span className={`${STATUS_BADGE_BASE_CLASS} ${getDispatchStatusBadgeClass(request.status)}`}>
                                {getDispatchStatusLabel(request.status)}
                              </span>
                              <span>
                                Cứu hộ:
                                {' '}
                                {formatPersonDisplayName(request.rescuerName, request.rescuerId)}
                              </span>
                              <span>
                                SĐT:
                                {' '}
                                {displayOrNoInfo(request.rescuerPhone)}
                              </span>
                              {request.operatorName && (
                                <span>
                                  Operator:
                                  {' '}
                                  {request.operatorName}
                                </span>
                              )}
                            </div>
                            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                              <p>
                                <span className="font-semibold">Gửi lúc:</span>
                                {' '}
                                {formatDateTime(request.dispatchedAt)}
                              </p>
                              <p>
                                <span className="font-semibold">Phản hồi lúc:</span>
                                {' '}
                                {formatDateTime(request.responseAt)}
                              </p>
                              {request.declineReason && (
                                <p className="md:col-span-2">
                                  <span className="font-semibold">Lý do từ chối:</span>
                                  {' '}
                                  {request.declineReason}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Thanh toán</p>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <p>
                        <span className="font-semibold">Mã giao dịch:</span>
                        {' '}
                        {displayOrNoInfo(selectedIncidentDetail.paymentSummary?.paymentExternalTransactionId)}
                      </p>
                      <p>
                        <span className="font-semibold">Trạng thái:</span>
                        {' '}
                        {displayOrNoInfo(selectedIncidentDetail.paymentSummary?.paymentState == null ? null : String(selectedIncidentDetail.paymentSummary.paymentState))}
                      </p>
                      <p>
                        <span className="font-semibold">Đã thanh toán:</span>
                        {' '}
                        {displayOrNoInfo(selectedIncidentDetail.paymentSummary?.paidAmount != null ? `${selectedIncidentDetail.paymentSummary.paidAmount.toLocaleString('vi-VN')} VND` : null)}
                      </p>
                      <p>
                        <span className="font-semibold">Thanh toán lúc:</span>
                        {' '}
                        {formatDateTimeOrNoInfo(selectedIncidentDetail.paymentSummary?.paidAt)}
                      </p>
                      <p>
                        <span className="font-semibold">Phương thức:</span>
                        {' '}
                        {displayOrNoInfo(selectedIncidentDetail.paymentSummary?.paymentMethod)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!detailLoading && !detailError && detailModal.type === 'mission' && selectedMissionDetail && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-blue-200 bg-linear-to-r from-blue-50 via-sky-50 to-cyan-50 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`${STATUS_BADGE_BASE_CLASS} ${getMissionStatusBadgeClass(String(selectedMissionDetail.status))}`}>
                        Trạng thái:
                        {' '}
                        {getMissionStatusLabel(String(selectedMissionDetail.status))}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        Giá nhiệm vụ:
                        {' '}
                        {selectedMissionDetail.price.toLocaleString('vi-VN')}
                        {' '}
                        VND
                      </span>
                      {formatCurrency(selectedMissionDetail.actualCost) && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Chi phí thực tế:
                          {' '}
                          {formatCurrency(selectedMissionDetail.actualCost)}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-2xl font-black text-slate-900 tracking-wider">
                      {formatMissionId(selectedMissionDetail.id)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 shadow-sm">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Thông tin nhiệm vụ</p>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <p>
                        <span className="font-semibold">Mã sự cố:</span>
                        {' '}
                        <span className="font-bold text-indigo-700">{formatIncidentId(selectedMissionDetail.incidentId)}</span>
                      </p>
                      <p>
                        <span className="font-semibold">Cứu hộ:</span>
                        {' '}
                        <span className="font-medium text-slate-800">
                          {selectedMissionDetail.rescuer.account?.fullName ?? selectedMissionDetail.rescuer.fullName ?? 'Chưa rõ'}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold">Tạo lúc:</span>
                        {' '}
                        {formatDateTime(selectedMissionDetail.createdAt)}
                      </p>
                      <p>
                        <span className="font-semibold">Cập nhật lúc:</span>
                        {' '}
                        {formatDateTimeOrNoInfo(selectedMissionDetail.updatedAt)}
                      </p>
                      <p>
                        <span className="font-semibold">Bắt đầu:</span>
                        {' '}
                        {formatDateTimeOrNoInfo(selectedMissionDetail.startedAt)}
                      </p>
                      <p>
                        <span className="font-semibold">Đến nơi:</span>
                        {' '}
                        {formatDateTimeOrNoInfo(selectedMissionDetail.arrivedAt)}
                      </p>
                      <p>
                        <span className="font-semibold">Hoàn tất:</span>
                        {' '}
                        {formatDateTimeOrNoInfo(selectedMissionDetail.completedAt)}
                      </p>
                      <p>
                        <span className="font-semibold">Khoảng cách từ trung tâm:</span>
                        {' '}
                        {displayOrNoInfo(selectedMissionDetail.distanceFromCenterKm)}
                        {selectedMissionDetail.distanceFromCenterKm != null ? ' km' : ''}
                      </p>
                      <p>
                        <span className="font-semibold">Khoảng cách di chuyển:</span>
                        {' '}
                        {displayOrNoInfo(selectedMissionDetail.distanceKm)}
                        {selectedMissionDetail.distanceKm != null ? ' km' : ''}
                      </p>
                      <p>
                        <span className="font-semibold">Chi phí từ trung tâm:</span>
                        {' '}
                        {formatCurrencyOrNoInfo(selectedMissionDetail.costFromCenter)}
                      </p>
                      <p>
                        <span className="font-semibold">Ghi chú:</span>
                        {' '}
                        {displayOrNoInfo(selectedMissionDetail.notes)}
                      </p>
                      <p>
                        <span className="font-semibold">Lý do hủy:</span>
                        {' '}
                        {displayOrNoInfo(selectedMissionDetail.cancellationReason)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-3 shadow-sm">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Thông tin cứu hộ</p>
                    <div className="mb-3 flex items-center gap-3 rounded-xl border border-cyan-100 bg-white px-3 py-2">
                      {renderAvatar(
                        selectedMissionDetail.rescuer?.account?.avatarUrl,
                        selectedMissionDetail.rescuer?.account?.fullName ?? selectedMissionDetail.rescuer?.fullName,
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {displayOrNoInfo(selectedMissionDetail.rescuer?.account?.fullName ?? selectedMissionDetail.rescuer?.fullName)}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {displayOrNoInfo(selectedMissionDetail.rescuer?.phoneNumber)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <p>
                        <span className="font-semibold">Họ tên:</span>
                        {' '}
                        {displayOrNoInfo(selectedMissionDetail.rescuer?.account?.fullName ?? selectedMissionDetail.rescuer?.fullName ?? selectedMissionDetail.rescuer?.accountId ?? selectedMissionDetail.rescuer?.id)}
                      </p>
                      <p>
                        <span className="font-semibold">Số điện thoại:</span>
                        {' '}
                        {displayOrNoInfo(selectedMissionDetail.rescuer?.phoneNumber)}
                      </p>
                      <p>
                        <span className="font-semibold">Email:</span>
                        {' '}
                        {displayOrNoInfo(selectedMissionDetail.rescuer?.account?.email)}
                      </p>
                      <p>
                        <span className="font-semibold">Loại cứu hộ:</span>
                        {' '}
                        {displayOrNoInfo(selectedMissionDetail.rescuer?.type == null ? null : String(selectedMissionDetail.rescuer.type))}
                      </p>
                      <p>
                        <span className="font-semibold">Trực tuyến:</span>
                        {' '}
                        {selectedMissionDetail.rescuer == null ? NO_INFO_TEXT : selectedMissionDetail.rescuer.isOnline ? 'Có' : 'Không'}
                      </p>
                      <p>
                        <span className="font-semibold">Sẵn sàng:</span>
                        {' '}
                        {selectedMissionDetail.rescuer == null ? NO_INFO_TEXT : selectedMissionDetail.rescuer.isAvailable ? 'Có' : 'Không'}
                      </p>
                      <p>
                        <span className="font-semibold">Cập nhật vị trí gần nhất:</span>
                        {' '}
                        {formatDateTimeOrNoInfo(selectedMissionDetail.rescuer?.lastLocationUpdate)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3 shadow-sm">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Thông tin nạn nhân</p>
                    <div className="mb-3 flex items-center gap-3 rounded-xl border border-violet-100 bg-white px-3 py-2">
                      {renderAvatar(
                        selectedMissionDetail.user?.account?.avatarUrl,
                        selectedMissionDetail.user?.account?.fullName ?? selectedMissionDetail.user?.fullName ?? selectedMissionDetail.user?.userName,
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {displayOrNoInfo(selectedMissionDetail.user?.account?.fullName ?? selectedMissionDetail.user?.fullName ?? selectedMissionDetail.user?.userName)}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {displayOrNoInfo(selectedMissionDetail.user?.phoneNumber)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <p>
                        <span className="font-semibold">Họ tên:</span>
                        {' '}
                        {displayOrNoInfo(selectedMissionDetail.user?.account?.fullName ?? selectedMissionDetail.user?.fullName ?? selectedMissionDetail.user?.userName)}
                      </p>
                      <p>
                        <span className="font-semibold">Tên tài khoản:</span>
                        {' '}
                        {displayOrNoInfo(selectedMissionDetail.user?.userName)}
                      </p>
                      <p>
                        <span className="font-semibold">Email:</span>
                        {' '}
                        {displayOrNoInfo(selectedMissionDetail.user?.email)}
                      </p>
                      <p>
                        <span className="font-semibold">Số điện thoại:</span>
                        {' '}
                        {displayOrNoInfo(selectedMissionDetail.user?.phoneNumber)}
                      </p>
                      <p>
                        <span className="font-semibold">Bệnh nền:</span>
                        {' '}
                        {selectedMissionDetail.user == null ? NO_INFO_TEXT : selectedMissionDetail.user.hasUnderlyingDisease ? 'Có' : 'Không'}
                      </p>
                      <p>
                        <span className="font-semibold">Liên hệ khẩn cấp:</span>
                        {' '}
                        {selectedMissionDetail.user?.emergencyContacts?.length ? selectedMissionDetail.user.emergencyContacts.join(', ') : NO_INFO_TEXT}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 shadow-sm">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Sự cố liên quan</p>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <p>
                        <span className="font-semibold">Mã sự cố:</span>
                        {' '}
                        <span className="font-bold text-indigo-700">{formatIncidentId(selectedMissionDetail.incident.id)}</span>
                      </p>
                      <p>
                        <span className="font-semibold">Trạng thái:</span>
                        {' '}
                        <span className={`${STATUS_BADGE_BASE_CLASS} ${getIncidentStatusBadgeClass(String(selectedMissionDetail.incident.status))}`}>
                          {translateIncidentStage(String(selectedMissionDetail.incident.status))}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold">Địa chỉ:</span>
                        {' '}
                        {displayOrNoInfo(selectedMissionDetail.incident?.address)}
                      </p>
                      <p>
                        <span className="font-semibold">Tọa độ:</span>
                        {' '}
                        {selectedMissionDetail.incident.locationCoordinates.latitude}
                        ,
                        {' '}
                        {selectedMissionDetail.incident.locationCoordinates.longitude}
                      </p>
                      <p>
                        <span className="font-semibold">Xảy ra lúc:</span>
                        {' '}
                        {formatDateTimeOrNoInfo(selectedMissionDetail.incident?.incidentOccurredAt)}
                      </p>
                      <p>
                        <span className="font-semibold">Phân công lúc:</span>
                        {' '}
                        {formatDateTimeOrNoInfo(selectedMissionDetail.incident?.assignedAt)}
                      </p>
                      <p>
                        <span className="font-semibold">Mức độ nghiêm trọng:</span>
                        {' '}
                        {displayOrNoInfo(selectedMissionDetail.incident?.severityLevel)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 shadow-sm">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Tệp nhiệm vụ</p>
                    {selectedMissionDetail.missionMedia.length === 0
                      ? <p className="text-sm text-slate-500">Chưa có thông tin</p>
                      : (
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                            {selectedMissionDetail.missionMedia.map(file => (
                              <a
                                key={file.id}
                                href={file.mediaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded border border-emerald-100 bg-white p-2 hover:bg-emerald-50/40"
                              >
                                {isImageAttachment(file.contentType, file.fileName, file.mediaUrl) && (
                                  <img
                                    src={file.mediaUrl}
                                    alt={file.fileName}
                                    className="mb-2 h-28 w-full rounded object-cover"
                                  />
                                )}
                                <p className="truncate text-xs font-semibold text-slate-800">{file.fileName}</p>
                                <p className="truncate text-xs text-slate-500">{file.contentType}</p>
                                <p className="text-[11px] text-slate-400">
                                  {file.fileSize.toLocaleString('vi-VN')}
                                  {' '}
                                  bytes
                                </p>
                              </a>
                            ))}
                          </div>
                        )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
