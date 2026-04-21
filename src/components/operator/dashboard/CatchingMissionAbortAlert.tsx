interface CatchingMissionAbortAlertProps {
  requestId: string;
  missionId?: string;
  rescuerName?: string | null;
  reason?: string | null;
  onViewDetail: (id: string) => void;
  onDismiss: () => void;
}

export default function CatchingMissionAbortAlert({
  requestId,
  rescuerName,
  reason,
  onViewDetail,
  onDismiss,
}: CatchingMissionAbortAlertProps) {
  const requestCode = `CAR-${requestId.slice(-6).toUpperCase()}`;

  return (
    <div className="fixed bottom-4 right-4 z-9999 w-[min(100%,420px)]">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-xl">
        <h2 className="text-lg font-bold text-amber-900">⚠️ Nhiệm vụ bắt rắn bị hủy </h2>
        <p className="mt-2 text-sm text-amber-800">
          Cứu hộ viên đã hủy nhiệm vụ cho yêu cầu
          {' '}
          <span className="font-semibold">{requestCode}</span>
          .
        </p>
        {rescuerName && (
          <p className="mt-1 text-sm text-amber-800">
            Cứu hộ viên:
            {' '}
            {rescuerName}
          </p>
        )}
        {reason && (
          <div className="mt-4 rounded-2xl border border-amber-300 bg-white p-4">
            <p className="text-sm font-semibold text-amber-900">Lý do</p>
            <p className="mt-1 text-sm text-amber-800">{reason}</p>
          </div>
        )}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => onViewDetail(requestId)}
            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}
