'use client';

import type { DetailSnakebiteIncidentResponse } from '@/types/snakebite-incident.type';
import { User, X } from 'lucide-react';
import { PrimaryVenomType } from '@/types/snakebite-incident.type';

export interface IncidentDetailDrawerProps {
  incident: DetailSnakebiteIncidentResponse | null;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

export default function IncidentDetailDrawer({
  incident,
  isOpen,
  isLoading,
  error,
  onClose,
}: IncidentDetailDrawerProps) {
  if (!isOpen) {
    return null;
  }

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
        return { border: 'border-amber-300', bg: 'bg-amber-50', text: 'text-amber-800' };
      case 'Verified':
        return { border: 'border-emerald-300', bg: 'bg-emerald-50', text: 'text-emerald-800' };
      case 'Assigned':
      case 'Dispatched':
      case 'EnRoute':
        return { border: 'border-sky-300', bg: 'bg-sky-50', text: 'text-sky-800' };
      case 'Completed':
        return { border: 'border-slate-300', bg: 'bg-slate-50', text: 'text-slate-800' };
      case 'FalseAlarm':
        return { border: 'border-rose-300', bg: 'bg-rose-50', text: 'text-rose-800' };
      case 'Disputed':
        return { border: 'border-violet-300', bg: 'bg-violet-50', text: 'text-violet-800' };
      default:
        return { border: 'border-slate-300', bg: 'bg-slate-50', text: 'text-slate-800' };
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
              <span className="text-xs font-semibold text-slate-600">Độc tố</span>
              {getVenomTypeBadge(snake.primaryVenomType)}
            </div>
          )}
          {typeof snake.isVenomous === 'boolean' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Độc/Không</span>
              {getVenomousBadge(snake.isVenomous)}
            </div>
          )}
          {typeof snake.riskLevel === 'number' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Nguy cơ</span>
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
    <div className="fixed right-0 top-0 bottom-0 z-50 w-[min(420px,80vw)] overflow-y-auto border-l border-slate-200 bg-white shadow-xl">
      <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Chi tiết case</h2>
          {incident && (
            <p className="text-xs font-semibold text-slate-600">
              ID:
              {incident.id}
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
                            <p className={`mt-1 text-sm font-semibold ${palette.text}`}>{incident.status}</p>
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
                          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Vị trí</p>
                          <p className="mt-1 text-sm text-slate-900">
                            {incident.locationCoordinates.latitude.toFixed(5)}
                            ,
                            {incident.locationCoordinates.longitude.toFixed(5)}
                          </p>
                          <button
                            type="button"
                            className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border border-emerald-600 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            Xem trên bản đồ
                          </button>
                        </div>
                      </div>

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
                              <span className="font-semibold">SĐT:</span>
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
                    </div>
                  )}
      </div>
    </div>
  );
}
