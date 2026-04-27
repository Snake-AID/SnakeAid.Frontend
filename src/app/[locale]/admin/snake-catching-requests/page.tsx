'use client';
/* eslint-disable react/no-array-index-key */

import type { CreateSnakeCatchingRequestResponse, SnakeCatchingMissionInfo } from '@/types/snakecatching-request.type';
import { AlertCircle, AlertTriangle, Ban, Calendar, Camera, CheckCircle2, Clock, Eye, FileText, Filter, Info, Loader2, MapPin, MessageSquare, Phone, Search, SearchX, ShieldAlert, ShieldCheck, Star, Target as TargetIcon, ThumbsDown, User, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api, ApiClientError } from '@/apis/client';
import { snakeCatchingRequestApi } from '@/apis/snake-catching-request.api';
import AdminTransactionCard from '@/components/admin/AdminTransactionCard';
import { useToast } from '@/components/ToastProvider';

type SnakeCatchingRequestItem = CreateSnakeCatchingRequestResponse & {
  priority?: string | null;
  requestDate?: string | null;
  preferredTime?: string | null;
  notes?: string | null;
  details?: Array<{
    snakeCatchingRequestId?: string | null;
    snakeSpeciesId?: number | null;
    quantity?: number | null;
    snakeSpeciesName?: string | null;
    snakeSpeciesScientificName?: string | null;
  }> | null;
  media?: unknown[] | null;
  feedbacks?: Array<{
    id: string;
    raterId: string;
    targetUserId: string;
    referenceId: string;
    type: string;
    rating: number;
    comments: string | null;
    createdAt: string;
    updatedAt: string;
    raterName: string | null;
    targetUserName: string | null;
    updatedAverageRating: number;
    updatedRatingCount: number;
  }> | null;
  assignedRescuer?: {
    isOnline?: boolean | null;
    isAvailable?: boolean | null;
    phoneNumber?: string | null;
    rating?: number | null;
    ratingCount?: number | null;
    type?: string | null;
    lastLocationUpdate?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    totalMissions?: number | null;
    completedMissions?: number | null;
    account?: {
      email?: string | null;
      fullName?: string | null;
      avatarUrl?: string | null;
      role?: string | null;
      isActive?: boolean | null;
    } | null;
  } | null;
  user?: {
    userName?: string | null;
    email?: string | null;
    rating?: number | null;
    ratingCount?: number | null;
    emergencyContacts?: string[] | null;
    hasUnderlyingDisease?: boolean | null;
    account?: {
      fullName?: string | null;
      email?: string | null;
      avatarUrl?: string | null;
      role?: string | null;
      isActive?: boolean | null;
    };
    phoneNumber?: string | null;
  } | null;
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatShortId = (id: string | null | undefined) => {
  if (!id) {
    return '-';
  }
  const cleanId = id.replace(/-/g, '');
  return `CAR-${cleanId.slice(-6).toUpperCase()}`;
};

const getStatusConfig = (status: string | null | undefined) => {
  switch (status) {
    case 'Pending':
      return { class: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Đang chờ', icon: <Clock className="size-3.5" /> };
    case 'Confirmed':
      return { class: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Đã xác nhận', icon: <CheckCircle2 className="size-3.5" /> };
    case 'Assigned':
    case 'Dispatched':
      return { class: 'bg-indigo-100 text-indigo-700 border-indigo-200', label: 'Đã phân công', icon: <ShieldCheck className="size-3.5" /> };
    case 'Completed':
      return { class: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Hoàn thành', icon: <CheckCircle2 className="size-3.5" /> };
    case 'Cancelled':
      return { class: 'bg-slate-200 text-slate-700 border-slate-300', label: 'Đã hủy', icon: <X className="size-3.5" /> };
    case 'Finished':
      return { class: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Đã kết thúc', icon: <CheckCircle2 className="size-3.5" /> };
    default:
      return { class: 'bg-slate-100 text-slate-700 border-slate-200', label: status ?? '-', icon: <AlertCircle className="size-3.5" /> };
  }
};

const getMissionStatusConfig = (status: string | null | undefined) => {
  switch (status) {
    case 'Preparing': return { class: 'bg-blue-50 text-blue-700', label: 'Đang chuẩn bị' };
    case 'EnRoute': return { class: 'bg-indigo-50 text-indigo-700', label: 'Đang di chuyển' };
    case 'Arrived': return { class: 'bg-teal-50 text-teal-700', label: 'Đã đến nơi' };
    case 'MissionCompleted': return { class: 'bg-emerald-50 text-emerald-700', label: 'Hoàn thành' };
    case 'MissionUncompleted': return { class: 'bg-rose-50 text-rose-700', label: 'Không hoàn thành' };
    case 'MissionAborted': return { class: 'bg-orange-50 text-orange-700', label: 'Bị hủy ngang' };
    case 'Cancelled': return { class: 'bg-slate-50 text-slate-700', label: 'Đã hủy' };
    default: return { class: 'bg-slate-50 text-slate-700', label: status ?? '-' };
  }
};

const getPriorityClass = (priority: string | null | undefined) => {
  switch (priority) {
    case 'Urgent':
    case 'High':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'Normal':
    case 'Medium':
      return 'bg-sky-100 text-sky-700 border-sky-200';
    case 'Low':
      return 'bg-slate-200 text-slate-700 border-slate-300';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getPriorityLabel = (priority: string | null | undefined) => {
  switch (priority) {
    case 'Urgent': return 'Khẩn cấp';
    case 'High': return 'Cao';
    case 'Normal': return 'Bình thường';
    case 'Medium': return 'Trung bình';
    case 'Low': return 'Thấp';
    default: return priority ?? '-';
  }
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof ApiClientError)) {
    return fallback;
  }
  const validationEntries = Object.entries(error.error?.validationErrors ?? {});
  if (validationEntries.length > 0) {
    return validationEntries.map(([field, messages]) => `${field}: ${messages.join(', ')}`).join(' | ');
  }
  return fallback;
};

const renderAvatar = (avatarUrl: string | null | undefined, fullName: string | null | undefined, size = 'size-12') => {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={fullName ?? 'Avatar'} className={`${size} rounded-full border-2 border-white object-cover shadow-xs`} />;
  }
  const initials = (fullName ?? 'NA').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('');
  return (
    <div className={`inline-flex ${size} items-center justify-center rounded-full border-2 border-white bg-linear-to-br from-blue-100 to-indigo-100 text-sm font-bold text-indigo-700 shadow-xs`}>
      {initials}
    </div>
  );
};

const getImageUrlFromMedia = (mediaItem: unknown): string | null => {
  if (typeof mediaItem === 'string') {
    return mediaItem;
  }
  if (!mediaItem || typeof mediaItem !== 'object') {
    return null;
  }
  const record = mediaItem as Record<string, unknown>;
  for (const key of ['url', 'mediaUrl', 'imageUrl', 'avatarUrl', 'thumbnailUrl']) {
    if (typeof record[key] === 'string' && (record[key] as string).length > 0) {
      return record[key] as string;
    }
  }
  return null;
};

export default function SnakeCatchingRequestsManagementPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<SnakeCatchingRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<SnakeCatchingRequestItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'rescuer' | 'missions' | 'complaints' | 'feedbacks'>('info');

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [mainTab, setMainTab] = useState<'all' | 'complaints'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const openDetail = async (item: SnakeCatchingRequestItem) => {
    setSelectedItem(item);
    setActiveTab('info');
    setDetailLoading(true);
    setDetailError(null);

    try {
      const detail = await snakeCatchingRequestApi.getRequest(item.id);
      setSelectedItem(detail as SnakeCatchingRequestItem);
    } catch (error) {
      console.error('Failed to load snake catching request detail', error);
      const message = getApiErrorMessage(error, 'Không thể tải chi tiết yêu cầu bắt rắn.');
      setDetailError(message);
      showToast(message, { type: 'error' });
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setListError(null);
      try {
        const data = await api.get<SnakeCatchingRequestItem[]>('/snakecatching/requests');
        if (cancelled) {
          return;
        }
        const basicItems = Array.isArray(data) ? data : [];
        const itemsWithDetails = await Promise.all(
          basicItems.map(async (item) => {
            try {
              return await snakeCatchingRequestApi.getRequest(item.id) as SnakeCatchingRequestItem;
            } catch {
              return item;
            }
          }),
        );
        if (cancelled) {
          return;
        }
        setItems(itemsWithDetails);
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = getApiErrorMessage(error, 'Không thể tải danh sách yêu cầu bắt rắn.');
        setListError(message);
        showToast(message, { type: 'error' });
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (mainTab === 'complaints') {
      result = result.filter(item =>
        (item.status === 'Completed' && item.missions?.some(m => m.status === 'MissionUncompleted'))
        || (item.status === 'Cancelled' && !!item.cancellationReason),
      );
    }
    if (statusFilter !== 'All') {
      result = result.filter(item => item.status === statusFilter);
    }
    const normalized = keyword.trim().toLowerCase();
    if (normalized) {
      result = result.filter((item) => {
        const searchable = [
          formatShortId(item.id),
          item.user?.account?.fullName,
          item.address,
        ].filter(Boolean).join(' ').toLowerCase();
        return searchable.includes(normalized);
      });
    }
    return result;
  }, [items, keyword, statusFilter, mainTab]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedItems = useMemo(
    () => filteredItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredItems, safePage],
  );

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter, mainTab]);

  const hasUncompletedMission = selectedItem?.missions?.some(m => m.status === 'MissionUncompleted') ?? false;
  const hasComplaintTab = hasUncompletedMission || (selectedItem?.status === 'Cancelled' && !!selectedItem?.cancellationReason);

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50/50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Quản lý Yêu cầu Bắt rắn</h2>
            <p className="mt-2 text-sm text-slate-500">
              Quản lý và theo dõi tiến độ các yêu cầu bắt rắn từ người dân.
            </p>
          </div>
        </header>

        <div className="border-b border-slate-200">
          <nav className="-mb-px flex gap-6" aria-label="Main Tabs">
            <button
              onClick={() => setMainTab('all')}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                mainTab === 'all'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              Tất cả yêu cầu
            </button>
            <button
              onClick={() => setMainTab('complaints')}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                mainTab === 'complaints'
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              Báo cáo cần xác minh
            </button>
          </nav>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="Tìm theo mã đơn, người gửi, địa chỉ..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          <div className="relative w-full sm:w-64">
            <Filter className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Pending">Đang chờ</option>
              <option value="Confirmed">Đã xác nhận</option>
              <option value="Assigned">Đã phân công</option>
              <option value="Completed">Hoàn thành</option>
              <option value="Cancelled">Đã hủy</option>
            </select>
          </div>
        </div>

        <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${mainTab === 'complaints' ? 'bg-slate-50/30' : ''}`}>
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Loader2 className="mb-3 size-6 animate-spin text-indigo-500" />
              <span className="font-medium">Đang tải dữ liệu...</span>
            </div>
          )}

          {!isLoading && listError && (
            <div className="flex flex-col items-center justify-center py-16 text-rose-600">
              <AlertCircle className="mb-2 size-8 text-rose-500" />
              <span>{listError}</span>
            </div>
          )}

          {!isLoading && !listError && filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <SearchX className="mb-3 size-8 text-slate-400" />
              <span className="font-medium">Không tìm thấy yêu cầu phù hợp</span>
            </div>
          )}

          {!isLoading && !listError && filteredItems.length > 0 && mainTab === 'complaints' && (
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedItems.map((item) => {
                const uncompletedMissions = item.missions?.filter(m => m.status === 'MissionUncompleted') || [];
                const reason = item.status === 'Cancelled' ? item.cancellationReason : uncompletedMissions[0]?.cancellationReason || uncompletedMissions[0]?.notes;
                const label = item.status === 'Cancelled' ? 'Lý do huỷ' : 'Lý do';

                return (
                  <div
                    key={item.id}
                    onClick={() => void openDetail(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        void openDetail(item);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-rose-200 bg-white shadow-sm transition-all hover:border-rose-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between border-b border-rose-100 bg-rose-50/50 p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-rose-700">{formatShortId(item.id)}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'Cancelled' ? 'bg-slate-200 text-slate-700' : 'bg-rose-200 text-rose-800'}`}>
                        {item.status === 'Cancelled' ? <Ban className="size-3" /> : <AlertTriangle className="size-3" />}
                        {item.status === 'Cancelled' ? 'Đã huỷ' : 'Nhiệm vụ không đạt kết quả'}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-4 flex items-center gap-3">
                        {renderAvatar(item.user?.account?.avatarUrl, item.user?.account?.fullName, 'size-8')}
                        <span className="truncate font-medium text-slate-700">{item.user?.account?.fullName || 'Khách'}</span>
                      </div>
                      <div className="mt-auto">
                        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-rose-600">{label}</p>
                        <div className="line-clamp-3 rounded-lg border border-rose-50 bg-rose-50/30 p-3 text-sm text-slate-700">
                          {reason || 'Không có lý do chi tiết'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && !listError && filteredItems.length > 0 && mainTab !== 'complaints' && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Mã đơn</th>
                    <th className="px-6 py-4 font-semibold">Người gửi</th>
                    <th className="px-6 py-4 font-semibold">Khu vực</th>
                    <th className="px-6 py-4 font-semibold">Trạng thái</th>
                    <th className="px-6 py-4 font-semibold">Ưu tiên</th>
                    <th className="px-6 py-4 font-semibold">Thời điểm tạo</th>
                    <th className="px-6 py-4 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedItems.map((item) => {
                    const statusConf = getStatusConfig(item.status);
                    return (
                      <tr key={item.id} className="group transition-colors hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold tracking-wide text-indigo-700">
                          {formatShortId(item.id)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {renderAvatar(item.user?.account?.avatarUrl, item.user?.account?.fullName, 'size-8')}
                            <span className="font-medium text-slate-900">{item.user?.account?.fullName ?? '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-600">
                            <MapPin className="size-3.5 text-slate-400" />
                            <span className="max-w-[200px] truncate" title={item.address ?? ''}>{item.address ?? '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusConf.class}`}>
                            {statusConf.icon}
                            {statusConf.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getPriorityClass(item.priority)}`}>
                            {getPriorityLabel(item.priority)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {formatDateTime(item.requestDate ?? null)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => void openDetail(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            <Eye className="size-4" />
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && filteredItems.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-600">
              <p>
                Trang
                {' '}
                <span className="font-semibold text-slate-900">{safePage}</span>
                {' / '}
                <span className="font-semibold text-slate-900">{totalPages}</span>
                {' • Tổng '}
                <span className="font-semibold text-slate-900">{filteredItems.length}</span>
                {' yêu cầu'}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safePage === 1}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
                >
                  «
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce<Array<number | '...'>>((
                    acc,
                    p,
                    idx,
                    arr,
                  ) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                      acc.push('...');
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === '...'
                      ? <span key={`ellipsis-${idx}`} className="px-1 text-slate-400">...</span>
                      : (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setCurrentPage(p as number)}
                            className={`min-w-[32px] rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                              p === safePage
                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {p}
                          </button>
                        ),
                  )}
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
                >
                  Sau
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safePage === totalPages}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </section>

        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-all">
            <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    <ShieldAlert className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Chi tiết Đơn
                      {' '}
                      {formatShortId(selectedItem.id)}
                    </h3>
                    <div className="mt-1 flex items-center gap-3 text-xs">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${getStatusConfig(selectedItem.status).class.replace('border', '')}`}>
                        {getStatusConfig(selectedItem.status).label}
                      </span>
                      <span className="text-slate-500">{formatDateTime(selectedItem.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItem(null);
                    setDetailError(null);
                  }}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="border-b border-slate-200 bg-white px-6">
                <nav className="-mb-px flex gap-6" aria-label="Tabs">
                  {[
                    { id: 'info', label: 'Thông tin chung', icon: FileText },
                    { id: 'rescuer', label: 'Cứu hộ viên', icon: User },
                    { id: 'missions', label: 'Nhiệm vụ', icon: TargetIcon },
                    ...(hasComplaintTab ? [{ id: 'complaints', label: 'Vấn đề', icon: AlertTriangle }] : []),
                    ...(selectedItem.feedbacks && selectedItem.feedbacks.length > 0
                      ? [{ id: 'feedbacks', label: `Đánh giá (${selectedItem.feedbacks.length})`, icon: Star }]
                      : []),
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`inline-flex items-center gap-2 border-b-2 py-4 text-sm font-medium transition-colors ${
                          isActive
                            ? tab.id === 'complaints'
                              ? 'border-rose-500 text-rose-600'
                              : tab.id === 'feedbacks'
                                ? 'border-amber-500 text-amber-600'
                                : 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                        }`}
                      >
                        <Icon className="size-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                {detailLoading && (
                  <div className="flex h-40 flex-col items-center justify-center gap-3 text-slate-500">
                    <Loader2 className="size-8 animate-spin text-indigo-500" />
                    <p className="text-sm font-medium">Đang tải dữ liệu chi tiết...</p>
                  </div>
                )}

                {detailError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 flex items-center gap-3">
                    <AlertCircle className="size-5" />
                    <p className="font-medium">{detailError}</p>
                  </div>
                )}

                {!detailLoading && !detailError && selectedItem && (
                  <div className="duration-300">

                    {/* TAB: THÔNG TIN CHUNG */}
                    {activeTab === 'info' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                          {/* Người báo cáo */}
                          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                              <User className="size-4 text-indigo-500" />
                              Người Báo Cáo
                            </h4>
                            <div className="flex items-start gap-4">
                              {renderAvatar(selectedItem.user?.account?.avatarUrl, selectedItem.user?.account?.fullName, 'size-14')}
                              <div className="space-y-1">
                                <p className="text-lg font-bold text-slate-900">{selectedItem.user?.account?.fullName ?? 'Khách'}</p>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <Phone className="size-3.5" />
                                  <span>{selectedItem.user?.phoneNumber ?? '-'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <FileText className="size-3.5" />
                                  <span>{selectedItem.user?.email ?? selectedItem.user?.account?.email ?? '-'}</span>
                                </div>
                              </div>
                            </div>
                            {selectedItem.user?.emergencyContacts && selectedItem.user.emergencyContacts.length > 0 && (
                              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
                                <span className="font-semibold text-slate-700">Liên hệ khẩn cấp: </span>
                                <span className="text-slate-600">{selectedItem.user.emergencyContacts.join(', ')}</span>
                              </div>
                            )}
                          </div>

                          {/* Thông tin sự cố */}
                          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                              <AlertCircle className="size-4 text-rose-500" />
                              Chi tiết sự cố
                            </h4>
                            <div className="space-y-3">
                              <div className="flex gap-3 text-sm">
                                <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />
                                <div>
                                  <p className="font-semibold text-slate-900">Địa chỉ</p>
                                  <p className="text-slate-600">{selectedItem.address ?? '-'}</p>
                                </div>
                              </div>
                              <div className="flex gap-3 text-sm">
                                <Calendar className="mt-0.5 size-4 shrink-0 text-slate-400" />
                                <div>
                                  <p className="font-semibold text-slate-900">Thời gian yêu cầu</p>
                                  <p className="text-slate-600">{formatDateTime(selectedItem.preferredTime ?? selectedItem.requestDate)}</p>
                                </div>
                              </div>
                              <div className="flex gap-3 text-sm">
                                <Info className="mt-0.5 size-4 shrink-0 text-slate-400" />
                                <div>
                                  <p className="font-semibold text-slate-900">Thông tin bổ sung</p>
                                  <p className="text-slate-600">{selectedItem.additionalDetails || selectedItem.notes || 'Không có ghi chú thêm.'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Rắn & Hình ảnh */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                              <ShieldAlert className="size-4 text-amber-500" />
                              Thông tin Rắn
                            </h4>
                            {selectedItem.details && selectedItem.details.length > 0
                              ? (
                                  <div className="space-y-3">
                                    {selectedItem.details.map((detail, idx) => (
                                      <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                                        <div>
                                          <p className="font-bold text-slate-900">{detail.snakeSpeciesName ?? 'Chưa rõ loài'}</p>
                                          {detail.snakeSpeciesScientificName && (
                                            <p className="text-xs italic text-slate-500">{detail.snakeSpeciesScientificName}</p>
                                          )}
                                        </div>
                                        <div className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-white font-bold text-indigo-700 shadow-sm">
                                          x
                                          {detail.quantity ?? 1}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )
                              : (
                                  <p className="text-sm italic text-slate-500">Chưa có thông tin định danh loài rắn.</p>
                                )}
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                              <Camera className="size-4 text-emerald-500" />
                              Hình ảnh đính kèm
                            </h4>
                            {selectedItem.media && selectedItem.media.length > 0
                              ? (
                                  <div className="grid grid-cols-3 gap-3">
                                    {selectedItem.media.map((mediaItem, idx) => {
                                      const url = getImageUrlFromMedia(mediaItem);
                                      return url
                                        ? (
                                            <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                              <img src={url} alt="Media" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                            </div>
                                          )
                                        : null;
                                    })}
                                  </div>
                                )
                              : (
                                  <div className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
                                    <Camera className="mb-2 size-6" />
                                    <span className="text-sm">Không có hình ảnh</span>
                                  </div>
                                )}
                          </div>
                        </div>

                        <AdminTransactionCard referenceId={selectedItem.id} />
                      </div>
                    )}

                    {/* TAB: CỨU HỘ VIÊN */}
                    {activeTab === 'rescuer' && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        {selectedItem.assignedRescuer
                          ? (
                              <div className="flex flex-col gap-8 md:flex-row">
                                <div className="flex flex-col items-center space-y-4 md:w-1/3">
                                  {renderAvatar(selectedItem.assignedRescuer.account?.avatarUrl, selectedItem.assignedRescuer.account?.fullName, 'size-32 border-4')}
                                  <div className="text-center">
                                    <h4 className="text-xl font-bold text-slate-900">{selectedItem.assignedRescuer.account?.fullName ?? 'Cứu hộ viên'}</h4>
                                    <div className="mt-2 flex items-center justify-center gap-2">
                                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${selectedItem.assignedRescuer.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                        <div className={`size-2 rounded-full ${selectedItem.assignedRescuer.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                        {selectedItem.assignedRescuer.isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                                      </span>
                                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${selectedItem.assignedRescuer.isAvailable ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {selectedItem.assignedRescuer.isAvailable ? 'Sẵn sàng' : 'Đang bận'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2">
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500">Số điện thoại</p>
                                    <p className="font-semibold text-slate-900">{selectedItem.assignedRescuer.phoneNumber ?? '-'}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500">Email</p>
                                    <p className="font-semibold text-slate-900">{selectedItem.assignedRescuer.account?.email ?? '-'}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500">Đánh giá</p>
                                    <div className="flex items-center gap-1 font-semibold text-slate-900">
                                      <span className="text-amber-500">★</span>
                                      {selectedItem.assignedRescuer.rating ?? '0.0'}
                                      <span className="text-sm font-normal text-slate-500">
                                        (
                                        {selectedItem.assignedRescuer.ratingCount ?? 0}
                                        {' '}
                                        lượt)
                                      </span>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500">Kinh nghiệm</p>
                                    <p className="font-semibold text-slate-900">
                                      {selectedItem.assignedRescuer.completedMissions ?? 0}
                                      {' '}
                                      /
                                      {selectedItem.assignedRescuer.totalMissions ?? 0}
                                      {' '}
                                      nhiệm vụ hoàn thành
                                    </p>
                                  </div>
                                  <div className="space-y-1 sm:col-span-2">
                                    <p className="text-sm font-medium text-slate-500">Cập nhật vị trí gần nhất</p>
                                    <p className="font-semibold text-slate-900">{formatDateTime(selectedItem.assignedRescuer.lastLocationUpdate)}</p>
                                  </div>
                                </div>
                              </div>
                            )
                          : (
                              <div className="flex h-64 flex-col items-center justify-center text-slate-500">
                                <User className="mb-4 size-12 text-slate-300" />
                                <p className="text-lg font-medium text-slate-600">Chưa phân công cứu hộ viên</p>
                                <p className="mt-1 text-sm">Yêu cầu này hiện đang chờ được tiếp nhận.</p>
                              </div>
                            )}
                      </div>
                    )}

                    {/* TAB: NHIỆM VỤ */}
                    {activeTab === 'missions' && (
                      <div className="space-y-4">
                        {selectedItem.missions && selectedItem.missions.length > 0
                          ? (
                              selectedItem.missions.map((mission: SnakeCatchingMissionInfo, idx: number) => {
                                const stConfig = getMissionStatusConfig(mission.status);
                                return (
                                  <div key={mission.id || idx} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 p-4">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                                          {idx + 1}
                                        </div>
                                        <h5 className="font-bold text-slate-900">Lượt nhiệm vụ</h5>
                                      </div>
                                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${stConfig.class}`}>
                                        {stConfig.label}
                                      </span>
                                    </div>
                                    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                                      <div className="space-y-4">
                                        <div>
                                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thời gian</p>
                                          <ul className="mt-2 space-y-2 text-sm">
                                            <li className="flex justify-between border-b border-slate-100 pb-1">
                                              <span className="text-slate-600">Bắt đầu:</span>
                                              <span className="font-medium text-slate-900">{formatDateTime(mission.startedAt)}</span>
                                            </li>
                                            <li className="flex justify-between border-b border-slate-100 pb-1">
                                              <span className="text-slate-600">Đến nơi:</span>
                                              <span className="font-medium text-slate-900">{formatDateTime(mission.arrivedAt)}</span>
                                            </li>
                                            <li className="flex justify-between pb-1">
                                              <span className="text-slate-600">Kết thúc:</span>
                                              <span className="font-medium text-slate-900">{formatDateTime(mission.completedAt)}</span>
                                            </li>
                                          </ul>
                                        </div>
                                      </div>
                                      <div className="space-y-4">
                                        <div>
                                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chi phí</p>
                                          <div className="mt-2 rounded-xl bg-slate-50 p-3">
                                            <p className="text-sm text-slate-600">
                                              Dự kiến:
                                              <span className="font-semibold text-slate-900">{mission.estimatedCost ? `${mission.estimatedCost.toLocaleString()}đ` : '-'}</span>
                                            </p>
                                            <p className="mt-1 text-sm text-slate-600">
                                              Thực tế:
                                              <span className="font-semibold text-emerald-600">{mission.actualCost ? `${mission.actualCost.toLocaleString()}đ` : mission.price ? `${mission.price.toLocaleString()}đ` : '-'}</span>
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="space-y-4">
                                        <div>
                                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ghi chú</p>
                                          <p className="mt-2 text-sm text-slate-700 bg-slate-50 p-3 rounded-xl">
                                            {mission.notes || mission.cancellationReason || 'Không có ghi chú.'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )
                          : (
                              <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
                                <p className="text-slate-500">Chưa có dữ liệu nhiệm vụ.</p>
                              </div>
                            )}
                      </div>
                    )}

                    {/* TAB: KHIẾU NẠI */}
                    {activeTab === 'complaints' && (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                          <Ban className="size-8 text-rose-600" />
                        </div>
                        <h4 className="mt-4 text-xl font-bold text-slate-900">Thông tin Vấn đề / Khiếu nại</h4>
                        <p className="mx-auto mb-6 mt-2 max-w-lg text-slate-600">
                          Dưới đây là thông tin chi tiết về các lý do khiến nhiệm vụ không thể hoàn thành hoặc yêu cầu bị huỷ bỏ.
                        </p>

                        <div className="mx-auto max-w-2xl space-y-4 text-left">
                          {selectedItem.status === 'Cancelled' && selectedItem.cancellationReason && (
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                              <p className="mb-2 font-semibold text-slate-700">Lý do huỷ yêu cầu:</p>
                              <p className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
                                {selectedItem.cancellationReason}
                              </p>
                              <div className="mt-3 flex justify-end border-t border-slate-50 pt-3 text-xs text-slate-500">
                                <span>Trạng thái: Đã huỷ</span>
                              </div>
                            </div>
                          )}

                          {selectedItem.missions?.filter((m: SnakeCatchingMissionInfo) => m.status === 'MissionUncompleted').map((m: SnakeCatchingMissionInfo, idx: number) => (
                            <div key={idx} className="rounded-xl border border-rose-100 bg-white p-4 shadow-sm">
                              <p className="mb-2 font-semibold text-rose-700">Lý do báo cáo / nhiệm vụ không hoàn thành:</p>
                              <p className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-slate-700">
                                {m.cancellationReason || m.notes || 'Không có lý do cụ thể được ghi nhận.'}
                              </p>
                              <div className="mt-3 flex justify-between border-t border-rose-50 pt-3 text-xs text-slate-500">
                                <span>
                                  Mã NV:
                                  {m.id ? formatShortId(m.id) : '-'}
                                </span>
                                <span>
                                  Cập nhật lúc:
                                  {formatDateTime(m.completedAt)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* ẢNH KHIẾU NẠI */}
                        {selectedItem.media && selectedItem.media.some((m: any) => m.purpose === 'Evidence') && (
                          <div className="mx-auto mt-6 max-w-2xl text-left">
                            <h5 className="mb-3 font-semibold text-rose-700">Hình ảnh bằng chứng:</h5>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                              {selectedItem.media.filter((m: any) => m.purpose === 'Evidence').map((mediaItem: any, idx: number) => {
                                const url = getImageUrlFromMedia(mediaItem);
                                return url
                                  ? (
                                      <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-rose-100 bg-white shadow-sm">
                                        <img src={url} alt="Evidence" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                      </div>
                                    )
                                  : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB: ĐÁNH GIÁ */}
                    {activeTab === 'feedbacks' && (
                      <div className="space-y-4">
                        {selectedItem.feedbacks && selectedItem.feedbacks.length > 0
                          ? (
                              <>
                                {/* Summary bar */}
                                <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <Star className="size-5 text-amber-400" />
                                    <span className="text-2xl font-bold text-slate-900">
                                      {(selectedItem.feedbacks.reduce((acc, f) => acc + f.rating, 0) / selectedItem.feedbacks.length).toFixed(1)}
                                    </span>
                                    <span className="text-sm text-slate-500">
                                      / 5 •
                                      {selectedItem.feedbacks.length}
                                      {' '}
                                      lượt đánh giá
                                    </span>
                                  </div>
                                  {selectedItem.feedbacks.some(f => f.rating <= 3) && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                      <ThumbsDown className="size-3.5" />
                                      {selectedItem.feedbacks.filter(f => f.rating <= 3).length}
                                      {' '}
                                      đánh giá thấp
                                    </span>
                                  )}
                                </div>

                                {/* Feedback cards */}
                                {selectedItem.feedbacks.map((feedback) => {
                                  const isLow = feedback.rating <= 3;
                                  return (
                                    <div
                                      key={feedback.id}
                                      className={`overflow-hidden rounded-2xl border shadow-sm ${
                                        isLow
                                          ? 'border-amber-200 bg-amber-50/40'
                                          : 'border-slate-200 bg-white'
                                      }`}
                                    >
                                      <div className={`flex items-center justify-between px-5 py-3 ${
                                        isLow ? 'bg-amber-100/60' : 'bg-slate-50'
                                      }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          {isLow && <ThumbsDown className="size-4 text-amber-600" />}
                                          <span className="text-sm font-semibold text-slate-800">
                                            {feedback.raterName ?? 'Người dùng'}
                                          </span>
                                          <span className="text-xs text-slate-500">
                                            →
                                            {feedback.targetUserName ?? '-'}
                                          </span>
                                        </div>
                                        {/* Star rating */}
                                        <div className="flex items-center gap-1">
                                          {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                              key={i}
                                              className={`size-4 ${
                                                i < feedback.rating
                                                  ? isLow ? 'fill-amber-500 text-amber-500' : 'fill-amber-400 text-amber-400'
                                                  : 'text-slate-200'
                                              }`}
                                            />
                                          ))}
                                          <span className={`ml-1 text-sm font-bold ${
                                            isLow ? 'text-amber-700' : 'text-slate-700'
                                          }`}
                                          >
                                            {feedback.rating}
                                            /5
                                          </span>
                                        </div>
                                      </div>
                                      <div className="px-5 py-4">
                                        {feedback.comments
                                          ? (
                                              <div className="flex gap-3">
                                                <MessageSquare className="mt-0.5 size-4 shrink-0 text-slate-400" />
                                                <p className="text-sm leading-relaxed text-slate-700">{feedback.comments}</p>
                                              </div>
                                            )
                                          : (
                                              <p className="text-sm italic text-slate-400">Không có nhận xét.</p>
                                            )}
                                        <p className="mt-3 text-xs text-slate-400">{formatDateTime(feedback.createdAt)}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </>
                            )
                          : (
                              <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white">
                                <Star className="size-8 text-slate-300" />
                                <p className="text-slate-500">Chưa có đánh giá nào.</p>
                              </div>
                            )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
