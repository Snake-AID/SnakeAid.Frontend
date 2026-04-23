'use client';

import type {
  AIRecognitionAdminReportMediaListItemResponse,
  MediaPurpose,
  MediaReferenceType,
  RecognitionStatus,
} from '@/types/ai-recognition.type';
import type { PaginationMeta } from '@/types/api-response';
import { Download, Loader2, SearchX, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { aiRecognitionApi } from '@/apis/ai-recognition.api';
import { ApiClientError } from '@/apis/client';
import DatasetExportModal from '@/components/admin/DatasetExportModal';
import { useToast } from '@/components/ToastProvider';

const DEFAULT_PAGINATION: PaginationMeta = {
  total_pages: 1,
  total_items: 0,
  current_page: 1,
  page_size: 20,
};

const STATUS_OPTIONS: Array<{ value: RecognitionStatus | ''; label: string }> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'Processing', label: 'Đang xử lý' },
  { value: 'Completed', label: 'Hoàn tất' },
  { value: 'Failed', label: 'Thất bại' },
  { value: 'ExpertVerified', label: 'Expert đã xác nhận' },
  { value: 'ExpertRejected', label: 'Expert đã từ chối' },
];

const REFERENCE_TYPE_OPTIONS: Array<{ value: MediaReferenceType | ''; label: string }> = [
  { value: '', label: 'Tất cả loại nguồn' },
  { value: 'CommunityReport', label: 'Báo cáo cộng đồng' },
  { value: 'SnakebiteIncident', label: 'Sự cố rắn cắn' },
  { value: 'RescueMission', label: 'Nhiệm vụ cứu hộ' },
  { value: 'SnakeCatchingRequest', label: 'Yêu cầu bắt rắn' },
  { value: 'SnakeCatchingMission', label: 'Nhiệm vụ bắt rắn' },
];

const STATUS_LABEL_MAP: Record<string, string> = {
  Processing: 'Đang xử lý',
  Completed: 'Hoàn tất',
  Failed: 'Thất bại',
  ExpertVerified: 'Expert đã xác nhận',
  ExpertRejected: 'Expert đã từ chối',
};

const REFERENCE_TYPE_LABEL_MAP: Record<string, string> = {
  CommunityReport: 'Báo cáo cộng đồng',
  SnakebiteIncident: 'Sự cố rắn cắn',
  RescueMission: 'Nhiệm vụ cứu hộ',
  SnakeCatchingRequest: 'Yêu cầu bắt rắn',
  SnakeCatchingMission: 'Nhiệm vụ bắt rắn',
};

