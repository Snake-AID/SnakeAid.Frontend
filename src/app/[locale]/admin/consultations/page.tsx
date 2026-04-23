'use client';

import type {
  AdminConsultationDetailResponse,
  AdminConsultationItem,
  AdminConsultationType,
} from '@/types/admin-consultation.type';
import { Eye, Loader2, SearchX, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { adminConsultationApi } from '@/apis/admin-consultation.api';
import { ApiClientError } from '@/apis/client';
import { useToast } from '@/components/ToastProvider';

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
    return '-';
  }

  return `${value.toLocaleString('vi-VN')} VND`;
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

const formatReportSnippet = (value: string | null | undefined, maxLength = 140) => {
  const content = value?.trim() ?? '';
  if (!content) {
    return 'Chưa có nội dung báo cáo.';
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
    return validationEntries
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join(' | ');
  }

  return fallback;
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

const getConsultationStatusLabel = (status: string | null | undefined) => {
  switch (status) {
    case 'Scheduled':
      return 'Đã lên lịch';
    case 'Ongoing':
      return 'Đang diễn ra';
    case 'Completed':
      return 'Hoàn thành';
    case 'Cancelled':
      return 'Đã hủy';
    case 'UserAbsent':
      return 'Người dùng vắng mặt';
    case 'ExpertAbsent':
      return 'Chuyên gia vắng mặt';
    case 'AllAbsent':
      return 'Cả hai vắng mặt';
    default:
      return status ?? '-';
  }
};

const getConsultationTypeLabel = (type: AdminConsultationType | null | undefined) => {
  switch (type) {
    case 'Scheduled':
      return 'Lịch hẹn';
    case 'Emergency':
      return 'Khẩn cấp';
    default:
      return type ?? '-';
  }
};

const getConsultationStatusClass = (status: string | null | undefined) => {
  switch (status) {
    case 'Scheduled':
      return 'bg-sky-100 text-sky-700';
    case 'Ongoing':
      return 'bg-indigo-100 text-indigo-700';
    case 'Completed':
      return 'bg-emerald-100 text-emerald-700';
    case 'Cancelled':
    case 'AllAbsent':
      return 'bg-rose-100 text-rose-700';
    case 'UserAbsent':
    case 'ExpertAbsent':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const getConsultationTypeClass = (type: AdminConsultationType | null | undefined) => {
  switch (type) {
    case 'Emergency':
      return 'bg-rose-100 text-rose-700';
    case 'Scheduled':
      return 'bg-violet-100 text-violet-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const buildPageItems = (current: number, total: number): Array<number | '...'> => {
  if (total <= 1) {
    return [1];
  }

  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
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

        console.error('Failed to load consultations', error);
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
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error('Failed to load consultation incidents', error);
        setIncidentItems([]);
      }
    };

    void loadIncidents();

    return () => {
      cancelled = true;
    };
  }, []);

  const openDetail = async (consultationId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    setSelectedItem(null);

    try {
      const detail = await adminConsultationApi.getDetail(consultationId);
      setSelectedItem(detail);
    } catch (error) {
      console.error('Failed to load consultation detail', error);
      const message = getApiErrorMessage(error, 'Không thể tải chi tiết phiên tư vấn.');
      setDetailError(message);
      showToast(message, { type: 'error' });
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-360 flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <h2 className="text-3xl font-bold text-slate-900">Quản lý phiên tư vấn</h2>
          <p className="mt-1 text-sm text-slate-500">
            Danh sách hiển thị trường cần thiết. Bấm nút Chi tiết ở từng dòng để xem đầy đủ thông tin phiên tư vấn.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-700">Loại tư vấn</p>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as AdminConsultationType | '');
                  setPageNumber(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              >
                {TYPE_OPTIONS.map(option => (
                  <option key={option.label} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold text-slate-700">Trạng thái</p>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPageNumber(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold text-slate-700">Số dòng/trang</p>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageNumber(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              >
                {[10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {incidentItems.length > 0 && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">Sự cố tư vấn (Khách báo chuyên gia vắng mặt)</h3>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                  {incidentItems.length}
                  {' '}
                  sự cố gần nhất
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {incidentItems.map(item => (
                  <div key={`incident-${item.consultationId}`} className="rounded-lg border border-amber-100 bg-white px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-500">
                        Mã phiên:
                        {formatShortId(item.consultationId)}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          void openDetail(item.consultationId);
                        }}
                        className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{formatReportSnippet(item.customerReport)}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Gửi lúc:
                      {' '}
                      {formatDateTime(item.customerReportSubmittedAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mã phiên</th>
                  <th className="px-4 py-3 font-semibold">Loại</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Người dùng</th>
                  <th className="px-4 py-3 font-semibold">Chuyên gia</th>
                  <th className="px-4 py-3 font-semibold">Bắt đầu</th>
                  <th className="px-4 py-3 font-semibold">Giá</th>
                  <th className="px-4 py-3 text-left font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Đang tải dữ liệu...
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading && listError && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-rose-600">{listError}</td>
                  </tr>
                )}

                {!isLoading && !listError && items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <SearchX className="size-4" />
                        Không có phiên tư vấn phù hợp.
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading && !listError && items.map(item => (
                  <tr key={item.consultationId} className="border-t border-slate-100 hover:bg-blue-50/40">
                    <td className="px-4 py-3 font-medium text-slate-800">{formatShortId(item.consultationId)}</td>
                    <td className="px-4 py-3 text-slate-700">{getConsultationTypeLabel(item.type)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getConsultationStatusClass(item.status)}`}>
                        {getConsultationStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.userName ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{item.expertName ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDateTime(item.startTime)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(item.price)}</td>
                    <td className="px-4 py-3 text-left">
                      <button
                        type="button"
                        onClick={() => {
                          void openDetail(item.consultationId);
                        }}
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
              {pageNumber}
              /
              {Math.max(totalPages, 1)}
              {' '}
              • Tổng
              {' '}
              {totalItems}
              {' '}
              phiên tư vấn
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => canPrev && setPageNumber(prev => prev - 1)}
                disabled={!canPrev}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
              >
                Trước
              </button>
              {pageItems.map((pageItem, index, allPages) => (
                pageItem === '...'
                  ? (
                      <span
                        key={`consultation-ellipsis-${String(allPages[index - 1])}-${String(allPages[index + 1])}`}
                        className="px-1 text-slate-400"
                      >
                        ...
                      </span>
                    )
                  : (
                      <button
                        key={pageItem}
                        type="button"
                        onClick={() => setPageNumber(pageItem)}
                        className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold ${pageItem === pageNumber ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                      >
                        {pageItem}
                      </button>
                    )
              ))}
              <button
                type="button"
                onClick={() => canNext && setPageNumber(prev => prev + 1)}
                disabled={!canNext}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        </section>

        {(selectedItem || detailLoading || detailError) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px]">
            <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-slate-100 shadow-2xl">
              <div className="flex items-center justify-between rounded-t-2xl border-b border-slate-200 bg-white px-5 py-4">
                <h3 className="text-lg font-bold text-slate-900">Chi tiết phiên tư vấn</h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItem(null);
                    setDetailError(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  aria-label="Đóng"
                >
                  <X className="size-4" />
                  Đóng
                </button>
              </div>

              <div className="max-h-[75vh] space-y-5 overflow-y-auto p-5 text-sm text-slate-700">
                {detailLoading && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Đang tải chi tiết từ endpoint...
                    </span>
                  </div>
                )}

                {detailError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
                    {detailError}
                  </div>
                )}

                {selectedItem && (
                  <>
                    <div className="rounded-2xl border border-emerald-200 bg-linear-to-r from-emerald-50 via-teal-50 to-cyan-50 p-5 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getConsultationStatusClass(selectedItem.status)}`}>
                          {getConsultationStatusLabel(selectedItem.status)}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getConsultationTypeClass(selectedItem.type)}`}>
                          {getConsultationTypeLabel(selectedItem.type)}
                        </span>
                      </div>
                      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Mã phiên tư vấn</p>
                      <p className="mt-1 font-mono text-2xl font-black tracking-[0.18em] text-slate-900">{formatShortId(selectedItem.consultationId)}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Id đầy đủ:
                        <span className="font-mono">{selectedItem.consultationId}</span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 shadow-sm">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Thông tin phiên tư vấn</p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                          <span className="font-semibold">Người dùng:</span>
                          {' '}
                          {selectedItem.userName ?? '-'}
                        </p>
                        <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                          <span className="font-semibold">Chuyên gia:</span>
                          {' '}
                          {selectedItem.expertName ?? '-'}
                        </p>
                        <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                          <span className="font-semibold">Bắt đầu:</span>
                          {' '}
                          {formatDateTime(selectedItem.startTime)}
                        </p>
                        <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                          <span className="font-semibold">Kết thúc:</span>
                          {' '}
                          {formatDateTime(selectedItem.endTime)}
                        </p>
                        <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                          <span className="font-semibold">Giá:</span>
                          {' '}
                          {formatCurrency(selectedItem.price)}
                        </p>
                        <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                          <span className="font-semibold">Phòng:</span>
                          {' '}
                          {selectedItem.roomId ?? '-'}
                        </p>
                        <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                          <span className="font-semibold">Mô tả vấn đề:</span>
                          {' '}
                          {selectedItem.problemDescription ?? '-'}
                        </p>
                        <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                          <span className="font-semibold">Loại:</span>
                          {' '}
                          {getConsultationTypeLabel(selectedItem.type)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Báo cáo vắng mặt chuyên gia từ khách hàng</p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <p className="rounded-lg border border-amber-100 bg-white px-3 py-2 md:col-span-2">
                          <span className="font-semibold">Nội dung báo cáo:</span>
                          {' '}
                          {selectedItem.customerReport?.trim() || 'Chưa có báo cáo vắng mặt chuyên gia từ khách hàng.'}
                        </p>
                        <p className="rounded-lg border border-amber-100 bg-white px-3 py-2">
                          <span className="font-semibold">Thời điểm gửi báo cáo:</span>
                          {' '}
                          {formatDateTime(selectedItem.customerReportSubmittedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-4 shadow-sm">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Định danh và tham chiếu</p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                          <span className="font-semibold">Mã phiên tư vấn:</span>
                          {' '}
                          {selectedItem.consultationId}
                        </p>
                        <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                          <span className="font-semibold">Mã phòng:</span>
                          {' '}
                          {selectedItem.roomId ?? '-'}
                        </p>
                        <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                          <span className="font-semibold">Mã người dùng:</span>
                          {' '}
                          {selectedItem.userId}
                        </p>
                        <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                          <span className="font-semibold">Mã chuyên gia:</span>
                          {' '}
                          {selectedItem.expertId}
                        </p>
                        <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                          <span className="font-semibold">Mã lịch hẹn:</span>
                          {' '}
                          {selectedItem.bookingId ?? '-'}
                        </p>
                        <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                          <span className="font-semibold">Mã yêu cầu khẩn cấp:</span>
                          {' '}
                          {selectedItem.emergencyRequestId ?? '-'}
                        </p>
                      </div>
                    </div>

                    {selectedItem.type === 'Scheduled' && (
                      <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-4 shadow-sm">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Lịch hẹn</p>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <p className="rounded-lg border border-violet-100 bg-white px-3 py-2">
                            <span className="font-semibold">Trạng thái lịch hẹn:</span>
                            {' '}
                            {getConsultationStatusLabel(selectedItem.bookingStatus)}
                          </p>
                          <p className="rounded-lg border border-violet-100 bg-white px-3 py-2">
                            <span className="font-semibold">Thời điểm đặt lịch:</span>
                            {' '}
                            {formatDateTime(selectedItem.bookedAt)}
                          </p>
                          <p className="rounded-lg border border-violet-100 bg-white px-3 py-2">
                            <span className="font-semibold">Hạn thanh toán:</span>
                            {' '}
                            {formatDateTime(selectedItem.paymentDeadline)}
                          </p>
                          <p className="rounded-lg border border-violet-100 bg-white px-3 py-2">
                            <span className="font-semibold">Thời điểm hủy:</span>
                            {' '}
                            {formatDateTime(selectedItem.cancelledAt)}
                          </p>
                          <p className="rounded-lg border border-violet-100 bg-white px-3 py-2 md:col-span-2">
                            <span className="font-semibold">Lý do hủy:</span>
                            {' '}
                            {selectedItem.cancellationReason ?? '-'}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedItem.type === 'Emergency' && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Khẩn cấp</p>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <p className="rounded-lg border border-amber-100 bg-white px-3 py-2">
                            <span className="font-semibold">Trạng thái yêu cầu khẩn cấp:</span>
                            {' '}
                            {getConsultationStatusLabel(selectedItem.emergencyRequestStatus)}
                          </p>
                          <p className="rounded-lg border border-amber-100 bg-white px-3 py-2">
                            <span className="font-semibold">Thời điểm gửi yêu cầu:</span>
                            {' '}
                            {formatDateTime(selectedItem.requestedAt)}
                          </p>
                          <p className="rounded-lg border border-amber-100 bg-white px-3 py-2">
                            <span className="font-semibold">Thời điểm phản hồi:</span>
                            {' '}
                            {formatDateTime(selectedItem.respondedAt)}
                          </p>
                          <p className="rounded-lg border border-amber-100 bg-white px-3 py-2">
                            <span className="font-semibold">Thời điểm hết hạn:</span>
                            {' '}
                            {formatDateTime(selectedItem.expiresAt)}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 shadow-sm">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Khung giờ và lịch hẹn</p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <p className="rounded-lg border border-teal-100 bg-white px-3 py-2">
                          <span className="font-semibold">Slot bắt đầu:</span>
                          {' '}
                          {formatDateTime(selectedItem.slotStartTime)}
                        </p>
                        <p className="rounded-lg border border-teal-100 bg-white px-3 py-2">
                          <span className="font-semibold">Slot kết thúc:</span>
                          {' '}
                          {formatDateTime(selectedItem.slotEndTime)}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
