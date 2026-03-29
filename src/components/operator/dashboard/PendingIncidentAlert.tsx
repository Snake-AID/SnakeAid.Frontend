interface PendingIncidentAlertProps {
  incidentId: string;
  focusedIncident: { lat: number; lng: number } | null;
  onViewDetail: (id: string) => void;
  onHide: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export default function PendingIncidentAlert({
  incidentId,
  focusedIncident,
  onViewDetail,
  onHide,
  onConfirm,
}: PendingIncidentAlertProps) {
  return (
    <div className="fixed bottom-4 right-4 z-9999 w-[min(100%,420px)]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">Case mới đã được báo</h2>
        <p className="mt-2 text-sm text-slate-600">
          Case mới đã được ghim trên bản đồ; hãy xác nhận để đưa vào luồng xử lý.
        </p>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">Case ID</p>
          <p className="mt-1 text-sm text-slate-800">{incidentId}</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">Vị trí</p>
          <p className="mt-1 text-sm text-slate-800">
            {focusedIncident?.lat.toFixed(5)}
            ,
            {focusedIncident?.lng.toFixed(5)}
          </p>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onViewDetail(incidentId)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Xem chi tiết
          </button>
          <button
            type="button"
            onClick={onHide}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Ẩn
          </button>
          <button
            type="button"
            onClick={() => onConfirm(incidentId)}
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Xác nhận case
          </button>
        </div>
      </div>
    </div>
  );
}
