'use client';

import type { FirstAidGuideline, FirstAidGuidelineOption } from '@/types/first-aid-guideline.type';
import type { VenomType, VenomTypeUpsertPayload } from '@/types/venom-type.type';
import { FlaskConical, Pencil, Plus, RefreshCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ApiClientError } from '@/apis/client';
import { firstAidGuidelineApi } from '@/apis/first-aid-guideline.api';
import { venomTypeApi } from '@/apis/venom-type.api';
import VenomTypeUpsertModal from '@/components/admin/VenomTypeUpsertModal';

const createEmptyPayload = (): VenomTypeUpsertPayload => ({
  name: '',
  scientificName: '',
  description: '',
  isActive: true,
  severityIndex: 1,
  firstAidGuidelineId: 0,
});

const mapToPayload = (item: VenomType): VenomTypeUpsertPayload => ({
  name: item.name ?? '',
  scientificName: item.scientificName ?? '',
  description: item.description ?? '',
  isActive: item.isActive ?? true,
  severityIndex: item.severityIndex ?? 1,
  firstAidGuidelineId: item.firstAidGuidelineId ?? 0,
});

const getFirstAidLabel = (guideline: FirstAidGuideline) => {
  const name = typeof guideline.name === 'string' ? guideline.name.trim() : '';
  const title = typeof guideline.title === 'string' ? guideline.title.trim() : '';
  const fallback = name || title || `Guideline #${guideline.id}`;
  return `${guideline.id} - ${fallback}`;
};

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

