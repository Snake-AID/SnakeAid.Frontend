'use client';

import type { CreateSnakeCatchingRequestResponse } from '@/types/snakecatching-request.type';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SnakeCatchingRequestStatus } from '@/types/snakecatching-request.type';
import DispatchRescuerModal from './DispatchRescuerModal';

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

  useEffect(() => {
    if (!isOpen) {
      setIsDispatchModalOpen(false);
    }
  }, [isOpen]);

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
      return <p className="text-sm text-slate-500">Không có thông tin người báo.</p>;
    }

    const user = request.user as any;

    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Người báo</p>
        <div className="mt-2 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Tên:</span>
            {' '}
            {user.account?.fullName ?? user.userName ?? 'N/A'}
          </p>
          <p>
            <span className="font-semibold">SĐT:</span>
            {' '}
            {user.phoneNumber ?? 'N/A'}
          </p>
          <p>
            <span className="font-semibold">Email:</span>
            {' '}
            {user.email ?? 'N/A'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Request Detail</h2>
            <p className="text-xs text-slate-500">
              ID:
              {requestId ?? 'N/A'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-6">
          {isLoading
            ? (
                <div className="text-sm text-slate-500">Loading request...</div>
              )
            : error
              ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    {error}
                  </div>
                )
              : request
                ? (
                    <div className="space-y-5 text-sm text-slate-700">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Trạng thái</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{request.status}</p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Chi tiết</p>
                        <div className="mt-2 space-y-2">
                          <p>
                            <span className="font-semibold">Địa chỉ:</span>
                            {' '}
                            {request.address ?? 'N/A'}
                          </p>
                          <p>
                            <span className="font-semibold">Ưu tiên:</span>
                            {' '}
                            {(request.priority as string | null) ?? 'N/A'}
                          </p>
                          <p>
                            <span className="font-semibold">Thời gian yêu cầu:</span>
                            {' '}
                            {(request.requestDate as string | null) ?? 'N/A'}
                          </p>
                          <p>
                            <span className="font-semibold">Ghi chú:</span>
                            {' '}
                            {(request.notes as string | null) ?? (request.additionalDetails as string | null) ?? 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Hành động</p>
                        <div className="mt-3 flex flex-col gap-2">
                          {request.status === SnakeCatchingRequestStatus.Pending && (
                            <button
                              type="button"
                              onClick={handleConfirm}
                              disabled={isActionLoading || !onConfirm}
                              className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Xác nhận
                            </button>
                          )}

                          {request.status === SnakeCatchingRequestStatus.Confirmed && (
                            <button
                              type="button"
                              onClick={() => setIsDispatchModalOpen(true)}
                              disabled={isActionLoading || !onAssign}
                              className="w-full rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Điều phối rescuer
                            </button>
                          )}

                          {(request.status === SnakeCatchingRequestStatus.Assigned || request.status === SnakeCatchingRequestStatus.Confirmed) && (
                            <button
                              type="button"
                              onClick={handleCancel}
                              disabled={isActionLoading || !onCancel}
                              className="w-full rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Hủy yêu cầu
                            </button>
                          )}
                        </div>
                      </div>

                      {renderUser()}

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Thông tin loài</p>
                        <div className="mt-2">{renderDetails()}</div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Hình ảnh</p>
                        <div className="mt-2">{renderMedia()}</div>
                      </div>
                    </div>
                  )
                : (
                    <div className="text-sm text-slate-500">No data available.</div>
                  )}
        </div>
      </div>

      <DispatchRescuerModal
        catchingRequestId={request?.id ?? requestId ?? ''}
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        onDispatch={handleAssign}
      />
    </div>
  );
}
