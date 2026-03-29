interface RescuerAbortAlertProps {
  incidentId: string;
  reason?: string;
  onViewDetail: (id: string) => void;
  onDismiss: () => void;
  onRedispatch: (id: string) => void;
}

export default function RescuerAbortAlert({
  incidentId,
  reason,
  onViewDetail,
  onDismiss,
  onRedispatch,
}: RescuerAbortAlertProps) {
  const incidentCode = `INC-${incidentId.slice(-6).toUpperCase()}`;

  return (
    <div className="fixed bottom-4 right-4 z-9999 w-[min(100%,420px)]">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-xl">
        <h2 className="text-lg font-bold text-amber-900">⚠️ Rescuer đã hủy mission</h2>
        <p className="mt-2 text-sm text-amber-800">
          Rescuer đã hủy mission cho case
          {' '}
          <span className="font-semibold">{incidentCode}</span>
          . Case cần được điều phối lại.
        </p>
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
            onClick={() => onViewDetail(incidentId)}
            className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50"
          >
            Xem chi tiết
          </button>
          <button
            type="button"
            onClick={() => onRedispatch(incidentId)}
            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Điều phối lại
          </button>
        </div>
      </div>
    </div>
  );
}
