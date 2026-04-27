'use client';
/* eslint-disable react/no-array-index-key */

import type {
  AdminConsultationDetailResponse,
  AdminConsultationItem,
  AdminConsultationType,
} from '@/types/admin-consultation.type';
import { AlertCircle, AlertTriangle, Ban, Calendar, CheckCircle2, Clock, Eye, FileText, Filter, Info, Loader2, Search, SearchX, Stethoscope, User, Video, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { adminConsultationApi } from '@/apis/admin-consultation.api';
import { ApiClientError } from '@/apis/client';
import AdminTransactionCard from '@/components/admin/AdminTransactionCard';
import { useToast } from '@/components/ToastProvider';

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

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return '-';
  }
  return `${value.toLocaleString('vi-VN')} đ`;
};

const formatShortId = (id: string | null | undefined) => {
  if (!id) {
    return '-';
  }
  const cleanId = id.replace(/-/g, '');
  return `CONS-${cleanId.slice(-6).toUpperCase()}`;
};

const formatReportSnippet = (value: string | null | undefined, maxLength = 140) => {
  const content = value?.trim() ?? '';
  if (!content) {
    return 'Chưa có báo cáo';
  }
  if (content.length <= maxLength) {
    return content;
  }
  return `${content.slice(0, maxLength)}...`;
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

const renderAvatar = (fullName: string | null | undefined, size = 'size-10', colorType: 'user' | 'expert' = 'user') => {
  const initials = (fullName ?? 'NA').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('');
  const colors = colorType === 'expert'
    ? 'from-teal-100 to-emerald-100 text-teal-700'
    : 'from-blue-100 to-indigo-100 text-indigo-700';

  return (
    <div className={`inline-flex ${size} shrink-0 items-center justify-center rounded-full border-2 border-white bg-linear-to-br ${colors} text-sm font-bold shadow-xs`}>
      {initials}
    </div>
  );
};

const TYPE_OPTIONS: Array<{ label: string; value: AdminConsultationType | '' }> = [
  { label: 'Tất cả loại', value: '' },
  { label: 'Lịch hẹn', value: 'Scheduled' },
  { label: 'Khẩn cấp', value: 'Emergency' },
];

const STATUS_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Tất cả trạng thái', value: '' },
  { label: 'Đã lên lịch', value: 'Scheduled' },
  { label: 'Đang diễn ra', value: 'Ongoing' },
  { label: 'Hoàn thành', value: 'Completed' },
  { label: 'Đã hủy', value: 'Cancelled' },
  { label: 'Người dùng vắng mặt', value: 'UserAbsent' },
  { label: 'Chuyên gia vắng mặt', value: 'ExpertAbsent' },
  { label: 'Cả hai vắng mặt', value: 'AllAbsent' },
];

