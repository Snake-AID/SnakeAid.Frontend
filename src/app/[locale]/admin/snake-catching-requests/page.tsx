'use client';

import type { CreateSnakeCatchingRequestResponse } from '@/types/snakecatching-request.type';
import { Eye, Loader2, SearchX, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api, ApiClientError } from '@/apis/client';
import { snakeCatchingRequestApi } from '@/apis/snake-catching-request.api';
import { useToast } from '@/components/ToastProvider';

type SnakeCatchingRequestItem = CreateSnakeCatchingRequestResponse & {
  priority?: string | null;
  requestDate?: string | null;
  preferredTime?: string | null;
  notes?: string | null;
  details?: Array<{
    id?: string | null;
    snakeCatchingRequestId?: string | null;
    snakeSpeciesId?: number | null;
    quantity?: number | null;
    snakeSpeciesName?: string | null;
    snakeSpeciesScientificName?: string | null;
  }> | null;
  media?: unknown[] | null;
  assignedRescuer?: {
    accountId?: string | null;
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
      id?: string | null;
      email?: string | null;
      fullName?: string | null;
      avatarUrl?: string | null;
      role?: string | null;
      isActive?: boolean | null;
    } | null;
  } | null;
  user?: {
    accountId?: string | null;
    userName?: string | null;
    email?: string | null;
    rating?: number | null;
    ratingCount?: number | null;
    emergencyContacts?: string[] | null;
    hasUnderlyingDisease?: boolean | null;
    account?: {
      id?: string | null;
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

  return date.toLocaleString('vi-VN', { hour12: false });
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

const getStatusClass = (status: string | null | undefined) => {
  switch (status) {
    case 'Pending':
      return 'bg-amber-100 text-amber-700';
    case 'Confirmed':
      return 'bg-blue-100 text-blue-700';
    case 'Assigned':
    case 'Dispatched':
      return 'bg-indigo-100 text-indigo-700';
    case 'Completed':
      return 'bg-emerald-100 text-emerald-700';
    case 'Cancelled':
      return 'bg-slate-200 text-slate-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const getStatusLabel = (status: string | null | undefined) => {
  switch (status) {
    case 'Pending':
      return 'Đang chờ';
    case 'Confirmed':
      return 'Đã xác nhận';
    case 'Assigned':
      return 'Đã phân công';
    case 'Dispatched':
      return 'Đã điều phối';
    case 'Completed':
      return 'Hoàn thành';
    case 'Cancelled':
      return 'Đã hủy';
    default:
      return status ?? '-';
  }
};

const getPriorityClass = (priority: string | null | undefined) => {
  switch (priority) {
    case 'Urgent':
    case 'High':
      return 'bg-rose-100 text-rose-700';
    case 'Normal':
    case 'Medium':
      return 'bg-sky-100 text-sky-700';
    case 'Low':
      return 'bg-slate-200 text-slate-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const getPriorityLabel = (priority: string | null | undefined) => {
  switch (priority) {
    case 'Urgent':
      return 'Khẩn cấp';
    case 'High':
      return 'Cao';
    case 'Normal':
      return 'Bình thường';
    case 'Medium':
      return 'Trung bình';
    case 'Low':
      return 'Thấp';
    default:
      return priority ?? '-';
  }
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

const getInitials = (name: string | null | undefined) => {
  if (!name) {
    return 'NA';
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'NA';
  }

  return parts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
};

const renderAvatar = (avatarUrl: string | null | undefined, fullName: string | null | undefined) => {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={fullName ?? 'Avatar'}
        className="size-12 rounded-full border border-slate-200 object-cover"
      />
    );
  }

  return (
    <div className="inline-flex size-12 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-bold text-slate-600">
      {getInitials(fullName)}
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
  const possibleKeys = ['url', 'mediaUrl', 'imageUrl', 'avatarUrl', 'thumbnailUrl'];

  for (const key of possibleKeys) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
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
  const [keyword, setKeyword] = useState('');

  const openDetail = async (item: SnakeCatchingRequestItem) => {
    setSelectedItem(item);
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

        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error('Failed to load snake catching requests', error);
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
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return items;
    }

    return items.filter((item) => {
      const requesterName = item.user?.account?.fullName ?? '';
      const searchable = [
        item.id,
        requesterName,
        item.address,
        item.status,
        item.priority,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalized);
    });
  }, [items, keyword]);

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-360 flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <h2 className="text-3xl font-bold text-slate-900">Quản lý yêu cầu bắt rắn</h2>
          <p className="mt-1 text-sm text-slate-500">
            Danh sách hiển thị các trường chính. Nhấn vào từng dòng để xem đầy đủ tất cả trường chi tiết.
          </p>

          <div className="mt-4 max-w-xl">
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="Tìm theo mã đơn, người gửi, địa chỉ, trạng thái..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
            />
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mã đơn</th>
                  <th className="px-4 py-3 font-semibold">Người gửi</th>
                  <th className="px-4 py-3 font-semibold">Địa chỉ</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Ưu tiên</th>
                  <th className="px-4 py-3 font-semibold">Thời điểm tạo</th>
                  <th className="px-4 py-3 text-left font-semibold">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Đang tải dữ liệu...
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading && listError && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-rose-600">{listError}</td>
                  </tr>
                )}

                {!isLoading && !listError && filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <SearchX className="size-4" />
                        Không tìm thấy yêu cầu phù hợp.
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading && !listError && filteredItems.map(item => (
                  <tr key={item.id} className="border-t border-slate-100 hover:bg-blue-50/40">
                    <td className="px-4 py-3 font-medium text-slate-800">{formatShortId(item.id)}</td>
                    <td className="px-4 py-3 text-slate-700">{item.user?.account?.fullName ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{item.address ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{getPriorityLabel(item.priority)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDateTime(item.requestDate ?? null)}</td>
                    <td className="px-4 py-3 text-left">
                      <button
                        type="button"
                        onClick={() => {
                          void openDetail(item);
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
        </section>

        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px]">
            <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-slate-100 shadow-2xl">
              <div className="flex items-center justify-between rounded-t-2xl border-b border-slate-200 bg-white px-5 py-4">
                <h3 className="text-lg font-bold text-slate-900">Chi tiết yêu cầu bắt rắn</h3>
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

                <div className="rounded-2xl border border-emerald-200 bg-linear-to-r from-emerald-50 via-teal-50 to-cyan-50 p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(selectedItem.status)}`}>
                      {getStatusLabel(selectedItem.status)}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPriorityClass(selectedItem.priority)}`}>
                      Ưu tiên:
                      {' '}
                      {getPriorityLabel(selectedItem.priority)}
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Mã yêu cầu</p>
                  <p className="mt-1 font-mono text-2xl font-black tracking-[0.18em] text-slate-900">{formatShortId(selectedItem.id)}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Id đầy đủ:
                    <span className="font-mono">{selectedItem.id ?? '-'}</span>
                  </p>
                </div>

                <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 shadow-sm">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Thông tin yêu cầu</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                      <span className="font-semibold">Người gửi:</span>
                      {' '}
                      {selectedItem.user?.account?.fullName ?? '-'}
                    </p>
                    <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                      <span className="font-semibold">Số điện thoại:</span>
                      {' '}
                      {selectedItem.user?.phoneNumber ?? '-'}
                    </p>
                    <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                      <span className="font-semibold">Thời điểm tạo:</span>
                      {' '}
                      {formatDateTime(selectedItem.requestDate ?? null)}
                    </p>
                    <p className="rounded-lg border border-sky-100 bg-white px-3 py-2">
                      <span className="font-semibold">Thời điểm ưu tiên:</span>
                      {' '}
                      {formatDateTime(selectedItem.preferredTime ?? null)}
                    </p>
                    <p className="rounded-lg border border-sky-100 bg-white px-3 py-2 md:col-span-2">
                      <span className="font-semibold">Địa chỉ:</span>
                      {' '}
                      {selectedItem.address ?? '-'}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-4 shadow-sm">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Nội dung bổ sung</p>
                  <div className="grid grid-cols-1 gap-3">
                    <p className="rounded-lg border border-violet-100 bg-white px-3 py-2">
                      <span className="font-semibold">Thông tin thêm:</span>
                      {' '}
                      {selectedItem.additionalDetails ?? '-'}
                    </p>
                    <p className="rounded-lg border border-violet-100 bg-white px-3 py-2">
                      <span className="font-semibold">Ghi chú:</span>
                      {' '}
                      {selectedItem.notes ?? '-'}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-4 shadow-sm">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Thông tin người dùng</p>
                  <div className="mb-3 flex items-center gap-3 rounded-lg border border-cyan-100 bg-white px-3 py-2">
                    {renderAvatar(selectedItem.user?.account?.avatarUrl, selectedItem.user?.account?.fullName)}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{selectedItem.user?.account?.fullName ?? '-'}</p>
                      <p className="truncate text-xs text-slate-500">{selectedItem.user?.phoneNumber ?? '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                      <span className="font-semibold">Mã người dùng:</span>
                      {' '}
                      {selectedItem.userId ?? '-'}
                    </p>
                    <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                      <span className="font-semibold">Mã tài khoản:</span>
                      {' '}
                      {selectedItem.user?.accountId ?? selectedItem.user?.account?.id ?? '-'}
                    </p>
                    <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                      <span className="font-semibold">Tên đăng nhập:</span>
                      {' '}
                      {selectedItem.user?.userName ?? '-'}
                    </p>
                    <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                      <span className="font-semibold">Email:</span>
                      {' '}
                      {selectedItem.user?.email ?? selectedItem.user?.account?.email ?? '-'}
                    </p>
                    <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                      <span className="font-semibold">Vai trò:</span>
                      {' '}
                      {selectedItem.user?.account?.role ?? '-'}
                    </p>
                    <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                      <span className="font-semibold">Đang kích hoạt:</span>
                      {' '}
                      {selectedItem.user?.account?.isActive == null ? '-' : selectedItem.user.account.isActive ? 'Có' : 'Không'}
                    </p>
                    <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                      <span className="font-semibold">Điểm đánh giá:</span>
                      {' '}
                      {selectedItem.user?.rating ?? '-'}
                      {' '}
                      (
                      {selectedItem.user?.ratingCount ?? '-'}
                      {' '}
                      lượt)
                    </p>
                    <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                      <span className="font-semibold">Bệnh nền:</span>
                      {' '}
                      {selectedItem.user?.hasUnderlyingDisease == null ? '-' : selectedItem.user.hasUnderlyingDisease ? 'Có' : 'Không'}
                    </p>
                    <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2 md:col-span-2">
                      <span className="font-semibold">Liên hệ khẩn cấp:</span>
                      {' '}
                      {selectedItem.user?.emergencyContacts?.length ? selectedItem.user.emergencyContacts.join(', ') : '-'}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Vị trí</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <p className="rounded-lg border border-amber-100 bg-white px-3 py-2">
                      <span className="font-semibold">Vĩ độ:</span>
                      {' '}
                      {selectedItem.locationCoordinates?.latitude ?? '-'}
                    </p>
                    <p className="rounded-lg border border-amber-100 bg-white px-3 py-2">
                      <span className="font-semibold">Kinh độ:</span>
                      {' '}
                      {selectedItem.locationCoordinates?.longitude ?? '-'}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-sm">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Cứu hộ viên được phân công</p>
                  {selectedItem.assignedRescuer
                    ? (
                        <>
                          <div className="mb-3 flex items-center gap-3 rounded-lg border border-indigo-100 bg-white px-3 py-2">
                            {renderAvatar(selectedItem.assignedRescuer.account?.avatarUrl, selectedItem.assignedRescuer.account?.fullName)}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">{selectedItem.assignedRescuer.account?.fullName ?? '-'}</p>
                              <p className="truncate text-xs text-slate-500">{selectedItem.assignedRescuer.phoneNumber ?? '-'}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                              <span className="font-semibold">Mã tài khoản:</span>
                              {' '}
                              {selectedItem.assignedRescuer.accountId ?? '-'}
                            </p>
                            <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                              <span className="font-semibold">Số điện thoại:</span>
                              {' '}
                              {selectedItem.assignedRescuer.phoneNumber ?? '-'}
                            </p>
                            <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                              <span className="font-semibold">Trực tuyến:</span>
                              {' '}
                              {selectedItem.assignedRescuer.isOnline == null ? '-' : selectedItem.assignedRescuer.isOnline ? 'true' : 'false'}
                            </p>
                            <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                              <span className="font-semibold">Sẵn sàng:</span>
                              {' '}
                              {selectedItem.assignedRescuer.isAvailable == null ? '-' : selectedItem.assignedRescuer.isAvailable ? 'true' : 'false'}
                            </p>
                            <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                              <span className="font-semibold">Điểm đánh giá:</span>
                              {' '}
                              {selectedItem.assignedRescuer.rating ?? '-'}
                            </p>
                            <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                              <span className="font-semibold">Số lượt đánh giá:</span>
                              {' '}
                              {selectedItem.assignedRescuer.ratingCount ?? '-'}
                            </p>
                            <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                              <span className="font-semibold">Loại cứu hộ:</span>
                              {' '}
                              {selectedItem.assignedRescuer.type ?? '-'}
                            </p>
                            <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                              <span className="font-semibold">Cập nhật vị trí gần nhất:</span>
                              {' '}
                              {formatDateTime(selectedItem.assignedRescuer.lastLocationUpdate)}
                            </p>
                            <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                              <span className="font-semibold">Vĩ độ:</span>
                              {' '}
                              {selectedItem.assignedRescuer.latitude ?? '-'}
                            </p>
                            <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                              <span className="font-semibold">Kinh độ:</span>
                              {' '}
                              {selectedItem.assignedRescuer.longitude ?? '-'}
                            </p>
                            <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                              <span className="font-semibold">Tổng nhiệm vụ:</span>
                              {' '}
                              {selectedItem.assignedRescuer.totalMissions ?? '-'}
                            </p>
                            <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                              <span className="font-semibold">Nhiệm vụ hoàn thành:</span>
                              {' '}
                              {selectedItem.assignedRescuer.completedMissions ?? '-'}
                            </p>
                            <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                              <span className="font-semibold">Mã hồ sơ:</span>
                              {' '}
                              {selectedItem.assignedRescuer.account?.id ?? '-'}
                            </p>
                            <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                              <span className="font-semibold">Email hồ sơ:</span>
                              {' '}
                              {selectedItem.assignedRescuer.account?.email ?? '-'}
                            </p>
                            <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                              <span className="font-semibold">Họ tên:</span>
                              {' '}
                              {selectedItem.assignedRescuer.account?.fullName ?? '-'}
                            </p>
                            <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                              <span className="font-semibold">Ảnh đại diện:</span>
                              {' '}
                              {selectedItem.assignedRescuer.account?.avatarUrl ? 'Đã hiển thị avatar ở trên' : '-'}
                            </p>
                            <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                              <span className="font-semibold">Vai trò:</span>
                              {' '}
                              {selectedItem.assignedRescuer.account?.role ?? '-'}
                            </p>
                            <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                              <span className="font-semibold">Kích hoạt:</span>
                              {' '}
                              {selectedItem.assignedRescuer.account?.isActive == null ? '-' : selectedItem.assignedRescuer.account.isActive ? 'true' : 'false'}
                            </p>
                          </div>
                        </>
                      )
                    : (
                        <p className="rounded-lg border border-indigo-100 bg-white px-3 py-2">null</p>
                      )}
                </div>

                <div className="rounded-xl border border-fuchsia-200 bg-fuchsia-50/70 p-4 shadow-sm">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Chi tiết loài rắn</p>
                  {selectedItem.details && selectedItem.details.length > 0
                    ? (
                        <div className="space-y-3">
                          {selectedItem.details.map((detail, index) => (
                            <div key={detail.id ?? `${selectedItem.id}-detail-${index}`} className="grid grid-cols-1 gap-3 rounded-lg border border-fuchsia-100 bg-white p-3 md:grid-cols-2">
                              <p>
                                <span className="font-semibold">Mã chi tiết:</span>
                                {' '}
                                {detail.id ?? '-'}
                              </p>
                              <p>
                                <span className="font-semibold">snakeCatchingRequestId:</span>
                                {' '}
                                {detail.snakeCatchingRequestId ?? '-'}
                              </p>
                              <p>
                                <span className="font-semibold">Mã loài rắn (snakeSpeciesId):</span>
                                {' '}
                                {detail.snakeSpeciesId ?? '-'}
                              </p>
                              <p>
                                <span className="font-semibold">Số lượng (quantity):</span>
                                {' '}
                                {detail.quantity ?? '-'}
                              </p>
                              <p>
                                <span className="font-semibold">Tên loài rắn (snakeSpeciesName):</span>
                                {' '}
                                {detail.snakeSpeciesName ?? '-'}
                              </p>
                              <p>
                                <span className="font-semibold">Tên khoa học (snakeSpeciesScientificName):</span>
                                {' '}
                                {detail.snakeSpeciesScientificName ?? '-'}
                              </p>
                            </div>
                          ))}
                        </div>
                      )
                    : (
                        <p className="rounded-lg border border-fuchsia-100 bg-white px-3 py-2">[]</p>
                      )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Hình ảnh đính kèm</p>
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">{selectedItem.media ? `${selectedItem.media.length} item(s)` : 'null'}</p>
                  {selectedItem.media && selectedItem.media.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {selectedItem.media.map((mediaItem) => {
                        const imageUrl = getImageUrlFromMedia(mediaItem);
                        const mediaKey = (() => {
                          if (typeof mediaItem === 'string') {
                            return mediaItem;
                          }

                          if (mediaItem && typeof mediaItem === 'object') {
                            const record = mediaItem as Record<string, unknown>;
                            const objectId = record.id;
                            if (typeof objectId === 'string' && objectId.length > 0) {
                              return objectId;
                            }
                          }

                          return JSON.stringify(mediaItem);
                        })();

                        return (
                          <div key={`${selectedItem.id}-media-${mediaKey}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            {imageUrl
                              ? (
                                  <div className="flex items-center gap-3">
                                    <img src={imageUrl} alt="Media avatar" className="size-12 rounded-full border border-slate-200 object-cover" />
                                    <p className="min-w-0 truncate text-xs text-slate-600">{imageUrl}</p>
                                  </div>
                                )
                              : (
                                  <pre className="overflow-x-auto text-xs text-slate-700">{JSON.stringify(mediaItem, null, 2)}</pre>
                                )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