const PURPOSE_LABEL_MAP: Record<string, string> = {
  Evidence: 'Bằng chứng',
  SnakeIdentification: 'Nhận diện rắn',
  LocationProof: 'Xác thực vị trí',
  InjuryPhoto: 'Ảnh vết thương',
  BeforeAfter: 'Trước/Sau',
  SnakeOthers: 'Ảnh rắn khác',
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

const formatConfidence = (value: number) => `${(value * 100).toFixed(2)}%`;

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

const getStatusLabel = (status: string) => STATUS_LABEL_MAP[status] ?? status;

const getReferenceTypeLabel = (referenceType: MediaReferenceType | string) => {
  return REFERENCE_TYPE_LABEL_MAP[String(referenceType)] ?? String(referenceType);
};

const getPurposeLabel = (purpose: MediaPurpose | string) => {
  return PURPOSE_LABEL_MAP[String(purpose)] ?? String(purpose);
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'Processing':
      return 'bg-amber-100 text-amber-700';
    case 'Completed':
      return 'bg-emerald-100 text-emerald-700';
    case 'Failed':
      return 'bg-rose-100 text-rose-700';
    case 'ExpertVerified':
      return 'bg-blue-100 text-blue-700';
    case 'ExpertRejected':
      return 'bg-fuchsia-100 text-fuchsia-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const getConfidenceBadgeClass = (confidence: number) => {
  if (confidence >= 0.9) {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (confidence >= 0.7) {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-rose-100 text-rose-700';
};

const isImageMedia = (contentType: string | null | undefined) => {
  return String(contentType ?? '').toLowerCase().startsWith('image/');
};

const formatIdWithPrefix = (id: string | null | undefined, prefix: string) => {
  if (!id) {
    return '-';
  }
  const cleanId = id.replace(/-/g, '');
  return `${prefix}-${cleanId.slice(-6).toUpperCase()}`;
};

const formatReferenceId = (id: string | null | undefined, type: string) => {
  if (!id) {
    return '-';
  }
  switch (type) {
    case 'CommunityReport': return formatIdWithPrefix(id, 'REP');
    case 'SnakebiteIncident': return formatIdWithPrefix(id, 'INC');
    case 'RescueMission':
    case 'SnakeCatchingMission': return formatIdWithPrefix(id, 'MIS');
    case 'SnakeCatchingRequest': return formatIdWithPrefix(id, 'CAR');
    default: return formatIdWithPrefix(id, 'REF');
  }
};

const getExpertReviewState = (item: AIRecognitionAdminReportMediaListItemResponse) => {
  if (item.needsExpertReview) {
    return {
      label: 'Cần expert review',
      className: 'bg-amber-100 text-amber-700',
    };
  }

  const reviewedByExpert = Boolean(
    item.expertVerifiedAt
    || item.expertReviewerName
    || item.expertCorrectedSpecies
    || item.expertNotes
    || item.status === 'ExpertVerified'
    || item.status === 'ExpertRejected',
  );

  if (reviewedByExpert) {
    return {
      label: 'Đã được expert review',
      className: 'bg-emerald-100 text-emerald-700',
    };
  }

  return {
    label: 'Không cần expert review',
    className: 'bg-slate-200 text-slate-700',
  };
};

export default function AdminAIRecognitionPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<AIRecognitionAdminReportMediaListItemResponse[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<AIRecognitionAdminReportMediaListItemResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);

  const [status, setStatus] = useState<RecognitionStatus | ''>('');
  const [referenceType, setReferenceType] = useState<MediaReferenceType | ''>('');
  const [minConfidenceInput, setMinConfidenceInput] = useState('');
  const [maxConfidenceInput, setMaxConfidenceInput] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const minConfidence = useMemo(() => {
    if (!minConfidenceInput.trim()) {
      return undefined;
    }

    const value = Number(minConfidenceInput);
    if (Number.isNaN(value)) {
      return undefined;
    }

    return Math.max(0, Math.min(1, value));
  }, [minConfidenceInput]);

  const maxConfidence = useMemo(() => {
    if (!maxConfidenceInput.trim()) {
      return undefined;
    }

    const value = Number(maxConfidenceInput);
    if (Number.isNaN(value)) {
      return undefined;
    }

    return Math.max(0, Math.min(1, value));
  }, [maxConfidenceInput]);

  useEffect(() => {
    let cancelled = false;

    const loadList = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await aiRecognitionApi.getAdminList({
          page,
          pageSize,
          status: status || undefined,
          minConfidence,
          maxConfidence,
          referenceType: referenceType || undefined,
          from: toIso(fromDate),
          to: toIso(toDate),
        });

        if (cancelled) {
          return;
        }

        setItems(response.items);
        setMeta(response.meta);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        console.error('Failed to load AI recognition list', loadError);
        setItems([]);
        const message = getApiErrorMessage(loadError, 'Không thể tải danh sách AI nhận diện.');
        setError(message);
        showToast(message, { type: 'error' });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadList();

    return () => {
      cancelled = true;
    };
  }, [fromDate, maxConfidence, minConfidence, page, pageSize, referenceType, showToast, status, toDate]);

  const canPrev = page > 1;
  const canNext = page < meta.total_pages;
  const pageItems = useMemo(() => buildPageItems(meta.current_page, meta.total_pages), [meta.current_page, meta.total_pages]);
  const detailReviewState = selectedItem ? getExpertReviewState(selectedItem) : null;
  const detailSnakeName = selectedItem?.expertCorrectedSpecies?.commonName
    || selectedItem?.detectedSpecies?.commonName
    || 'Chưa xác định';

  const openDetail = async (recognitionResultId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    setSelectedItem(null);

    try {
      const detail = await aiRecognitionApi.getAdminDetail(recognitionResultId);
      setSelectedItem(detail);
    } catch (detailLoadError) {
      console.error('Failed to load AI recognition detail', detailLoadError);
      const message = getApiErrorMessage(detailLoadError, 'Không thể tải chi tiết AI nhận diện.');
      setDetailError(message);
      showToast(message, { type: 'error' });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setSelectedItem(null);
    setDetailError(null);
    setDetailLoading(false);
  };

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-360 flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Tổng hợp nhận diện ảnh báo cáo rắn</h2>
              <p className="mt-1 text-sm text-slate-500">
                Tổng hợp dữ liệu nhận diện AI từ nhiều nguồn để admin kiểm tra và đối soát nhanh.
              </p>
            </div>
            <button
              onClick={() => setIsDatasetModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow"
            >
              <Download className="size-4" />
              Tải xuống Dataset
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4 lg:grid-cols-9">
            <div className="lg:col-span-2">
              <p className="mb-1 text-xs font-semibold text-slate-700">Trạng thái</p>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as RecognitionStatus | '');
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value || 'all-status'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <p className="mb-1 text-xs font-semibold text-slate-700">Nguồn</p>
              <select
                value={referenceType}
                onChange={(event) => {
                  setReferenceType(event.target.value as MediaReferenceType | '');
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              >
                {REFERENCE_TYPE_OPTIONS.map(option => (
                  <option key={option.value || 'all-reference'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold text-slate-700">Min confidence</p>
              <input
                type="number"
                min={0}
                max={1}
                step="0.01"
                value={minConfidenceInput}
                onChange={(event) => {
                  setMinConfidenceInput(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold text-slate-700">Max confidence</p>
              <input
                type="number"
                min={0}
                max={1}
                step="0.01"
                value={maxConfidenceInput}
                onChange={(event) => {
                  setMaxConfidenceInput(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold text-slate-700">Từ ngày</p>
              <input
                type="datetime-local"
                value={fromDate}
                onChange={(event) => {
                  setFromDate(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold text-slate-700">Đến ngày</p>
              <input
                type="datetime-local"
                value={toDate}
                onChange={(event) => {
                  setToDate(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold text-slate-700">Số dòng / trang</p>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
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
          {error && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-2">Id</th>
                  <th className="border-b border-slate-200 px-3 py-2">Nguồn</th>
                  <th className="border-b border-slate-200 px-3 py-2">Hình ảnh</th>
                  <th className="border-b border-slate-200 px-3 py-2">Độ tin cậy</th>
                  <th className="border-b border-slate-200 px-3 py-2">Loài được AI nhận diện</th>
                  <th className="border-b border-slate-200 px-3 py-2">Loài chuyên gia xác định</th>
                  <th className="border-b border-slate-200 px-3 py-2">Trạng thái</th>
                  <th className="border-b border-slate-200 px-3 py-2">Tạo lúc</th>
                  <th className="border-b border-slate-200 px-3 py-2">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={10} className="px-3 py-10 text-center text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Đang tải...
                      </span>
                    </td>
                  </tr>
                )}

                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-3 py-10 text-center text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <SearchX className="size-4" />
                        Không có dữ liệu
                      </span>
                    </td>
                  </tr>
                )}

                {!loading && items.map(item => (
                  <tr
                    key={item.recognitionResultId}
                    className="odd:bg-slate-50/50 hover:bg-sky-50"
                  >
                    <td className="border-b border-slate-100 px-3 py-2 font-mono text-sm font-bold tracking-[0.1em] text-indigo-700" title={item.recognitionResultId}>
                      {formatIdWithPrefix(item.recognitionResultId, 'AIR')}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2">{getReferenceTypeLabel(item.referenceType)}</td>
                    <td className="border-b border-slate-100 px-3 py-2">
                      <div className="flex items-center gap-2">
                        {isImageMedia(item.contentType) && (
                          <img
                            src={item.mediaUrl}
                            alt="Media preview"
                            className="size-12 rounded-lg border border-slate-200 object-cover"
                          />
                        )}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getConfidenceBadgeClass(item.confidence)}`}>
                        {formatConfidence(item.confidence)}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2">{item.detectedSpecies?.commonName || '-'}</td>
                    <td className="border-b border-slate-100 px-3 py-2">{item.expertCorrectedSpecies?.commonName || '-'}</td>
                    <td className="border-b border-slate-100 px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClass(String(item.status))}`}>
                        {getStatusLabel(String(item.status))}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2 whitespace-nowrap text-slate-600">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => void openDetail(item.recognitionResultId)}
                        className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        Xem chi tiết
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
              {meta.current_page}
              /
              {meta.total_pages}
              {' '}
              • Tổng
              {' '}
              {meta.total_items}
              {' '}
              bản ghi
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => canPrev && setPage(prev => prev - 1)}
                disabled={!canPrev}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
              >
                Trước
              </button>
              {pageItems.map((pageItem, index, allPages) => (
                pageItem === '...'
                  ? (
                      <span
                        key={`ellipsis-${String(allPages[index - 1])}-${String(allPages[index + 1])}`}
                        className="px-1 text-slate-400"
                      >
                        ...
                      </span>
                    )
                  : (
                      <button
                        key={pageItem}
                        type="button"
                        onClick={() => setPage(pageItem)}
                        className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold ${pageItem === meta.current_page ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                      >
                        {pageItem}
                      </button>
                    )
              ))}
              <button
                type="button"
                onClick={() => canNext && setPage(prev => prev + 1)}
                disabled={!canNext}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        </section>
      </div>

      {(detailLoading || selectedItem || detailError) && (
        <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Đóng chi tiết AI recognition"
            className="absolute inset-0 bg-slate-900/45"
            onClick={closeDetailModal}
          />
          <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Chi tiết báo cáo rắn</h3>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                onClick={closeDetailModal}
              >
                <X className="size-4" />
              </button>
            </div>

            {detailLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="size-4 animate-spin" />
                Đang tải chi tiết...
              </div>
            )}

            {!detailLoading && detailError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {detailError}
              </div>
            )}

            {!detailLoading && selectedItem && detailReviewState && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-emerald-200 bg-linear-to-r from-emerald-50 via-teal-50 to-cyan-50 p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(String(selectedItem.status))}`}>
                      {getStatusLabel(String(selectedItem.status))}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getConfidenceBadgeClass(selectedItem.confidence)}`}>
                      Độ tin cậy:
                      {' '}
                      {formatConfidence(selectedItem.confidence)}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${detailReviewState.className}`}>
                      {detailReviewState.label}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_1fr]">
                    <div className="rounded-lg bg-white/65 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">Mã nhận diện</p>
                      <p className="mt-1 font-mono text-2xl font-black tracking-[0.2em] text-slate-900">{formatIdWithPrefix(selectedItem.recognitionResultId, 'AIR')}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-1">
                      <p className="rounded-lg border border-emerald-200/60 bg-white/80 px-3 py-2 text-sm">
                        <span className="font-semibold">Tạo lúc:</span>
                        {' '}
                        {formatDateTime(selectedItem.createdAt)}
                      </p>
                      <p className="rounded-lg border border-emerald-200/60 bg-white/80 px-3 py-2 text-sm">
                        <span className="font-semibold">Cập nhật lúc:</span>
                        {' '}
                        {formatDateTime(selectedItem.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-sky-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Nguồn và media</p>
                    <a href={selectedItem.mediaUrl} target="_blank" rel="noreferrer" className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100">
                      Mở ảnh gốc
                    </a>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
                    <div className="rounded-2xl border border-sky-100 bg-linear-to-br from-sky-50 via-cyan-50 to-white p-3">
                      {isImageMedia(selectedItem.contentType)
                        ? (
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-inner">
                              <img src={selectedItem.mediaUrl} alt="AI recognition media" className="h-96 w-full rounded-lg object-contain bg-slate-100" />
                            </div>
                          )
                        : (
                            <div className="flex h-96 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                              Media hiện tại không phải định dạng ảnh
                            </div>
                          )}

                      <div className="mt-3 rounded-xl border border-sky-200 bg-white px-3 py-3 text-center">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">Tên loài rắn</p>
                        <p className="mt-1 text-lg font-extrabold text-slate-800">{detailSnakeName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {selectedItem.expertCorrectedSpecies?.commonName ? 'Theo expert review' : 'Theo AI nhận diện'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-sky-100 bg-linear-to-b from-white to-sky-50/70 p-3">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Thông tin nguồn</p>
                      <div className="space-y-2.5">
                        <p className="rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm">
                          <span className="font-semibold">Nguồn:</span>
                          {' '}
                          {getReferenceTypeLabel(selectedItem.referenceType)}
                        </p>
                        <p className="rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm">
                          <span className="font-semibold">Mục đích:</span>
                          {' '}
                          {getPurposeLabel(selectedItem.purpose)}
                        </p>
                        <p className="rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm">
                          <span className="font-semibold">AI model:</span>
                          {' '}
                          #
                          {selectedItem.aiModelId}
                        </p>
                        <p className="rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm">
                          <span className="font-semibold">Nguồn liên kết:</span>
                          {' '}
                          <span className="font-bold text-indigo-700">{formatReferenceId(selectedItem.referenceId, selectedItem.referenceType)}</span>
                        </p>
                        <p className="rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm">
                          <span className="font-semibold">Mã ảnh:</span>
                          {' '}
                          <span className="font-bold text-indigo-700">{formatIdWithPrefix(selectedItem.reportMediaId, 'MED')}</span>
                        </p>
                        <p className="rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm">
                          <span className="font-semibold">Loại tệp:</span>
                          {' '}
                          {selectedItem.contentType}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-indigo-200 bg-linear-to-br from-indigo-50 via-white to-fuchsia-50 p-4 shadow-sm">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-600">Kết quả nhận diện AI và expert</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-stretch">
                    <div className="rounded-xl border border-indigo-200 bg-white p-4 shadow-xs">
                      <p className="mb-3 text-base font-extrabold text-indigo-500">Kết quả AI nhận diện</p>
                      <div className="space-y-3">
                        <p className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-sm">
                          <span className="font-semibold">YOLO class:</span>
                          {' '}
                          {selectedItem.yoloClassName || '-'}
                        </p>
                        <div className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                          <p className="text-sm">
                            <span className="font-semibold">Confidence:</span>
                            {' '}
                            {formatConfidence(selectedItem.confidence)}
                          </p>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className={`h-full rounded-full ${selectedItem.confidence >= 0.9 ? 'bg-emerald-500' : selectedItem.confidence >= 0.7 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.max(0, Math.min(100, selectedItem.confidence * 100))}%` }} />
                          </div>
                        </div>
                        <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2 text-sm">
                          <span className="font-semibold">Loài AI nhận diện:</span>
                          {' '}
                          {selectedItem.detectedSpecies?.commonName || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-fuchsia-200 bg-white p-4 shadow-xs">
                      <p className="mb-3 text-base font-extrabold text-fuchsia-500">Kết quả expert review</p>
                      <div className="space-y-3">
                        <p className="rounded-lg border border-fuchsia-100 bg-fuchsia-50/60 px-3 py-2 text-sm">
                          <span className="font-semibold">Loài expert xác nhận:</span>
                          {' '}
                          {selectedItem.expertCorrectedSpecies?.commonName || '-'}
                        </p>
                        <p className="rounded-lg border border-fuchsia-100 bg-white px-3 py-2 text-sm">
                          <span className="font-semibold">Người xác nhận:</span>
                          {' '}
                          {selectedItem.expertReviewerName || 'Chưa có'}
                        </p>
                        <p className="rounded-lg border border-fuchsia-100 bg-white px-3 py-2 text-sm">
                          <span className="font-semibold">Xác nhận lúc:</span>
                          {' '}
                          {formatDateTime(selectedItem.expertVerifiedAt)}
                        </p>
                        <p className="rounded-lg border border-fuchsia-100 bg-white px-3 py-2 text-sm">
                          <span className="font-semibold">Trạng thái review:</span>
                          {' '}
                          {detailReviewState.label}
                        </p>
                        <p className="rounded-lg border border-fuchsia-100 bg-white px-3 py-2 text-sm">
                          <span className="font-semibold">Ghi chú expert:</span>
                          {' '}
                          {selectedItem.expertNotes || 'Chưa có ghi chú'}
                        </p>
                        {!selectedItem.expertVerifiedAt && !selectedItem.expertReviewerName && !selectedItem.expertCorrectedSpecies && (
                          <div className="rounded-lg border border-dashed border-fuchsia-200 bg-fuchsia-50/50 px-3 py-2 text-sm text-slate-600">
                            Chưa có thao tác review từ chuyên gia ở bản ghi này.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isDatasetModalOpen && <DatasetExportModal onClose={() => setIsDatasetModalOpen(false)} />}
    </main>
  );
}
