'use client';

import type { DetailSnakebiteIncidentResponse, DispatchRequestItem } from '@/types/snakebite-incident.type';
import { AlertCircle, CheckCircle, Clock, MapPin, Send, User, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { incidentApi } from '@/apis/incident.api';
import { useToast } from '@/components/ToastProvider';
import { PrimaryVenomType, SnakebiteIncidentStatus } from '@/types/snakebite-incident.type';
import DispatchRescuerModal from './DispatchRescuerModal';

export interface IncidentDetailModalProps {
  incident: DetailSnakebiteIncidentResponse | null;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onVerify?: (incidentId: string) => Promise<void>;
  onFalseAlarm?: (incidentId: string) => Promise<void>;
  onDispatch?: (incidentId: string, rescuerId: string) => Promise<void>;
  onRefresh?: () => void;
}

const getShortIncidentId = (id: string) => {
  const suffix = id.slice(-5).toUpperCase();
  return `INC-${suffix}`;
};

export default function IncidentDetailModal({
  incident,
  isOpen,
  isLoading,
  error,
  onClose,
  onVerify,
  onFalseAlarm,
  onDispatch,
  onRefresh,
}: IncidentDetailModalProps) {
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [dispatchRequests, setDispatchRequests] = useState<DispatchRequestItem[]>([]);
  const [isDispatchRequestsLoading, setIsDispatchRequestsLoading] = useState(false);
  const [dispatchRequestError, setDispatchRequestError] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadDispatchRequests = useCallback(async () => {
    if (!incident?.id) {
      setDispatchRequests([]);
      return;
    }

    setIsDispatchRequestsLoading(true);
    setDispatchRequestError(null);

    try {
      const response = await incidentApi.getDispatchRequests(incident.id);
      setDispatchRequests(response ?? []);
    } catch (err) {
      console.error('Failed to load dispatch requests', err);
      setDispatchRequestError('Không thể tải danh sách dispatch request.');
    } finally {
      setIsDispatchRequestsLoading(false);
    }
  }, [incident?.id]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    loadDispatchRequests();
  }, [isOpen, loadDispatchRequests]);

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
        return 'Đã hủy';
      case 'Cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getMissionStatusColor = (status: string) => {
    switch (status) {
      case 'Preparing':
        return 'bg-amber-100 text-amber-800';
      case 'EnRoute':
        return 'bg-blue-100 text-blue-800';
      case 'RescuerArrived':
        return 'bg-purple-100 text-purple-800';
      case 'MissionCompleted':
        return 'bg-emerald-100 text-emerald-800';
      case 'MissionUncompleted':
      case 'MissionAborted':
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (!isOpen) {
    return null;
  }

  const handleVerify = async () => {
    if (!incident?.id || !onVerify) {
      return;
    }

    setIsActionLoading(true);
    try {
      await onVerify(incident.id);
      showToast('Đã xác nhận case.', { type: 'success' });
      onRefresh?.();
    } catch (err) {
      console.error('Failed to verify incident', err);
      showToast('Xác nhận thất bại. Vui lòng thử lại.', { type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleFalseAlarm = async () => {
    if (!incident?.id || !onFalseAlarm) {
      return;
    }

    setIsActionLoading(true);
    try {
      await onFalseAlarm(incident.id);
      showToast('Đã đánh dấu báo động giả.', { type: 'success' });
      onRefresh?.();
    } catch (err) {
      console.error('Failed to mark false alarm', err);
      showToast('Đánh dấu báo động giả thất bại. Vui lòng thử lại.', { type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDispatchClick = () => {
    setIsDispatchModalOpen(true);
  };

  const handleDispatch = async (rescuerId: string) => {
    if (!incident?.id || !onDispatch) {
      return;
    }

    try {
      await onDispatch(incident.id, rescuerId);
      showToast('Đã điều phối đội cứu hộ.', { type: 'success' });
      onRefresh?.();
    } catch (err) {
      console.error('Failed to dispatch rescuer', err);
      showToast('Điều phối thất bại. Vui lòng thử lại.', { type: 'error' });
    } finally {
      await loadDispatchRequests();
    }
  };

  const handleCancelDispatchRequest = async (requestId: string) => {
    try {
      await incidentApi.cancelDispatchRequest(requestId);
      showToast('Đã hủy yêu cầu dispatch.', { type: 'success' });
      await loadDispatchRequests();
    } catch (err) {
      console.error('Failed to cancel dispatch request', err);
      showToast('Hủy yêu cầu dispatch thất bại. Vui lòng thử lại.', { type: 'error' });
    }
  };

  const renderMedia = () => {
    if (!incident?.media || incident.media.length === 0) {
      return <p className="text-sm text-slate-500">Chưa có ảnh được cung cấp.</p>;
    }

    return (
      <div className="grid grid-cols-2 gap-2">
        {incident.media.map(m => (
          <div
            key={m.id}
            className="relative h-32 overflow-hidden rounded-xl border border-slate-200"
            style={{ backgroundImage: `url(${m.mediaUrl})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
            role="img"
            aria-label={`Media ${m.id}`}
          />
        ))}
      </div>
    );
  };

  const renderSymptoms = () => {
    if (!incident?.symptomsReport || incident.symptomsReport.length === 0) {
      return <p className="text-sm text-slate-500">Chưa có báo cáo triệu chứng.</p>;
    }

    return (
      <ul className="space-y-2">
        {incident.symptomsReport.map(symptom => (
          <li key={symptom.symptomId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">{symptom.symptomName}</p>
            <p className="text-xs text-slate-600">{symptom.symptomDescription}</p>
          </li>
        ))}
      </ul>
    );
  };

  const getRiskColor = (riskLevel: number) => {
    if (riskLevel >= 8) {
      return 'bg-red-700 text-white';
    }
    if (riskLevel >= 6) {
      return 'bg-red-500 text-white';
    }
    if (riskLevel >= 5) {
      return 'bg-orange-600 text-white';
    }
    if (riskLevel > 4) {
      return 'bg-orange-300 text-slate-900';
    }
    return 'bg-emerald-500 text-white';
  };

  const getRiskLabel = (riskLevel: number) => {
    if (riskLevel >= 8) {
      return 'Cực kỳ nguy hiểm';
    }
    if (riskLevel >= 6) {
      return 'Rất nguy hiểm';
    }
    if (riskLevel >= 5) {
      return 'Nguy hiểm';
    }
    if (riskLevel > 4) {
      return 'Trung bình';
    }
    return 'Thấp';
  };

  const getSeverityClasses = (severityLevel: number) => {
    if (severityLevel >= 70) {
      return 'bg-red-50 border-red-300 text-red-900';
    } else if (severityLevel >= 40) {
      return 'bg-amber-50 border-amber-300 text-amber-900';
    }
    return 'bg-emerald-50 border-emerald-300 text-emerald-900';
  };

  const getSeverityLabel = (severityLevel: number) => {
    if (severityLevel >= 70) {
      return 'Nghiêm trọng';
    } else if (severityLevel >= 40) {
      return 'Trung bình';
    }
    return 'Nhẹ';
  };

  const getStatusPalette = (status: string) => {
    switch (status) {
      case 'Pending':
        return { border: 'border-amber-300', bg: 'bg-amber-50', text: 'text-amber-800', label: 'Chờ xác minh' };
      case 'Verified':
        return { border: 'border-emerald-300', bg: 'bg-emerald-50', text: 'text-emerald-800', label: 'Chờ điều phối' };
      case 'Assigned':
        return { border: 'border-sky-300', bg: 'bg-sky-50', text: 'text-sky-800', label: 'Đã nhận lệnh' };
      case 'Finished':
        return { border: 'border-purple-300', bg: 'bg-purple-50', text: 'text-purple-800', label: 'Đã kết thúc' };
      case 'Completed':
        return { border: 'border-emerald-300', bg: 'bg-emerald-50', text: 'text-emerald-800', label: 'Hoàn thành' };
      case 'FalseAlarm':
        return { border: 'border-rose-300', bg: 'bg-rose-50', text: 'text-rose-800', label: 'Báo động giả' };
      case 'Cancelled':
        return { border: 'border-slate-300', bg: 'bg-slate-50', text: 'text-slate-800', label: 'Đã hủy' };
      case 'NoRescuerFound':
        return { border: 'border-orange-300', bg: 'bg-orange-50', text: 'text-orange-800', label: 'Không tìm được cứu hộ' };
      case 'Disputed':
        return { border: 'border-violet-300', bg: 'bg-violet-50', text: 'text-violet-800', label: 'Tranh chấp' };
      // Legacy statuses (may not be used anymore)
      case 'Dispatched':
        return { border: 'border-sky-300', bg: 'bg-sky-50', text: 'text-sky-800', label: 'Đã điều phối' };
      case 'Contacting':
        return { border: 'border-blue-300', bg: 'bg-blue-50', text: 'text-blue-800', label: 'Đang liên hệ' };
      default:
        return { border: 'border-slate-300', bg: 'bg-slate-50', text: 'text-slate-800', label: status };
    }
  };

  const getVenomTypeBadge = (venomType?: PrimaryVenomType) => {
    let VenomText;
    if (!venomType || venomType === PrimaryVenomType.None) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">
          <span className="relative h-2 w-2 rounded-full bg-white" />
          Không
        </span>
      );
    }

    switch (venomType) {
      case PrimaryVenomType.Neurotoxic:
        VenomText = 'Độc Thần kinh';
        break;
      case PrimaryVenomType.Hemotoxic:
        VenomText = 'Độc Máu';
        break;
      case PrimaryVenomType.Cytotoxic:
        VenomText = 'Độc Tế bào';
        break;
      case PrimaryVenomType.Myotoxic:
        VenomText = 'Độc Cơ';
        break;
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-700 px-2 py-1 text-xs font-semibold text-white">
        <span className="relative h-2 w-2 rounded-full bg-white" />
        {VenomText}
      </span>
    );
  };

  const getVenomousBadge = (isVenomous?: boolean) => {
    const isVenom = Boolean(isVenomous);
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${isVenom ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}
      >
        <span className={`relative h-2 w-2 rounded-full ${isVenom ? 'bg-white' : 'bg-white'}`} />
        {isVenom ? 'Độc' : 'Không độc'}
      </span>
    );
  };

  const renderIdentifiedSnake = () => {
    if (!incident?.identifiedSnake) {
      return <p className="text-sm text-slate-500">Chưa xác định được loài rắn.</p>;
    }

    const snake = incident.identifiedSnake;

    return (
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex gap-3">
          <div
            className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-white"
            role="img"
            aria-label={snake.commonName}
            style={snake.imageUrl ? { backgroundImage: `url(${snake.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
          >
            {!snake.imageUrl && (
              <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs text-slate-500">
                No image
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">{snake.commonName}</p>
            <p className="text-xs text-slate-500">{snake.scientificName}</p>
            {snake.description && <p className="mt-1 text-xs text-slate-500">{snake.description}</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {snake.primaryVenomType && (
            <div className="flex items-center gap-2">
              {/* <span className="text-xs font-semibold text-slate-600">Độc tố</span> */}
              {getVenomTypeBadge(snake.primaryVenomType)}
            </div>
          )}
          {typeof snake.isVenomous === 'boolean' && (
            <div className="flex items-center gap-2">
              {/* <span className="text-xs font-semibold text-slate-600">Độc/Không</span> */}
              {getVenomousBadge(snake.isVenomous)}
            </div>
          )}
          {typeof snake.riskLevel === 'number' && (
            <div className="flex items-center gap-2">
              {/* <span className="text-xs font-semibold text-slate-600">Nguy cơ</span> */}
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${getRiskColor(snake.riskLevel)}`}>
                <span className="text-[10px] font-bold">
                  {snake.riskLevel}
                  /10
                </span>
                <span>{getRiskLabel(snake.riskLevel)}</span>
              </span>
            </div>
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
            <h2 className="text-lg font-bold text-slate-900">Chi tiết yêu cầu cấp cứu</h2>
            {incident && (
              <p className="text-xs font-semibold text-slate-600">
                {getShortIncidentId(incident.id)}
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
              : !incident
                  ? (
                      <p className="text-sm text-slate-500">Chọn case để xem chi tiết.</p>
                    )
                  : (
                      <div className="space-y-5">
                        {(() => {
                          const palette = getStatusPalette(incident.status);
                          return (
                            <div className={`rounded-xl border ${palette.border} ${palette.bg} p-4`}>
                              <p className={`text-xs font-semibold uppercase tracking-wide ${palette.text}`}>Trạng thái</p>
                              <p className={`mt-1 text-sm font-semibold ${palette.text}`}>{palette.label}</p>
                            </div>
                          );
                        })()}

                        {(() => {
                          const palette = getStatusPalette(incident.status);
                          return (
                            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                              <p className={`text-xs font-semibold uppercase tracking-wide ${palette.text}`}>Thời gian báo</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {incident.incidentOccurredAt
                                  ? new Date(incident.incidentOccurredAt).toLocaleString()
                                  : 'Không xác định'}
                              </p>
                            </div>
                          );
                        })()}

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Mức độ nghiêm trọng</p>
                                <p className="text-sm font-semibold text-amber-900">{incident.severityLevel ? getSeverityLabel(incident.severityLevel) : 'Chưa cung cấp'}</p>
                              </div>
                              <div className={`flex h-14 w-14 items-center justify-center rounded-full ${incident.severityLevel ? getSeverityClasses(incident.severityLevel) : 'bg-amber-100 text-amber-900'}`}>
                                <span className="text-2xl font-bold">{incident.severityLevel ?? '-'}</span>
                              </div>
                            </div>
                            {incident.severityLevel && (
                              <p className="mt-2 text-xs text-slate-600">(Càng cao càng nguy hiểm)</p>
                            )}
                          </div>

                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Địa chỉ</p>
                            <p className="mt-1 text-sm text-slate-900">
                              {incident.address}
                            </p>
                            <section className="grid">
                              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mt-1">Vị trí</p>
                              <p className="mt-1 text-sm text-slate-900">
                                {incident.locationCoordinates.latitude.toFixed(5)}
                                ,
                                {incident.locationCoordinates.longitude.toFixed(5)}
                              </p>
                              <button
                                type="button"
                                className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border border-emerald-600 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                onClick={onClose}
                              >
                                Xem trên bản đồ
                              </button>
                            </section>
                          </div>
                        </div>

                        {/* Active Mission - Only show for Assigned status (mission is active) */}
                        {incident.status === SnakebiteIncidentStatus.Assigned && (
                          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
                                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                                  Nhiệm vụ đang thực thi
                                </p>
                              </div>
                              <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                LIVE
                              </span>
                            </div>

                            {!incident.activeMission
                              ? (
                                  <div className="mt-3 rounded-lg border border-dashed border-purple-300 bg-white p-6 text-center">
                                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                                      <Clock className="h-5 w-5 text-purple-600 animate-pulse" />
                                    </div>
                                    <p className="text-sm font-medium text-purple-700">Đang chờ rescuer chấp nhận nhiệm vụ...</p>
                                    <p className="mt-1 text-xs text-purple-500">Mission sẽ được tạo khi rescuer xác nhận</p>
                                  </div>
                                )
                              : (
                                  <div className="mt-3 space-y-3">
                                    <div className="rounded-xl border border-purple-200 bg-white p-3 shadow-sm">
                                      <div className="flex items-start gap-3">
                                        {incident.assignedRescuer?.account?.avatarUrl
                                          ? (
                                              <img
                                                src={incident.assignedRescuer.account.avatarUrl}
                                                className="h-12 w-12 rounded-full border-2 border-purple-300 object-cover"
                                                alt={incident.assignedRescuer.account.fullName ?? 'Rescuer'}
                                              />
                                            )
                                          : (
                                              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-purple-300 bg-purple-100">
                                                <User className="h-6 w-6 text-purple-600" />
                                              </div>
                                            )}
                                        <div className="flex-1">
                                          <p className="text-sm font-semibold text-slate-900">
                                            {incident.assignedRescuer?.account?.fullName ?? 'Rescuer'}
                                          </p>
                                          <p className="text-xs text-slate-500">
                                            {incident.assignedRescuer?.phoneNumber ?? 'Không có số điện thoại '}
                                          </p>
                                          <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getMissionStatusColor(incident.activeMission.status)}`}>
                                              {getMissionStatusLabel(incident.activeMission.status)}
                                            </span>
                                            {incident.activeMission.price > 0 && (
                                              <span className="text-xs text-slate-500">
                                                Giá:
                                                {' '}
                                                {incident.activeMission.price.toLocaleString()}
                                                {' '}
                                                đ
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Mission Timeline */}
                                      <div className="mt-3 space-y-2 border-t border-purple-100 pt-3">
                                        {incident.activeMission.startedAt && (
                                          <div className="flex items-center gap-2 text-xs">
                                            <Clock className="h-3.5 w-3.5 text-purple-600" />
                                            <span className="text-slate-600">Bắt đầu:</span>
                                            <span className="font-medium text-slate-900">
                                              {new Date(incident.activeMission.startedAt).toLocaleString()}
                                            </span>
                                          </div>
                                        )}
                                        {incident.activeMission.arrivedAt && (
                                          <div className="flex items-center gap-2 text-xs">
                                            <MapPin className="h-3.5 w-3.5 text-purple-600" />
                                            <span className="text-slate-600">Đến nơi:</span>
                                            <span className="font-medium text-slate-900">
                                              {new Date(incident.activeMission.arrivedAt).toLocaleString()}
                                            </span>
                                          </div>
                                        )}
                                        {incident.activeMission.completedAt && (
                                          <div className="flex items-center gap-2 text-xs">
                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                            <span className="text-slate-600">Hoàn thành:</span>
                                            <span className="font-medium text-slate-900">
                                              {new Date(incident.activeMission.completedAt).toLocaleString()}
                                            </span>
                                          </div>
                                        )}
                                        {incident.activeMission.notes && (
                                          <div className="rounded-lg bg-slate-50 p-2 text-xs text-slate-700">
                                            <span className="font-semibold">Ghi chú:</span>
                                            {' '}
                                            {incident.activeMission.notes}
                                          </div>
                                        )}
                                        {incident.activeMission.cancellationReason && (
                                          <div className="rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
                                            <span className="font-semibold">Lý do hủy:</span>
                                            {' '}
                                            {incident.activeMission.cancellationReason}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Mission Stats */}
                                    {(incident.activeMission.estimatedCost || incident.activeMission.actualCost) && (
                                      <div className="grid grid-cols-2 gap-2">
                                        {incident.activeMission.estimatedCost && (
                                          <div className="rounded-lg border border-purple-200 bg-white p-2">
                                            <p className="text-[10px] font-semibold text-purple-600 uppercase">Chi phí ước tính</p>
                                            <p className="text-sm font-bold text-slate-900">
                                              {incident.activeMission.estimatedCost.toLocaleString()}
                                              {' '}
                                              đ
                                            </p>
                                          </div>
                                        )}
                                        {incident.activeMission.actualCost && (
                                          <div className="rounded-lg border border-emerald-200 bg-white p-2">
                                            <p className="text-[10px] font-semibold text-emerald-600 uppercase">Chi phí thực tế</p>
                                            <p className="text-sm font-bold text-slate-900">
                                              {incident.activeMission.actualCost.toLocaleString()}
                                              {' '}
                                              đ
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                          </div>
                        )}

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center gap-2">
                            <User className="size-4 text-emerald-700" />
                            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Người báo</p>
                          </div>
                          <div className="flex flex-row mt-3 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                            <img className="h-12 w-12 rounded-full border border-slate-200 object-cover" src={incident.user.account.avatarUrl ?? 'https://d11a6trkgmumsb.cloudfront.net/original/3X/d/8/d8b5d0a738295345ebd8934b859fa1fca1c8c6ad.jpeg'} alt={incident.user.account.fullName ?? incident.user.userName} />
                            <div className="ml-3">
                              <p className="mt-1 text-sm text-slate-900">
                                <span className="font-semibold">Tên:</span>
                                {' '}
                                {incident.user.account.fullName ?? incident.user.userName}
                              </p>
                              <p className="text-sm text-slate-500">
                                <span className="font-semibold">Só điện thoại:</span>
                                {' '}
                                {incident.user.phoneNumber ?? 'Không có số điện thoại'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Triệu chứng</p>
                          <div className="mt-2">{renderSymptoms()}</div>
                        </div>

                        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Loài rắn (nếu có)</p>
                          <div className="mt-2">{renderIdentifiedSnake()}</div>
                        </div>

                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Hình ảnh / bằng chứng</p>
                          <div className="mt-2">{renderMedia()}</div>
                        </div>

                        {/* Action Buttons based on status */}
                        <div className="border-t border-slate-200 pt-4">
                          <div className="flex flex-col gap-2">
                            {incident.status === SnakebiteIncidentStatus.Pending && (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={handleVerify}
                                  disabled={isActionLoading || !onVerify}
                                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <CheckCircle className="size-4" />
                                  Xác minh
                                </button>
                                <button
                                  type="button"
                                  onClick={handleFalseAlarm}
                                  disabled={isActionLoading || !onFalseAlarm}
                                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-rose-600 bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <AlertCircle className="size-4" />
                                  Báo động giả
                                </button>
                              </div>
                            )}

                            {incident.status === SnakebiteIncidentStatus.Verified && (
                              <button
                                type="button"
                                onClick={handleDispatchClick}
                                disabled={!onDispatch}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Send className="size-4" />
                                Điều phối đội cứu hộ
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Dispatch requests (history) - Always visible */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Lịch sử điều phối</p>
                            <span className="text-xs text-slate-500">
                              {dispatchRequests.length}
                              {' '}
                              yêu cầu
                            </span>
                          </div>

                          {isDispatchRequestsLoading
                            ? (
                                <div className="mt-3 flex items-center justify-center rounded-lg border border-slate-200 bg-white p-6">
                                  <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                                    <p className="text-sm text-slate-500">Đang tải danh sách yêu cầu...</p>
                                  </div>
                                </div>
                              )
                            : dispatchRequestError
                              ? (
                                  <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
                                    <p className="text-sm text-rose-700">{dispatchRequestError}</p>
                                    <button
                                      type="button"
                                      onClick={loadDispatchRequests}
                                      className="mt-2 text-xs font-semibold text-rose-600 hover:underline"
                                    >
                                      Thử lại
                                    </button>
                                  </div>
                                )
                              : dispatchRequests.length === 0
                                ? (
                                    <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
                                      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                        <Send className="h-5 w-5 text-slate-400" />
                                      </div>
                                      <p className="text-sm font-medium text-slate-600">Chưa có yêu cầu điều phối nào</p>
                                      {incident.status === SnakebiteIncidentStatus.Verified && (
                                        <p className="mt-1 text-xs text-slate-400">
                                          Nhấn nút "Điều phối đội cứu hộ" bên dưới để bắt đầu
                                        </p>
                                      )}
                                      {(incident.status === SnakebiteIncidentStatus.Pending) && (
                                        <p className="mt-1 text-xs text-slate-400">
                                          Xác minh case trước khi điều phối
                                        </p>
                                      )}
                                      {(incident.status === SnakebiteIncidentStatus.Completed || incident.status === SnakebiteIncidentStatus.FalseAlarm) && (
                                        <p className="mt-1 text-xs text-slate-400">
                                          Case đã kết thúc
                                        </p>
                                      )}
                                    </div>
                                  )
                                : (
                                    <div className="mt-3 space-y-3">
                                      {dispatchRequests.map(request => (
                                        <div
                                          key={request.requestId}
                                          className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                                        >
                                          <div className="flex items-start justify-between gap-3">
                                            <div>
                                              <p className="text-sm font-semibold text-slate-900">{request.rescuerName}</p>
                                              <p className="text-xs text-slate-500">{request.rescuerPhone}</p>
                                            </div>
                                            <span
                                              className={`whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold ${
                                                request.status === 'Pending'
                                                  ? 'bg-amber-100 text-amber-800'
                                                  : request.status === 'Accepted'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : request.status === 'Declined'
                                                      ? 'bg-rose-100 text-rose-800'
                                                      : 'bg-slate-100 text-slate-600'
                                              }`}
                                            >
                                              {request.status === 'Pending'
                                                ? 'Chờ phản hồi'
                                                : request.status === 'Accepted'
                                                  ? 'Đã chấp nhận'
                                                  : request.status === 'Declined'
                                                    ? 'Đã từ chối'
                                                    : request.status === 'Cancelled'
                                                      ? 'Đã hủy'
                                                      : request.status}
                                            </span>
                                          </div>

                                          <div className="flex flex-col gap-1 text-xs text-slate-500">
                                            <p>
                                              Gửi:
                                              {' '}
                                              {new Date(request.createdAt).toLocaleString()}
                                            </p>
                                            {request.responseAt && (
                                              <p>
                                                Phản hồi:
                                                {' '}
                                                {new Date(request.responseAt).toLocaleString()}
                                              </p>
                                            )}
                                            {request.declineReason && (
                                              <p className="rounded bg-rose-50 px-2 py-1 text-rose-700">
                                                Lý do:
                                                {' '}
                                                {request.declineReason === 'CANCELLED_BY_OPERATOR'
                                                  ? 'Điều phối viên đã hủy'
                                                  : request.declineReason === 'CANCELLED_BY_RESCUER'
                                                    ? 'Cứu hộ đã hủy'
                                                    : request.declineReason}
                                              </p>
                                            )}
                                          </div>

                                          {request.status === 'Pending' && (
                                            <button
                                              type="button"
                                              onClick={() => handleCancelDispatchRequest(request.requestId)}
                                              className="mt-2 rounded-full border border-rose-600 bg-white px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition"
                                            >
                                              Hủy yêu cầu
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                        </div>
                      </div>
                    )}
        </div>

        {/* Dispatch Rescuer Modal */}
        <DispatchRescuerModal
          incidentId={incident?.id ?? ''}
          isOpen={isDispatchModalOpen}
          onClose={() => setIsDispatchModalOpen(false)}
          onDispatch={handleDispatch}
        />
      </div>
    </div>
  );
}
