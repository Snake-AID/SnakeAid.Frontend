'use client';

import type { CreateSnakeCatchingRequestResponse } from '@/types/snakecatching-request.type';
import { AlertCircle, CheckCircle, MapPin, RotateCcw, Send, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SnakeCatchingRequestStatus } from '@/types/snakecatching-request.type';
import DispatchRescuerModal from './DispatchRescuerModal';

const getShortRequestId = (id: string) => {
  const suffix = id.slice(-6).toUpperCase();
  return `CAR-${suffix}`;
};

const getStatusPalette = (status: string) => {
  switch (status) {
    case 'Pending':
      return { border: 'border-amber-300', bg: 'bg-amber-50', text: 'text-amber-800', label: 'Chờ xử lý' };
    case 'Confirmed':
      return { border: 'border-emerald-300', bg: 'bg-emerald-50', text: 'text-emerald-800', label: 'Đã xác nhận' };
    case 'Assigned':
      return { border: 'border-sky-300', bg: 'bg-sky-50', text: 'text-sky-800', label: 'Đã phân công' };
    case 'Dispatched':
      return { border: 'border-sky-300', bg: 'bg-sky-50', text: 'text-sky-800', label: 'Đã điều phối' };
    case 'Completed':
      return { border: 'border-slate-300', bg: 'bg-slate-50', text: 'text-slate-800', label: 'Hoàn thành' };
    case 'Cancelled':
      return { border: 'border-rose-300', bg: 'bg-rose-50', text: 'text-rose-800', label: 'Đã hủy' };
    default:
      return { border: 'border-slate-300', bg: 'bg-slate-50', text: 'text-slate-800', label: status };
  }
};

export interface CatchingRequestDetailModalProps {
  request: CreateSnakeCatchingRequestResponse | null;
  requestId: string | null;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm?: (requestId: string) => Promise<void>;
  onAssign?: (requestId: string, rescuerId: string) => Promise<void>;
  onCancel?: (requestId: string) => Promise<void>;
  onRefresh?: () => void;
}