const getStatusConfig = (status: string | null | undefined) => {
  switch (status) {
    case 'Scheduled':
      return { class: 'bg-sky-100 text-sky-700 border-sky-200', label: 'Đã lên lịch', icon: <Calendar className="size-3.5" /> };
    case 'Ongoing':
      return { class: 'bg-indigo-100 text-indigo-700 border-indigo-200', label: 'Đang diễn ra', icon: <Video className="size-3.5" /> };
    case 'Completed':
      return { class: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Hoàn thành', icon: <CheckCircle2 className="size-3.5" /> };
    case 'Cancelled':
      return { class: 'bg-slate-200 text-slate-700 border-slate-300', label: 'Đã hủy', icon: <X className="size-3.5" /> };
    case 'UserAbsent':
    case 'ExpertAbsent':
      return { class: 'bg-amber-100 text-amber-700 border-amber-200', label: status === 'UserAbsent' ? 'Khách vắng' : 'Chuyên gia vắng', icon: <AlertTriangle className="size-3.5" /> };
    case 'AllAbsent':
      return { class: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Cả 2 vắng mặt', icon: <Ban className="size-3.5" /> };
    case 'Pending':
      return { class: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Đang chờ', icon: <Clock className="size-3.5" /> };
    case 'AcceptedByExpert':
      return { class: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Chuyên gia đã nhận', icon: <CheckCircle2 className="size-3.5" /> };
    case 'CancelledByExpert':
      return { class: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Chuyên gia đã hủy', icon: <X className="size-3.5" /> };
    case 'CancelledByCustomer':
      return { class: 'bg-slate-200 text-slate-700 border-slate-300', label: 'Khách hàng đã hủy', icon: <X className="size-3.5" /> };
    case 'RejectedByExpert':
      return { class: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Chuyên gia từ chối', icon: <Ban className="size-3.5" /> };
    case 'Expired':
      return { class: 'bg-slate-200 text-slate-600 border-slate-300', label: 'Đã hết hạn', icon: <Clock className="size-3.5" /> };
    case 'NoExpertAvailable':
      return { class: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Không có chuyên gia', icon: <AlertCircle className="size-3.5" /> };
    default:
      return { class: 'bg-slate-100 text-slate-700 border-slate-200', label: status ?? '-', icon: <AlertCircle className="size-3.5" /> };
  }
};

const getTypeConfig = (type: AdminConsultationType | null | undefined) => {
  switch (type) {
    case 'Emergency':
      return { class: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Khẩn cấp' };
    case 'Scheduled':
      return { class: 'bg-violet-100 text-violet-700 border-violet-200', label: 'Lịch hẹn' };
    default:
      return { class: 'bg-slate-100 text-slate-700 border-slate-200', label: type ?? '-' };
  }
};

const buildPageItems = (current: number, total: number): Array<number | '...'> => {
  if (total <= 1) {
    return [1];
  }
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, '...', total];
  }
  if (current >= total - 2) {
    return [1, '...', total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
};

export default function ConsultationsManagementPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<AdminConsultationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<AdminConsultationDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [incidentItems, setIncidentItems] = useState<AdminConsultationItem[]>([]);

  const [typeFilter, setTypeFilter] = useState<AdminConsultationType | ''>('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const canPrev = pageNumber > 1;
  const canNext = pageNumber < totalPages;
  const pageItems = useMemo(() => buildPageItems(pageNumber, totalPages), [pageNumber, totalPages]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setListError(null);
      try {
        const response = await adminConsultationApi.getPaged({
          pageNumber,
          pageSize,
          type: typeFilter || undefined,
          status: statusFilter || undefined,
        });
        if (cancelled) {
          return;
        }
        setItems(response.items ?? []);
        setTotalPages(response.meta?.total_pages ?? 1);
        setTotalItems(response.meta?.total_items ?? 0);
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = getApiErrorMessage(error, 'Không thể tải danh sách tư vấn.');
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
  }, [pageNumber, pageSize, statusFilter, showToast, typeFilter]);

  useEffect(() => {
    let cancelled = false;
    const loadIncidents = async () => {
      try {
        const response = await adminConsultationApi.getPaged({
          pageNumber: 1,
          pageSize: 8,
          status: 'ExpertAbsent',
        });
        if (cancelled) {
          return;
        }
        const withReport = (response.items ?? []).filter(item => (item.customerReport?.trim() ?? '').length > 0);
        setIncidentItems(withReport);
      } catch {
        if (cancelled) {
          return;
        }
        setIncidentItems([]);
      }
    };
    void loadIncidents();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchKeyword.trim()) {
      return items;
    }
    const kw = searchKeyword.trim().toLowerCase();
    return items.filter(i =>
      i.userName?.toLowerCase().includes(kw)
      || i.expertName?.toLowerCase().includes(kw)
      || i.consultationId.toLowerCase().includes(kw)
      || i.bookingId?.toLowerCase().includes(kw),
    );
  }, [items, searchKeyword]);

  const openDetail = async (consultationId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    setSelectedItem(null);
    try {
      const detail = await adminConsultationApi.getDetail(consultationId);
      setSelectedItem(detail);
    } catch (error) {
      const message = getApiErrorMessage(error, 'Không thể tải chi tiết phiên tư vấn.');
      setDetailError(message);
      showToast(message, { type: 'error' });
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50/50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Quản lý Phiên tư vấn</h2>
            <p className="mt-2 text-sm text-slate-500">
              Quản lý và theo dõi tiến độ các phiên tư vấn trực tuyến giữa người dân và chuyên gia.
            </p>
          </div>
        </header>

        {incidentItems.length > 0 && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100">
                  <AlertTriangle className="size-4 text-rose-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Sự cố tư vấn (Khách báo chuyên gia vắng mặt)</h3>
              </div>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                {incidentItems.length}
                {' '}
                sự cố gần nhất
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {incidentItems.map(item => (
                <div key={`incident-${item.consultationId}`} className="group relative overflow-hidden rounded-xl border border-rose-100 bg-white p-4 shadow-sm transition-all hover:shadow-md">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-bold text-rose-700">{formatShortId(item.consultationId)}</span>
                    <button
                      type="button"
                      onClick={() => void openDetail(item.consultationId)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                    >
                      Xem ngay &rarr;
                    </button>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2">{formatReportSnippet(item.customerReport)}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="size-3.5" />
                    <span>
                      Gửi lúc:
                      {formatDateTime(item.customerReportSubmittedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                placeholder="Tìm kiếm ID, tên..."
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as AdminConsultationType | '');
                  setPageNumber(1);
                }}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              >
                {TYPE_OPTIONS.map(option => (
                  <option key={option.label} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPageNumber(1);
                }}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageNumber(1);
                }}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              >
                {[10, 20, 50].map(size => (
                  <option key={size} value={size}>
                    Hiển thị
                    {size}
                    {' '}
                    dòng
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-semibold">Mã phiên</th>
                  <th className="px-6 py-4 font-semibold">Loại</th>
                  <th className="px-6 py-4 font-semibold">Trạng thái</th>
                  <th className="px-6 py-4 font-semibold">Khách hàng</th>
                  <th className="px-6 py-4 font-semibold">Chuyên gia</th>
                  <th className="px-6 py-4 font-semibold">Thời gian hẹn</th>
                  <th className="px-6 py-4 font-semibold">Giá</th>
                  <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-slate-500">
                      <div className="inline-flex flex-col items-center gap-3">
                        <Loader2 className="size-6 animate-spin text-indigo-500" />
                        <span className="font-medium">Đang tải dữ liệu...</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading && listError && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-rose-600">
                      <div className="inline-flex flex-col items-center gap-2">
                        <AlertCircle className="size-8 text-rose-500" />
                        <span>{listError}</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading && !listError && filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-slate-500">
                      <div className="inline-flex flex-col items-center gap-3">
                        <SearchX className="size-8 text-slate-400" />
                        <span className="font-medium">Không tìm thấy phiên tư vấn phù hợp</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading && !listError && filteredItems.map((item) => {
                  const statusConf = getStatusConfig(item.status);
                  const typeConf = getTypeConfig(item.type);
                  return (
                    <tr key={item.consultationId} className="group transition-colors hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold tracking-wide text-indigo-700">
                        {formatShortId(item.consultationId)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${typeConf.class}`}>
                          {typeConf.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusConf.class}`}>
                          {statusConf.icon}
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {renderAvatar(item.userName, 'size-8', 'user')}
                          <span className="font-medium text-slate-900">{item.userName ?? '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {renderAvatar(item.expertName, 'size-8', 'expert')}
                          <span className="font-medium text-slate-900">{item.expertName ?? '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDateTime(item.startTime)}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => void openDetail(item.consultationId)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200"
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

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-4 text-sm text-slate-600">
            <p>
              Hiển thị trang
              {' '}
              <span className="font-semibold text-slate-900">{pageNumber}</span>
              {' '}
              /
              {' '}
              {Math.max(totalPages, 1)}
              {' '}
              (Tổng
              {' '}
              {totalItems}
              {' '}
              phiên)
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => canPrev && setPageNumber(p => p - 1)}
                disabled={!canPrev}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Trước
              </button>
              {pageItems.map((pi, idx) => (
                pi === '...'
                  ? (
                      <span key={`ell-${idx}`} className="px-2 text-slate-400">...</span>
                    )
                  : (
                      <button
                        key={pi}
                        type="button"
                        onClick={() => setPageNumber(pi)}
                        className={`rounded-lg px-3 py-1.5 font-medium shadow-sm transition-colors ${
                          pi === pageNumber
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 border-transparent'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pi}
                      </button>
                    )
              ))}
              <button
                type="button"
                onClick={() => canNext && setPageNumber(p => p + 1)}
                disabled={!canNext}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </section>

        {(selectedItem || detailLoading || detailError) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-all">
            <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    <Stethoscope className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Chi tiết Phiên
                      {' '}
                      {selectedItem ? formatShortId(selectedItem.consultationId) : '...'}
                    </h3>
                    {selectedItem && (
                      <div className="mt-1 flex items-center gap-3 text-xs">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${getStatusConfig(selectedItem.status).class.replace('border', '')}`}>
                          {getStatusConfig(selectedItem.status).label}
                        </span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 font-medium ${getTypeConfig(selectedItem.type).class.replace('border', '')}`}>
                          {getTypeConfig(selectedItem.type).label}
                        </span>
                      </div>
                    )}
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
                  <div className="space-y-6">

                    {/* KHÁCH HÀNG & CHUYÊN GIA */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                          <User className="size-4 text-indigo-500" />
                          Khách hàng
                        </h4>
                        <div className="flex items-center gap-4">
                          {renderAvatar(selectedItem.userName, 'size-12', 'user')}
                          <div>
                            <p className="text-lg font-bold text-slate-900">{selectedItem.userName ?? 'Chưa rõ'}</p>
                            <p className="text-sm text-slate-500 mt-0.5">Không cung cấp liên hệ</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                          <Stethoscope className="size-4 text-teal-500" />
                          Chuyên gia
                        </h4>
                        <div className="flex items-center gap-4">
                          {renderAvatar(selectedItem.expertName, 'size-12', 'expert')}
                          <div>
                            <p className="text-lg font-bold text-slate-900">{selectedItem.expertName ?? 'Chưa rõ'}</p>
                            <p className="text-sm text-slate-500 mt-0.5">Phụ trách tư vấn</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* THÔNG TIN CHUNG CỦA PHIÊN */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                        <Info className="size-4 text-blue-500" />
                        Chi tiết phiên làm việc
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                          <p className="text-xs font-semibold text-slate-500 uppercase">Phí dịch vụ</p>
                          <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(selectedItem.price)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                          <p className="text-xs font-semibold text-slate-500 uppercase">Bắt đầu</p>
                          <p className="mt-1 font-semibold text-slate-900">{formatDateTime(selectedItem.startTime)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                          <p className="text-xs font-semibold text-slate-500 uppercase">Kết thúc</p>
                          <p className="mt-1 font-semibold text-slate-900">{formatDateTime(selectedItem.endTime)}</p>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
                          <p className="text-xs font-semibold text-slate-500 uppercase">Mô tả vấn đề</p>
                          <p className="mt-1 text-slate-700">{selectedItem.problemDescription || 'Không có mô tả chi tiết.'}</p>
                        </div>
                      </div>
                    </div>

                    {/* THÔNG TIN LỊCH HẸN / KHẨN CẤP */}
                    {selectedItem.type === 'Scheduled' && (
                      <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
                        <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-violet-600">
                          <Calendar className="size-4" />
                          Thông tin Đặt lịch
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500 mb-1">Thời điểm đặt</p>
                            <p className="font-semibold text-slate-900">{formatDateTime(selectedItem.bookedAt)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 mb-1">Hạn thanh toán</p>
                            <p className="font-semibold text-slate-900">{formatDateTime(selectedItem.paymentDeadline)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 mb-1">Thời gian Slot</p>
                            <p className="font-semibold text-slate-900">
                              {formatDateTime(selectedItem.slotStartTime).split(' ')[1]}
                              {' '}
                              -
                              {formatDateTime(selectedItem.slotEndTime).split(' ')[1]}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 mb-1">Trạng thái booking</p>
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700 border border-slate-200">
                              {getStatusConfig(selectedItem.bookingStatus).label}
                            </span>
                          </div>
                        </div>
                        {(selectedItem.cancelledAt || selectedItem.cancellationReason) && (
                          <div className="mt-4 border-t border-violet-100 pt-4 text-sm">
                            <span className="text-rose-600 font-semibold mr-2">
                              Đã hủy lúc
                              {formatDateTime(selectedItem.cancelledAt)}
                              :
                            </span>
                            <span className="text-slate-700">
                              {selectedItem.cancellationReason
                                ? (getStatusConfig(selectedItem.cancellationReason).label !== selectedItem.cancellationReason && getStatusConfig(selectedItem.cancellationReason).label !== '-')
                                    ? getStatusConfig(selectedItem.cancellationReason).label
                                    : selectedItem.cancellationReason
                                : 'Không rõ lý do'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedItem.type === 'Emergency' && (
                      <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
                        <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-rose-600">
                          <AlertTriangle className="size-4" />
                          Yêu cầu Khẩn cấp
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500 mb-1">Trạng thái yêu cầu</p>
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700 border border-slate-200">
                              {getStatusConfig(selectedItem.emergencyRequestStatus).label}
                            </span>
                          </div>
                          <div>
                            <p className="text-slate-500 mb-1">Gửi yêu cầu lúc</p>
                            <p className="font-semibold text-slate-900">{formatDateTime(selectedItem.requestedAt)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 mb-1">Hết hạn lúc</p>
                            <p className="font-semibold text-slate-900">{formatDateTime(selectedItem.expiresAt)}</p>
                          </div>
                        </div>
                        {selectedItem.respondedAt && (
                          <div className="mt-4 border-t border-rose-100 pt-4 text-sm">
                            <span className="text-emerald-600 font-semibold mr-2">Chuyên gia phản hồi lúc:</span>
                            <span className="font-semibold text-slate-900">{formatDateTime(selectedItem.respondedAt)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* BÁO CÁO VẮNG MẶT TỪ KHÁCH HÀNG */}
                    {selectedItem.customerReport && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                        <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-600">
                          <Ban className="size-4" />
                          Báo cáo vắng mặt từ khách hàng
                        </h4>
                        <div className="rounded-xl bg-white p-4 border border-amber-100 shadow-xs">
                          <p className="text-slate-700 italic">
                            "
                            {selectedItem.customerReport}
                            "
                          </p>
                          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500 border-t border-amber-50 pt-3">
                            <Clock className="size-3.5" />
                            Thời điểm gửi:
                            {' '}
                            {formatDateTime(selectedItem.customerReportSubmittedAt)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* HIỂN THỊ TRANSACTIONS (Ưu tiên Booking ID cho Scheduled) */}
                    {(selectedItem.bookingId || selectedItem.emergencyRequestId || selectedItem.consultationId) && (
                      <AdminTransactionCard referenceId={selectedItem.bookingId ?? selectedItem.emergencyRequestId ?? selectedItem.consultationId} />
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
