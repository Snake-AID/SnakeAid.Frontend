interface PendingRequestAlertProps {
  requestId: string;
  focusedRequest: { lat: number; lng: number } | null;
  onViewDetail: (id: string) => void;
  onHide: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export default function PendingRequestAlert({
  requestId,
  focusedRequest,
  onViewDetail,
  onHide,
  onConfirm,
}: PendingRequestAlertProps) {
  return (
    <div className="fixed bottom-4 right-4 z-9999 w-[min(100%,420px)]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">Yêu cầu bắt rắn mới</h2>
        <p className="mt-2 text-sm text-slate-600">
          Yêu cầu mới đã được ghim trên bản đồ; hãy xác nhận để đưa vào luồng xử lý.
        </p>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">Request ID</p>
          <p className="mt-1 text-sm text-slate-800">{requestId}</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">Vị trí</p>
          <p className="mt-1 text-sm text-slate-800">
            {focusedRequest?.lat.toFixed(5)}
            ,
            {focusedRequest?.lng.toFixed(5)}
          </p>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onViewDetail(requestId)}
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
            onClick={() => onConfirm(requestId)}
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Xác nhận yêu cầu
          </button>
        </div>
      </div>
    </div>
  );
}