export default function CatchingRequestDetailModal({
  request,
  requestId,
  isOpen,
  isLoading,
  error,
  onClose,
  onConfirm,
  onAssign,
  onCancel,
  onRefresh,
}: CatchingRequestDetailModalProps) {
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const renderMedia = () => {
    if (!request?.media || request.media.length === 0) {
      return <p className="text-sm text-slate-500">Chưa có ảnh/medias.</p>;
    }

    return (
      <div className="grid grid-cols-2 gap-2">
        {request.media.map((m: any) => (
          <div
            key={m.id}
            className="relative h-32 overflow-hidden rounded-xl border border-slate-200"
            style={{ backgroundImage: `url(${m.mediaUrl})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
            role="img"
            aria-label={m.fileName ?? 'media'}
          />
        ))}
      </div>
    );
  };

  const handleConfirm = async () => {
    if (!request?.id || !onConfirm) {
      return;
    }

    setIsActionLoading(true);
    try {
      await onConfirm(request.id);
      onRefresh?.();
      onClose();
    } catch (err) {
      console.error('Failed to confirm request', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!request?.id || !onCancel) {
      return;
    }

    setIsActionLoading(true);
    try {
      await onCancel(request.id);
      onRefresh?.();
      onClose();
    } catch (err) {
      console.error('Failed to cancel request', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAssign = async (rescuerId: string) => {
    if (!request?.id || !onAssign) {
      return;
    }

    setIsActionLoading(true);
    try {
      await onAssign(request.id, rescuerId);
      setIsDispatchModalOpen(false);
      onRefresh?.();
      onClose();
    } catch (err) {
      console.error('Failed to assign request', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const renderDetails = () => {
    const details = request?.details as any[] | undefined;
    if (!details || details.length === 0) {
      return <p className="text-sm text-slate-500">Không có thông tin loài/chi tiết.</p>;
    }

    return (
      <div className="space-y-2">
        {details.map((d: any) => (
          <div key={d.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">{d.snakeSpeciesName}</p>
            <p className="text-xs text-slate-500">
              Số lượng:
              {d.quantity ?? '?'}
            </p>
          </div>
        ))}
      </div>
    );
  };

  const renderUser = () => {
    if (!request?.user) {
      return <p className="mt-3 text-sm text-slate-500">Không có thông tin người yêu cầu.</p>;
    }

    const user = request.user as any;

    return (
      <div className="mt-3 flex flex-row items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <img
          className="h-12 w-12 rounded-full border border-slate-200 object-cover"
          src={user.account?.avatarUrl ?? 'https://d11a6trkgmumsb.cloudfront.net/original/3X/d/8/d8b5d0a738295345ebd8934b859fa1fca1c8c6ad.jpeg'}
          alt={user.account?.fullName ?? user.userName ?? 'User'}
        />
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">
            {user.account?.fullName ?? user.userName ?? 'N/A'}
          </p>
          <p className="text-xs text-slate-500">
            <span className="font-semibold">SĐT:</span>
            {' '}
            {user.phoneNumber ?? 'Không có số điện thoại'}
          </p>
          {user.email && (
            <p className="text-xs text-slate-500">
              <span className="font-semibold">Email:</span>
              {' '}
              {user.email}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Chi tiết yêu cầu bắt rắn</h2>
            {requestId && (
              <p className="text-xs font-semibold text-slate-600">
                {getShortRequestId(requestId)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5">
          {isLoading
            ? (
                <p className="text-sm text-slate-500">Đang tải...</p>
              )
            : error
              ? (
                  <p className="text-sm text-rose-600">{error}</p>
                )
              : !request
                  ? (
                      <p className="text-sm text-slate-500">Chọn yêu cầu để xem chi tiết.</p>
                    )
                  : (
                      <div className="space-y-5">
                        {(() => {
                          const palette = getStatusPalette(request.status);
                          return (
                            <div className={`rounded-xl border ${palette.border} ${palette.bg} p-4`}>
                              <p className={`text-xs font-semibold uppercase tracking-wide ${palette.text}`}>Trạng thái</p>
                              <p className={`mt-1 text-sm font-semibold ${palette.text}`}>{palette.label}</p>
                            </div>
                          );
                        })()}

                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Thời gian yêu cầu</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {request.createdAt
                              ? new Date(request.createdAt).toLocaleString('vi-VN')
                              : 'Không xác định'}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {request.estimatedPrice != null && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Giá ước tính</p>
                              <p className="mt-1 text-lg font-bold text-emerald-900">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(request.estimatedPrice)}
                              </p>
                            </div>
                          )}

                          {request.distanceKm != null && (
                            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                              <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide">Khoảng cách</p>
                              <p className="mt-1 text-lg font-bold text-sky-900">
                                {request.distanceKm.toFixed(2)}
                                {' '}
                                km
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="size-4 text-emerald-700" />
                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Địa chỉ</p>
                          </div>
                          <p className="mt-2 text-sm text-slate-900">
                            {request.address ?? 'Không có địa chỉ'}
                          </p>
                          {request.locationCoordinates && (
                            <p className="mt-1 text-xs text-slate-600">
                              {request.locationCoordinates.latitude.toFixed(5)}
                              ,
                              {' '}
                              {request.locationCoordinates.longitude.toFixed(5)}
                            </p>
                          )}
                          <button
                            type="button"
                            className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border border-emerald-600 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                            onClick={onClose}
                          >
                            Xem trên bản đồ
                          </button>
                        </div>

                        {request.additionalDetails && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Ghi chú / Chi tiết bổ sung</p>
                            <p className="mt-2 text-sm text-slate-700">{request.additionalDetails}</p>
                          </div>
                        )}

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center gap-2">
                            <User className="size-4 text-emerald-700" />
                            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Người yêu cầu</p>
                          </div>
                          {renderUser()}
                        </div>

                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Thông tin loài rắn</p>
                          <div className="mt-2">{renderDetails()}</div>
                        </div>

                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Hình ảnh / bằng chứng</p>
                          <div className="mt-2">{renderMedia()}</div>
                        </div>

                        {request.isPrePaid && (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="size-4 text-emerald-700" />
                              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Đã thanh toán trước</p>
                            </div>
                            {request.prePaidAt && (
                              <p className="mt-1 text-xs text-slate-600">
                                Thanh toán lúc:
                                {' '}
                                {new Date(request.prePaidAt).toLocaleString('vi-VN')}
                              </p>
                            )}
                          </div>
                        )}

                        {request.assignedRescuerId && (
                          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                            <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide">Rescuer được phân công</p>
                            <p className="mt-1 text-sm text-slate-900">
                              ID:
                              {' '}
                              {request.assignedRescuerId}
                            </p>
                            {request.assignedAt && (
                              <p className="mt-1 text-xs text-slate-600">
                                Phân công lúc:
                                {' '}
                                {new Date(request.assignedAt).toLocaleString('vi-VN')}
                              </p>
                            )}
                          </div>
                        )}

                        {request.cancellationReason && (
                          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="size-4 text-rose-700" />
                              <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Lý do hủy</p>
                            </div>
                            <p className="mt-2 text-sm text-slate-900">{request.cancellationReason}</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="border-t border-slate-200 pt-4">
                          <div className="flex flex-col gap-2">
                            {request.status === SnakeCatchingRequestStatus.Pending && (
                              <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={isActionLoading || !onConfirm}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <CheckCircle className="size-4" />
                                Xác nhận yêu cầu
                              </button>
                            )}

                            {request.status === SnakeCatchingRequestStatus.Confirmed && (
                              <button
                                type="button"
                                onClick={() => setIsDispatchModalOpen(true)}
                                disabled={isActionLoading || !onAssign}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Send className="size-4" />
                                Điều phối rescuer
                              </button>
                            )}

                            {(request.status === SnakeCatchingRequestStatus.Assigned || request.status === SnakeCatchingRequestStatus.Confirmed) && (
                              <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isActionLoading || !onCancel}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-rose-600 bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <RotateCcw className="size-4" />
                                Hủy yêu cầu
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
        </div>

        {/* Dispatch Rescuer Modal */}
        {isOpen && (
          <DispatchRescuerModal
            catchingRequestId={request?.id ?? requestId ?? ''}
            isOpen={isDispatchModalOpen}
            onClose={() => setIsDispatchModalOpen(false)}
            onDispatch={handleAssign}
          />
        )}
      </div>
    </div>
  );
}
