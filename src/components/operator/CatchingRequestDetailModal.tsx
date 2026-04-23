'use client';

import type {
  CreateSnakeCatchingRequestResponse,
  SnakeCatchingMissionInfo,
  SnakeCatchingRequestDetailItem,
  SnakeCatchingRequestMediaItem,
} from '@/types/snakecatching-request.type';
import type { TransactionItem } from '@/types/transaction.type';
import { AlertCircle, CheckCircle, CircleDollarSign, Loader2, MapPin, Receipt, RotateCcw, Send, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { transactionApi } from '@/apis/transaction.api';
import { SnakeCatchingRequestStatus } from '@/types/snakecatching-request.type';
import CatchingMissionAbortModal from './CatchingMissionAbortModal';
import CatchingRequestCancelModal from './CatchingRequestCancelModal';
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

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('vi-VN', { hour12: false });
};

const formatVndCurrency = (value?: number | null) => {
  if (value == null) {
    return '-';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
};

const getMissionStatusLabel = (status?: string | null) => {
  switch (status) {
    case 'Preparing':
      return 'Chuẩn bị';
    case 'EnRoute':
      return 'Đang di chuyển';
    case 'Arrived':
      return 'Đã đến nơi';
    case 'MissionCompleted':
      return 'Hoàn thành nhiệm vụ';
    case 'MissionUncompleted':
      return 'Nhiệm vụ chưa hoàn thành';
    case 'MissionAborted':
      return 'Nhiệm vụ bị hủy giữa chừng';
    case 'Cancelled':
      return 'Đã hủy nhiệm vụ';
    default:
      return status ?? 'Không xác định';
  }
};

const getRequestMediaKey = (media: SnakeCatchingRequestMediaItem) => {
  return [
    media.mediaUrl ?? '',
    media.fileName ?? '',
    media.contentType ?? '',
    media.fileSize ?? '',
  ].join('-');
};

const getRequestDetailKey = (detail: SnakeCatchingRequestDetailItem) => {
  return [
    detail.id ?? '',
    detail.snakeSpeciesId ?? '',
    detail.snakeSpeciesName ?? '',
    detail.quantity ?? '',
  ].join('-');
};

const TRANSACTION_TYPE_LABEL_MAP: Record<string, string> = {
  ConsultationPayment: 'Thanh toán tư vấn',
  ExpertPayout: 'Chi trả chuyên gia',
  ConsultationRefund: 'Hoàn tiền tư vấn',
  MissionDonation: 'Quyên góp nhiệm vụ',
  RescuerReward: 'Thưởng cứu hộ',
  WalletTopup: 'Nạp ví',
  WalletWithdraw: 'Rút ví',
  WithdrawalInitiated: 'Khởi tạo yêu cầu rút tiền',
  WithdrawalRefund: 'Hoàn tiền yêu cầu rút',
  PlatformFee: 'Phí nền tảng',
  AdminAdjustment: 'Điều chỉnh admin',
  CatchingPayment: 'Thanh toán bắt rắn',
  CatcherPayout: 'Chi trả người bắt rắn',
  CatchingDeposit: 'Đặt cọc bắt rắn',
  CatchingRefund: 'Hoàn tiền bắt rắn',
  SnakebiteIncidentPayment: 'Thanh toán sự cố rắn cắn',
  SnakebiteIncidentDeposit: 'Đặt cọc sự cố rắn cắn',
  SnakebiteIncidentRefund: 'Hoàn tiền sự cố rắn cắn',
};

const PAYMENT_METHOD_LABEL_MAP: Record<string, string> = {
  Internal: 'SnakeAidPay',
  PayOS: 'PayOS',
  Cash: 'Tiền mặt',
  BankTransfer: 'Chuyển khoản',
  Wallet: 'SnakeAidPay',
};

const getMissionKey = (mission: SnakeCatchingMissionInfo) => {
  return [
    mission.status ?? '',
    mission.startedAt ?? '',
    mission.arrivedAt ?? '',
    mission.completedAt ?? '',
    mission.actualCost ?? '',
  ].join('-');
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
  onCancel?: (requestId: string, reason: string) => Promise<void>;
  onAbort?: (missionId: string, reason: string) => Promise<void>;
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
  onAbort,
  onRefresh,
}: CatchingRequestDetailModalProps) {
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isAbortModalOpen, setIsAbortModalOpen] = useState(false);
  const [abortMissionId, setAbortMissionId] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);

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
    let cancelled = false;

    const fetchTransactions = async () => {
      if (!isOpen || !requestId) {
        return;
      }

      setIsTransactionsLoading(true);
      setTransactionError(null);

      try {
        const response = await transactionApi.getPaged({
          referenceId: requestId,
          pageSize: 20,
        });

        if (!cancelled) {
          setTransactions(response.items);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load related transactions', err);
          setTransactionError('Không thể tải lịch sử giao dịch.');
        }
      } finally {
        if (!cancelled) {
          setIsTransactionsLoading(false);
        }
      }
    };

    void fetchTransactions();

    return () => {
      cancelled = true;
    };
  }, [isOpen, requestId]);

  if (!isOpen) {
    return null;
  }

  const renderMedia = () => {
    if (!request?.media || request.media.length === 0) {
      return <p className="text-sm text-slate-500">Chưa có ảnh/medias.</p>;
    }

    return (
      <div className="grid grid-cols-2 gap-2">
        {request.media.map((m: SnakeCatchingRequestMediaItem) => (
          <div
            key={getRequestMediaKey(m)}
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

  const handleCancelClick = () => {
    setIsCancelModalOpen(true);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!request?.id || !onCancel) {
      return;
    }

    setIsActionLoading(true);
    try {
      await onCancel(request.id, reason);
      onRefresh?.();
      onClose();
    } catch (err) {
      console.error('Failed to cancel request', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAbortClick = (mission: SnakeCatchingMissionInfo) => {
    if (!mission.id) {
      return;
    }

    setAbortMissionId(mission.id);
    setIsAbortModalOpen(true);
  };

  const handleAbortConfirm = async (reason: string) => {
    if (!abortMissionId || !onAbort) {
      return;
    }

    setIsActionLoading(true);
    try {
      await onAbort(abortMissionId, reason);
      onRefresh?.();
      onClose();
    } catch (err) {
      console.error('Failed to abort mission', err);
    } finally {
      setIsActionLoading(false);
      setAbortMissionId(null);
      setIsAbortModalOpen(false);
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

  const hasPreparingMission = request?.missions?.some(mission => mission.status === 'Preparing') ?? false;

  const renderDetails = () => {
    const details = request?.details;
    if (!details || details.length === 0) {
      return <p className="text-sm text-slate-500">Không có thông tin loài/chi tiết.</p>;
    }

    return (
      <div className="space-y-2">
        {details.map((d: SnakeCatchingRequestDetailItem) => (
          <div key={getRequestDetailKey(d)} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
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

    const user = request.user;

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

  const renderMissions = () => {
    const missions = request?.missions;
    if (!missions || missions.length === 0) {
      return <p className="text-sm text-slate-500">Chưa có thông tin nhiệm vụ cứu hộ.</p>;
    }

    return (
      <div className="space-y-3">
        {missions.map((mission: SnakeCatchingMissionInfo, missionIndex) => (
          <div key={getMissionKey(mission)} className="rounded-xl border border-indigo-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">
                Nhiệm vụ
                {' '}
                {missionIndex + 1}
              </p>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                {getMissionStatusLabel(mission.status)}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-700 md:grid-cols-2">
              <p>
                <span className="font-semibold text-slate-500">Bắt đầu:</span>
                {' '}
                {formatDateTime(mission.startedAt)}
              </p>
              <p>
                <span className="font-semibold text-slate-500">Đến nơi:</span>
                {' '}
                {formatDateTime(mission.arrivedAt)}
              </p>
              <p>
                <span className="font-semibold text-slate-500">Hoàn thành:</span>
                {' '}
                {formatDateTime(mission.completedAt)}
              </p>
              <p>
                <span className="font-semibold text-slate-500">Chi phí ước tính:</span>
                {' '}
                {formatVndCurrency(mission.estimatedCost)}
              </p>
              <p>
                <span className="font-semibold text-slate-500">Chi phí thực tế:</span>
                {' '}
                {formatVndCurrency(mission.actualCost)}
              </p>
              <p>
                <span className="font-semibold text-slate-500">Giá nhiệm vụ:</span>
                {' '}
                {formatVndCurrency(mission.price)}
              </p>
            </div>

            {mission.catchingEnvironment?.name && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Môi trường bắt rắn</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{mission.catchingEnvironment.name}</p>
                {mission.catchingEnvironment.description && (
                  <p className="mt-1 text-xs text-slate-600">{mission.catchingEnvironment.description}</p>
                )}
              </div>
            )}

            {mission.missionDetails && mission.missionDetails.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Chi tiết bắt được</p>
                {mission.missionDetails.map(detail => (
                  <div key={`${detail.snakeSpeciesName ?? ''}-${detail.quantity ?? ''}-${detail.price ?? ''}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{detail.snakeSpeciesName ?? 'Chưa rõ loài'}</p>
                    <p className="mt-0.5 text-xs">
                      Số lượng:
                      {' '}
                      {detail.quantity ?? '-'}
                    </p>
                    <p className="mt-0.5 text-xs">
                      Đơn giá:
                      {' '}
                      {formatVndCurrency(detail.price)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {mission.media && mission.media.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Ảnh bằng chứng nhiệm vụ</p>
                <div className="grid grid-cols-2 gap-2">
                  {mission.media.map(mediaItem => (
                    <div
                      key={getRequestMediaKey(mediaItem)}
                      className="relative h-28 overflow-hidden rounded-lg border border-slate-200"
                      style={{ backgroundImage: `url(${mediaItem.mediaUrl})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
                      role="img"
                      aria-label={mediaItem.fileName ?? 'mission-media'}
                    />
                  ))}
                </div>
              </div>
            )}

            {(mission.status === 'Preparing' || mission.status === 'EnRoute') && mission.id && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => handleAbortClick(mission)}
                  disabled={isActionLoading || !onAbort}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-rose-600 bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="size-4" />
                  Hủy đơn nhiệm vụ
                </button>
              </div>
            )}

            {mission.notes && (
              <p className="mt-3 text-xs text-slate-600">
                <span className="font-semibold text-slate-500">Ghi chú:</span>
                {' '}
                {mission.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderTransactions = () => {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-blue-700">
          <CircleDollarSign className="size-4" />
          Thanh toán & Giao dịch
        </p>

        {isTransactionsLoading && (
          <div className="flex items-center justify-center p-4 text-sm text-slate-500">
            <Loader2 className="mr-2 size-4 animate-spin text-blue-500" />
            Đang tải giao dịch...
          </div>
        )}

        {!isTransactionsLoading && transactionError && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="size-4" />
            {transactionError}
          </div>
        )}

        {!isTransactionsLoading && !transactionError && transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/60 p-6 text-sm text-slate-500">
            <Receipt className="mb-2 size-8 text-slate-300" />
            Chưa có giao dịch nào cho yêu cầu này
          </div>
        )}

        {!isTransactionsLoading && !transactionError && transactions.length > 0 && (
          <div className="space-y-2">
            {transactions.map(item => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white bg-white p-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-50">
                    <CircleDollarSign className="size-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{formatVndCurrency(item.amount)}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="rounded-md bg-blue-100 px-2 py-0.5 font-semibold text-blue-700">
                        {TRANSACTION_TYPE_LABEL_MAP[item.transactionType] || item.transactionType}
                      </span>
                      <span>
                        •
                        {formatDateTime(item.createdAt)}
                      </span>
                      <span className="font-mono">{PAYMENT_METHOD_LABEL_MAP[item.paymentMethod] || item.paymentMethod}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="text-xs font-medium text-slate-700">{item.fullName || item.userName}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 break-all max-w-[160px] truncate" title={item.externalTransactionId ?? ''}>
                    {item.externalTransactionId ? `Mã: ${item.externalTransactionId}` : 'Nội bộ'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const rescuer = request?.assignedRescuer ?? null;
  const rescuerName = rescuer?.account?.fullName ?? rescuer?.account?.email ?? 'Chưa có thông tin';
  const rescuerPhone = rescuer?.phoneNumber ?? 'Không có SĐT';
  const rescuerAvatar = rescuer?.account?.avatarUrl ?? null;

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
                            {request.requestDate
                              ? new Date(request.requestDate).toLocaleString('vi-VN')
                              : request.createdAt
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

                        {(request.assignedRescuerId || rescuer) && (
                          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                            <div className="flex items-center gap-2">
                              <User className="size-4 text-sky-700" />
                              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Đội cứu hộ được phân công</p>
                            </div>

                            {rescuer
                              ? (
                                  <div className="mt-3 flex items-start gap-3 rounded-xl border border-sky-200 bg-white p-3">
                                    {rescuerAvatar
                                      ? (
                                          <img
                                            src={rescuerAvatar}
                                            alt={rescuerName}
                                            className="h-12 w-12 rounded-full border border-sky-200 object-cover"
                                          />
                                        )
                                      : (
                                          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-sky-200 bg-sky-100 text-sky-700">
                                            <User className="size-6" />
                                          </div>
                                        )}

                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-semibold text-slate-900">{rescuerName}</p>
                                      <p className="mt-0.5 text-xs text-slate-500">{rescuerPhone}</p>

                                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                                        <span className="rounded-full bg-sky-100 px-2 py-0.5 font-semibold text-sky-700">
                                          {rescuer.isOnline ? 'Online' : 'Offline'}
                                        </span>
                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                                          {rescuer.isAvailable ? 'Sẵn sàng' : 'Đang bận'}
                                        </span>
                                        {rescuer.type && (
                                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                                            {rescuer.type}
                                          </span>
                                        )}
                                      </div>

                                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 md:grid-cols-4">
                                        <div>
                                          <p className="font-semibold text-slate-500">Đánh giá</p>
                                          <p className="font-semibold text-slate-900">{rescuer.rating ?? '-'}</p>
                                        </div>
                                        <div>
                                          <p className="font-semibold text-slate-500">Cập nhật cuối</p>
                                          <p className="font-semibold text-slate-900">
                                            {rescuer.lastLocationUpdate ? new Date(rescuer.lastLocationUpdate).toLocaleString('vi-VN') : '-'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              : (
                                  <p className="mt-3 text-sm text-slate-600">Chưa có thông tin rescuer được phân công.</p>
                                )}

                            {request.assignedAt && (
                              <p className="mt-2 text-xs text-slate-600">
                                Phân công lúc:
                                {' '}
                                {new Date(request.assignedAt).toLocaleString('vi-VN')}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Thông tin nhiệm vụ cứu hộ</p>
                          <div className="mt-2">{renderMissions()}</div>
                        </div>

                        {renderTransactions()}

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
                              <>
                                <button
                                  type="button"
                                  onClick={handleConfirm}
                                  disabled={isActionLoading || !onConfirm}
                                  className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <CheckCircle className="size-4" />
                                  Xác nhận yêu cầu
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelClick}
                                  disabled={isActionLoading || !onCancel}
                                  className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-amber-600 bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <AlertCircle className="size-4" />
                                  Báo động giả
                                </button>
                              </>
                            )}

                            {request.status === SnakeCatchingRequestStatus.Confirmed && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setIsDispatchModalOpen(true)}
                                  disabled={isActionLoading || !onAssign}
                                  className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Send className="size-4" />
                                  Điều phối đội cứu hộ
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelClick}
                                  disabled={isActionLoading || !onCancel}
                                  className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-amber-600 bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <RotateCcw className="size-4" />
                                  Hủy yêu cầu
                                </button>
                              </>
                            )}

                            {request.status === SnakeCatchingRequestStatus.Assigned && hasPreparingMission && (
                              <button
                                type="button"
                                onClick={handleCancelClick}
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

        {/* Cancel Request Modal */}
        {isOpen && (
          <CatchingRequestCancelModal
            isOpen={isCancelModalOpen}
            isLoading={isActionLoading}
            requestStatus={request?.status}
            onClose={() => setIsCancelModalOpen(false)}
            onConfirm={handleCancelConfirm}
          />
        )}

        {isOpen && (
          <CatchingMissionAbortModal
            isOpen={isAbortModalOpen}
            isLoading={isActionLoading}
            onClose={() => {
              setIsAbortModalOpen(false);
              setAbortMissionId(null);
            }}
            onConfirm={handleAbortConfirm}
          />
        )}
      </div>
    </div>
  );
}
