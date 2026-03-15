'use client';

import { AlertTriangle, ArrowUpRight, CircleCheck, ClipboardCheck, ShieldAlert, Timer } from 'lucide-react';
import { useMemo, useState } from 'react';

type DisputeStatus = 'Mới' | 'Đang xử lý' | 'Chờ xác minh' | 'Đã chốt';

interface DisputeCase {
  id: number;
  incidentCode: string;
  title: string;
  reason: string;
  raisedBy: string;
  raisedAt: string;
  slaLeftMin: number;
  status: DisputeStatus;
  detail: string;
}

const mockDisputes: DisputeCase[] = [
  {
    id: 1,
    incidentCode: 'INC-240315-014',
    title: 'Đội cứu hộ báo không thể tiếp cận hiện trường',
    reason: 'RescuerAborted',
    raisedBy: 'Đội cứu hộ B',
    raisedAt: '09:03',
    slaLeftMin: 8,
    status: 'Mới',
    detail: 'Đường vào bị chặn, cần điều phối đội khác hoặc cập nhật điểm hẹn mới với người báo tin.',
  },
  {
    id: 2,
    incidentCode: 'INC-240315-021',
    title: 'Người báo tin phản hồi vị trí sai lệch',
    reason: 'ReporterConflict',
    raisedBy: 'Người báo tin',
    raisedAt: '08:57',
    slaLeftMin: 16,
    status: 'Đang xử lý',
    detail: 'Cần gọi lại để xác nhận mốc đường mới, ảnh hiện trường và chia sẻ định vị trực tiếp.',
  },
  {
    id: 3,
    incidentCode: 'INC-240315-009',
    title: 'Tranh chấp ưu tiên giữa hai sự cố cùng khu vực',
    reason: 'PriorityConflict',
    raisedBy: 'Điều phối viên ca trước',
    raisedAt: '08:40',
    slaLeftMin: 0,
    status: 'Chờ xác minh',
    detail: 'Yêu cầu trưởng ca xác nhận thứ tự ưu tiên và phân bổ lại đội dự bị.',
  },
];

const statusToneMap: Record<DisputeStatus, string> = {
  'Mới': 'bg-rose-50 text-rose-700',
  'Đang xử lý': 'bg-amber-50 text-amber-700',
  'Chờ xác minh': 'bg-sky-50 text-sky-700',
  'Đã chốt': 'bg-emerald-50 text-emerald-700',
};

export default function OperatorEscalationsPage() {
  const [activeStatus, setActiveStatus] = useState<DisputeStatus | 'Tất cả'>('Tất cả');
  const [selectedDisputeId, setSelectedDisputeId] = useState<number>(mockDisputes[0]?.id ?? 0);
  const [toast, setToast] = useState('Có 1 tranh chấp mới cần xử lý trong 10 phút tới.');

  const filteredDisputes = useMemo(() => {
    if (activeStatus === 'Tất cả') {
      return mockDisputes;
    }

    return mockDisputes.filter(item => item.status === activeStatus);
  }, [activeStatus]);

  const selectedDispute = filteredDisputes.find(item => item.id === selectedDisputeId)
    ?? filteredDisputes[0]
    ?? mockDisputes[0];

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50/80">
      <div className="mx-auto flex max-w-360 flex-col gap-6 px-6 py-6">
        <section className="rounded-3xl border border-teal-200/60 bg-linear-to-r from-teal-900 via-teal-800 to-teal-700 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-100">Giải quyết tranh chấp</p>
              <h1 className="mt-2 text-3xl font-bold">Bảng theo dõi tranh chấp sự cố</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-teal-50/90">
                Tập trung các case cần xác minh bổ sung, xung đột ưu tiên và tình huống rescuer từ chối hoặc hủy nhiệm vụ.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-105">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-teal-100">Tổng tranh chấp</p>
                <p className="mt-1 text-2xl font-bold">{mockDisputes.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-teal-100">Sắp quá SLA</p>
                <p className="mt-1 text-2xl font-bold">{mockDisputes.filter(item => item.slaLeftMin > 0 && item.slaLeftMin <= 10).length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-teal-100">Đang xử lý</p>
                <p className="mt-1 text-2xl font-bold">{mockDisputes.filter(item => item.status === 'Đang xử lý').length}</p>
              </div>
            </div>
          </div>
        </section>

        {toast && (
          <section className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Cảnh báo tranh chấp</p>
              <p className="mt-1">{toast}</p>
            </div>
            <button
              type="button"
              onClick={() => setToast('')}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
            >
              Đóng
            </button>
          </section>
        )}

        <section className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-4">
                <h2 className="text-base font-bold text-slate-900">Danh sách tranh chấp</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(['Tất cả', 'Mới', 'Đang xử lý', 'Chờ xác minh', 'Đã chốt'] as const).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setActiveStatus(status)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        activeStatus === status
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[calc(100vh-330px)] space-y-3 overflow-y-auto p-4">
                {filteredDisputes.map((dispute) => {
                  const isActive = dispute.id === selectedDispute?.id;

                  return (
                    <button
                      key={dispute.id}
                      type="button"
                      onClick={() => setSelectedDisputeId(dispute.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        isActive
                          ? 'border-teal-300 bg-teal-50/70 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900">{dispute.incidentCode}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusToneMap[dispute.status]}`}>
                          {dispute.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{dispute.title}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span>{dispute.raisedAt}</span>
                        <span>
                          {dispute.slaLeftMin > 0 ? `Còn ${dispute.slaLeftMin} phút SLA` : 'Đã quá SLA'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-7">
            {selectedDispute && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedDispute.incidentCode}</h2>
                      <p className="mt-2 text-sm text-slate-600">{selectedDispute.title}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                          Lý do:
                          {' '}
                          {selectedDispute.reason}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 font-semibold ${statusToneMap[selectedDispute.status]}`}>
                          {selectedDispute.status}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
                    >
                      <CircleCheck className="size-4" />
                      Chốt tranh chấp
                    </button>
                  </div>
                </div>

                <div className="space-y-5 p-5">
                  <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <ClipboardCheck className="size-4 text-teal-700" />
                      Chi tiết tranh chấp
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{selectedDispute.detail}</p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white p-3 shadow-sm">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Khởi tạo bởi</p>
                        <p className="mt-1 font-semibold text-slate-800">{selectedDispute.raisedBy}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3 shadow-sm">
                        <p className="text-xs uppercase tracking-wide text-slate-400">SLA còn lại</p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {selectedDispute.slaLeftMin > 0 ? `${selectedDispute.slaLeftMin} phút` : 'Đã quá hạn'}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Timer className="size-4 text-teal-700" />
                      Hành động đề xuất
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        Gọi xác minh người báo tin
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-100"
                      >
                        Mở Bảng điều phối
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                      >
                        Chuyển trưởng ca xác nhận
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                      >
                        Đánh dấu cần điều phối lại
                      </button>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 size-5 text-amber-600" />
                      <div>
                        <p className="font-semibold text-slate-800">Lưu ý vận hành</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Với tranh chấp có SLA dưới 10 phút, ưu tiên xử lý ngay hoặc chuyển trưởng ca để tránh trễ nhịp điều phối.
                        </p>
                        <button
                          type="button"
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <ArrowUpRight className="size-3.5" />
                          Xem log sự kiện đầy đủ
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