export default function VenomTypesPage() {
  const [items, setItems] = useState<VenomType[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<VenomType | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSession, setModalSession] = useState(0);
  const [formMode, setFormMode] = useState<'create' | 'update'>('create');
  const [formInitialValue, setFormInitialValue] = useState<VenomTypeUpsertPayload>(() => createEmptyPayload());
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [firstAidOptions, setFirstAidOptions] = useState<FirstAidGuidelineOption[]>([]);
  const [firstAidDetail, setFirstAidDetail] = useState<FirstAidGuideline | null>(null);

  const selectedSummary = useMemo(
    () => items.find(item => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const firstAidOptionMap = useMemo(
    () => firstAidOptions.reduce<Record<number, string>>((acc, option) => {
      acc[option.id] = option.label;
      return acc;
    }, {}),
    [firstAidOptions],
  );

  const loadFirstAidOptions = async (): Promise<FirstAidGuidelineOption[]> => {
    try {
      const data = await firstAidGuidelineApi.getAll();
      const options = data.map(item => ({
        id: item.id,
        label: getFirstAidLabel(item),
      }));
      setFirstAidOptions(options);
      return options;
    } catch (err) {
      console.error('Failed to load first aid guidelines', err);
      return [];
    }
  };

  const loadFirstAidDetail = async (id: number) => {
    try {
      const detail = await firstAidGuidelineApi.getById(id);
      setFirstAidDetail(detail);
    } catch (err) {
      console.error('Failed to load first aid guideline detail', err);
      setFirstAidDetail(null);
    }
  };

  const loadList = async (preferredId?: number | null, pinToTop = false) => {
    setIsListLoading(true);
    setListError(null);

    try {
      const data = await venomTypeApi.getAll();
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
      console.error('Failed to load venom types', err);
      setListError('Không thể tải danh sách loại độc rắn. Vui lòng thử lại.');
    } finally {
      setIsListLoading(false);
    }
  };

  const loadDetail = async (id: number) => {
    setIsDetailLoading(true);
    setDetailError(null);

    try {
      const detail = await venomTypeApi.getById(id);
      setSelectedDetail(detail);
    } catch (err) {
      console.error('Failed to load venom type detail', err);
      setSelectedDetail(null);
      setDetailError('Không thể tải chi tiết loại độc rắn. Vui lòng thử lại.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const openCreateForm = async () => {
    setActionError(null);

    try {
      // Refresh latest data before opening create form.
      await loadList(selectedId);
      const latestFirstAidOptions = await loadFirstAidOptions();
      const defaultFirstAidId = latestFirstAidOptions[0]?.id ?? 0;

      setFormMode('create');
      setFormInitialValue({
        ...createEmptyPayload(),
        firstAidGuidelineId: defaultFirstAidId,
      });
      setModalSession(prev => prev + 1);
      setIsModalOpen(true);
    } catch {
      // Ignore refresh errors here and still allow create.
      setFormMode('create');
      setFormInitialValue(createEmptyPayload());
      setModalSession(prev => prev + 1);
      setIsModalOpen(true);
    }
  };

  const openUpdateForm = async () => {
    if (selectedId == null) {
      return;
    }

    setActionError(null);

    try {
      await loadFirstAidOptions();
      const latest = await venomTypeApi.getById(selectedId);
      setFormMode('update');
      setFormInitialValue(mapToPayload(latest));
      setModalSession(prev => prev + 1);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to load venom type before update', err);
      setActionError('Không thể tải dữ liệu mới nhất để cập nhật. Vui lòng thử lại.');
    }
  };

  const submitUpsert = async (payload: VenomTypeUpsertPayload) => {
    setIsSubmittingForm(true);
    setActionError(null);

    const normalized: VenomTypeUpsertPayload = {
      name: payload.name.trim(),
      scientificName: payload.scientificName.trim(),
      description: payload.description.trim(),
      isActive: payload.isActive,
      severityIndex: Number(payload.severityIndex),
      firstAidGuidelineId: Number(payload.firstAidGuidelineId),
    };

    try {
      let targetId: number | null = null;

      if (formMode === 'create') {
        const created = await venomTypeApi.create(normalized);
        targetId = created.id;
      } else if (selectedId != null) {
        const updated = await venomTypeApi.update(selectedId, normalized);
        targetId = updated.id ?? selectedId;
      }

      if (targetId != null) {
        await loadList(targetId, formMode === 'create');
        await loadDetail(targetId);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to submit venom type form', err);
      const fallback = formMode === 'create'
        ? 'Tạo loại độc rắn thất bại. Vui lòng kiểm tra dữ liệu rồi thử lại.'
        : 'Cập nhật loại độc rắn thất bại. Vui lòng thử lại.';

      const validationMessage = getValidationMessage(err, fallback);
      setActionError(validationMessage);
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
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa loại độc rắn này không?');
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setActionError(null);

    try {
      await venomTypeApi.remove(selectedId);
      await loadList(null);
      setSelectedDetail(null);
    } catch (err) {
      console.error('Failed to delete venom type', err);
      setActionError('Xóa loại độc rắn thất bại. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    void loadList();
    void loadFirstAidOptions();
  }, []);

  useEffect(() => {
    if (selectedId == null) {
      return;
    }

    void loadDetail(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (selectedDetail?.firstAidGuidelineId == null || selectedDetail.firstAidGuidelineId <= 0) {
      setFirstAidDetail(null);
      return;
    }

    void loadFirstAidDetail(selectedDetail.firstAidGuidelineId);
  }, [selectedDetail?.firstAidGuidelineId]);

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-360 flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Quản lý loại độc rắn</h2>
              <p className="mt-1 text-sm text-slate-500">
                Quản lý danh mục loại độc, mức độ nghiêm trọng và thông tin sơ cứu liên quan.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void openCreateForm()}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                <Plus className="size-4" />
                Thêm loại độc
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
                <h3 className="text-base font-bold text-slate-900">Danh sách loại độc rắn</h3>
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
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            Mức
                            {' '}
                            {item.severityIndex}
                          </span>
                        </div>
                        <p className="mt-1 text-xs italic text-slate-500">{item.scientificName}</p>
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
                  <p className="text-sm">Chọn một loại độc rắn để xem chi tiết.</p>
                </div>
              )}

              {selectedId != null && isDetailLoading && (
                <div className="flex h-80 items-center justify-center text-sm text-slate-500">
                  Đang tải chi tiết loại độc rắn...
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
                        <FlaskConical className="size-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">{selectedDetail.name}</h3>
                        <p className="mt-1 text-sm italic text-slate-500">{selectedDetail.scientificName}</p>
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

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      Mức độ nghiêm trọng
                      {' '}
                      {selectedDetail.severityIndex}
                      /10
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${selectedDetail.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {selectedDetail.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      FirstAid Guideline
                      {' '}
                      {firstAidOptionMap[selectedDetail.firstAidGuidelineId] ?? `#${selectedDetail.firstAidGuidelineId}`}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="mb-2 text-sm font-bold text-slate-800">Mô tả</h4>
                    <p className="text-sm leading-6 text-slate-700">{selectedDetail.description}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="mb-2 text-sm font-bold text-slate-800">FirstAid guideline liên kết</h4>
                    <p className="text-sm text-slate-700">
                      {firstAidOptionMap[selectedDetail.firstAidGuidelineId] ?? `Guideline #${selectedDetail.firstAidGuidelineId}`}
                    </p>
                    {firstAidDetail?.description && (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {firstAidDetail.description}
                      </p>
                    )}
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

      <VenomTypeUpsertModal
        key={modalSession}
        isOpen={isModalOpen}
        mode={formMode}
        initialValue={formInitialValue}
        firstAidOptions={firstAidOptions}
        isSubmitting={isSubmittingForm}
        onClose={() => setIsModalOpen(false)}
        onSubmit={submitUpsert}
      />
    </main>
  );
}
