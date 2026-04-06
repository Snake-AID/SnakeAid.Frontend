'use client';

import type { Antivenom, AntivenomUpsertPayload } from '@/types/antivenom.type';
import { Beaker, Pencil, Plus, RefreshCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { antivenomApi } from '@/apis/antivenom.api';
import { ApiClientError } from '@/apis/client';
import AntivenomUpsertModal from '@/components/admin/AntivenomUpsertModal';
import { useToast } from '@/components/ToastProvider';

const createEmptyPayload = (): AntivenomUpsertPayload => ({
  name: '',
  manufacturer: '',
  description: '',
});

const mapToPayload = (item: Antivenom): AntivenomUpsertPayload => ({
  name: item.name ?? '',
  manufacturer: item.manufacturer ?? '',
  description: item.description ?? '',
});

const getValidationMessage = (err: unknown, fallback: string) => {
  if (!(err instanceof ApiClientError)) {
    return fallback;
  }

  const validationEntries = Object.entries(err.error?.validationErrors ?? {});
  if (!validationEntries.length) {
    return err.message || fallback;
  }

  return validationEntries
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join(' | ');
};

export default function AntivenomsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Antivenom[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Antivenom | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSession, setModalSession] = useState(0);
  const [formMode, setFormMode] = useState<'create' | 'update'>('create');
  const [formInitialValue, setFormInitialValue] = useState<AntivenomUpsertPayload>(() => createEmptyPayload());
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedSummary = useMemo(
    () => items.find(item => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const loadList = async (preferredId?: number | null, pinToTop = false) => {
    setIsListLoading(true);
    setListError(null);

    try {
      const data = await antivenomApi.getAll();
      const ordered = pinToTop && preferredId != null
        ? [
            ...data.filter(item => item.id === preferredId),
            ...data.filter(item => item.id !== preferredId),
          ]
        : data;

      setItems(ordered);
      setSelectedId((prev) => {
        const targetId = preferredId ?? prev;
        if (targetId != null && ordered.some(item => item.id === targetId)) {
          return targetId;
        }

        return ordered[0]?.id ?? null;
      });
    } catch (err) {
      console.error('Failed to load antivenoms', err);
      setListError('Không thể tải danh sách huyết thanh. Vui lòng thử lại.');
      showToast('Không thể tải danh sách huyết thanh.', { type: 'error' });
    } finally {
      setIsListLoading(false);
    }
  };

  const loadDetail = async (id: number) => {
    setIsDetailLoading(true);
    setDetailError(null);

    try {
      const detail = await antivenomApi.getById(id);
      setSelectedDetail(detail);
    } catch (err) {
      console.error('Failed to load antivenom detail', err);
      setSelectedDetail(null);
      setDetailError('Không thể tải chi tiết huyết thanh. Vui lòng thử lại.');
      showToast('Không thể tải chi tiết huyết thanh.', { type: 'error' });
    } finally {
      setIsDetailLoading(false);
    }
  };

  const openCreateForm = () => {
    setActionError(null);
    setFormMode('create');
    setFormInitialValue(createEmptyPayload());
    setModalSession(prev => prev + 1);
    setIsModalOpen(true);
  };

  const openUpdateForm = async () => {
    if (selectedId == null) {
      return;
    }

    setActionError(null);

    try {
      const latest = await antivenomApi.getById(selectedId);
      setFormMode('update');
      setFormInitialValue(mapToPayload(latest));
      setModalSession(prev => prev + 1);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to load antivenom before update', err);
      setActionError('Không thể tải dữ liệu mới nhất để cập nhật. Vui lòng thử lại.');
      showToast('Không thể tải dữ liệu huyết thanh để cập nhật.', { type: 'error' });
    }
  };

  const submitUpsert = async (payload: AntivenomUpsertPayload) => {
    setIsSubmittingForm(true);
    setActionError(null);

    const normalized: AntivenomUpsertPayload = {
      name: payload.name.trim(),
      manufacturer: payload.manufacturer.trim(),
      description: payload.description.trim(),
    };

    try {
      let targetId: number | null = null;

      if (formMode === 'create') {
        const created = await antivenomApi.create(normalized);
        targetId = created.id;
      } else if (selectedId != null) {
        const updated = await antivenomApi.update(selectedId, normalized);
        targetId = updated.id ?? selectedId;
      }

      if (targetId != null) {
        await loadList(targetId, formMode === 'create');
        await loadDetail(targetId);
      }

      showToast(formMode === 'create' ? 'Đã tạo huyết thanh mới.' : 'Đã cập nhật huyết thanh.', { type: 'success' });

      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to submit antivenom form', err);
      const fallback = formMode === 'create'
        ? 'Tạo huyết thanh thất bại. Vui lòng kiểm tra dữ liệu rồi thử lại.'
        : 'Cập nhật huyết thanh thất bại. Vui lòng thử lại.';

      const validationMessage = getValidationMessage(err, fallback);
      setActionError(validationMessage);
      showToast(validationMessage, { type: 'error' });
      throw err;
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleDelete = async () => {
    if (selectedId == null || isDeleting) {
      return;
    }

    // eslint-disable-next-line no-alert
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa huyết thanh này không?');
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setActionError(null);

    try {
      await antivenomApi.remove(selectedId);
      await loadList(null);
      setSelectedDetail(null);
      showToast('Đã xóa huyết thanh.', { type: 'success' });
    } catch (err) {
      console.error('Failed to delete antivenom', err);
      setActionError('Xóa huyết thanh thất bại. Vui lòng thử lại.');
      showToast('Xóa huyết thanh thất bại.', { type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    void loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId == null) {
      return;
    }

    void loadDetail(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-360 flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Quản lý huyết thanh</h2>
              <p className="mt-1 text-sm text-slate-500">
                Quản lý danh sách huyết thanh kháng nọc phục vụ xử lý cấp cứu.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                <Plus className="size-4" />
                Thêm huyết thanh
              </button>
              <button
                type="button"
                onClick={() => void loadList(selectedId)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <RefreshCcw className="size-4" />
                Làm mới
              </button>
            </div>
          </div>

          {actionError && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {actionError}
            </div>
          )}
        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Danh sách huyết thanh</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {items.length}
                  {' '}
                  loại
                </span>
              </div>

              {isListLoading && (
                <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                  Đang tải dữ liệu...
                </div>
              )}

              {!isListLoading && listError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {listError}
                </div>
              )}

              {!isListLoading && !listError && (
                <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                  {items.map((item) => {
                    const isActive = item.id === selectedId;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          isActive
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.manufacturer}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 xl:col-span-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {selectedId == null && (
                <div className="flex h-80 flex-col items-center justify-center text-center text-slate-500">
                  <ShieldCheck className="mb-3 size-10 text-slate-300" />
                  <p className="text-sm">Chọn một loại huyết thanh để xem chi tiết.</p>
                </div>
              )}

              {selectedId != null && isDetailLoading && (
                <div className="flex h-80 items-center justify-center text-sm text-slate-500">
                  Đang tải chi tiết huyết thanh...
                </div>
              )}

              {selectedId != null && !isDetailLoading && detailError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {detailError}
                </div>
              )}

              {selectedId != null && !isDetailLoading && !detailError && selectedDetail && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-xl bg-teal-100 p-3 text-teal-700">
                        <Beaker className="size-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">{selectedDetail.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{selectedDetail.manufacturer}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void openUpdateForm()}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Pencil className="size-3.5" />
                        Cập nhật
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete()}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <Trash2 className="size-3.5" />
                        {isDeleting ? 'Đang xóa...' : 'Xóa'}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="mb-2 text-sm font-bold text-slate-800">Mô tả</h4>
                    <p className="text-sm leading-6 text-slate-700">{selectedDetail.description}</p>
                  </div>
                </div>
              )}

              {selectedId != null && !isDetailLoading && !detailError && !selectedDetail && selectedSummary && (
                <div className="flex h-72 items-center justify-center text-sm text-slate-500">
                  Không tìm thấy dữ liệu chi tiết cho
                  {' '}
                  {selectedSummary.name}
                  .
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <AntivenomUpsertModal
        key={modalSession}
        isOpen={isModalOpen}
        mode={formMode}
        initialValue={formInitialValue}
        isSubmitting={isSubmittingForm}
        onClose={() => setIsModalOpen(false)}
        onSubmit={submitUpsert}
      />
    </main>
  );
}
