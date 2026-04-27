'use client';

import type {
  FirstAidGuideline,
  FirstAidGuidelineDraftContent,
  FirstAidGuidelineUpsertPayload,
} from '@/types/first-aid-guideline.type';
import type { VenomType } from '@/types/venom-type.type';
import { BookOpenText, Pencil, Plus, RefreshCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ApiClientError } from '@/apis/client';
import { firstAidGuidelineApi } from '@/apis/first-aid-guideline.api';
import { venomTypeApi } from '@/apis/venom-type.api';
import FirstAidGuidelineUpsertModal, {
  createEmptyFirstAidGuidelinePayload,
} from '@/components/admin/FirstAidGuidelineUpsertModal';
import { useToast } from '@/components/ToastProvider';

const sanitizeText = (value: string) => value.trim();

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('vi-VN', { hour12: false });
};

const normalizeMediaUrl = (value: string | null | undefined) => {
  const content = value?.trim() ?? '';
  return content.length > 0 ? content : null;
};

const getGuidelineTypeLabel = (value: string | null | undefined) => {
  const normalized = (value ?? '').trim().toLowerCase().replace(/_/g, '');

  switch (normalized) {
    case 'general':
      return 'Bộ sơ cứu chung';
    case 'venomspecific':
      return 'Bộ sơ cứu riêng từng loài';
    default:
      return value ?? '-';
  }
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof ApiClientError)) {
    return fallback;
  }

  const validationEntries = Object.entries(error.error?.validationErrors ?? {});
  if (validationEntries.length > 0) {
    return validationEntries
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join(' | ');
  }

  return fallback;
};

const mapToDraftPayload = (item: FirstAidGuideline): FirstAidGuidelineUpsertPayload => ({
  name: item.name,
  type: item.type ?? 'General',
  summary: item.summary ?? '',
  content: {
    steps: item.content.steps.map(step => ({
      text: step.text,
      mediaUrl: step.mediaUrl,
      mediaId: null,
    })),
    dos: item.content.dos.map(step => ({
      text: step.text,
      mediaUrl: step.mediaUrl,
      mediaId: null,
    })),
    donts: item.content.donts.map(step => ({
      text: step.text,
      mediaUrl: step.mediaUrl,
      mediaId: null,
    })),
    notes: [...item.content.notes],
  },
});

const normalizeContent = (content: FirstAidGuidelineDraftContent) => ({
  steps: content.steps
    .map(item => ({
      text: sanitizeText(item.text),
      mediaUrl: item.mediaUrl?.trim() || null,
      mediaId: item.mediaId?.trim() || null,
    }))
    .filter(item => item.text.length > 0),
  dos: content.dos
    .map(item => ({
      text: sanitizeText(item.text),
      mediaUrl: item.mediaUrl?.trim() || null,
      mediaId: item.mediaId?.trim() || null,
    }))
    .filter(item => item.text.length > 0),
  donts: content.donts
    .map(item => ({
      text: sanitizeText(item.text),
      mediaUrl: item.mediaUrl?.trim() || null,
      mediaId: item.mediaId?.trim() || null,
    }))
    .filter(item => item.text.length > 0),
  notes: content.notes.map(sanitizeText).filter(Boolean),
});

export default function FirstAidGuidelinesPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<FirstAidGuideline[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<FirstAidGuideline | null>(null);
  const [venomTypes, setVenomTypes] = useState<VenomType[]>([]);

  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSession, setModalSession] = useState(0);
  const [formMode, setFormMode] = useState<'create' | 'update'>('create');
  const [formInitialValue, setFormInitialValue] = useState<FirstAidGuidelineUpsertPayload>(() => createEmptyFirstAidGuidelinePayload());
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedSummary = useMemo(
    () => items.find(item => item.id === selectedId) ?? null,
    [items, selectedId],
  );
  const linkedVenomTypes = useMemo(() => {
    if (!selectedDetail) {
      return [] as VenomType[];
    }

    return venomTypes.filter(item => item.firstAidGuidelineId === selectedDetail.id);
  }, [selectedDetail, venomTypes]);

  const loadList = async (preferredId?: number | null, pinToTop = false) => {
    setIsListLoading(true);
    setListError(null);

    try {
      const response = await firstAidGuidelineApi.getAll();

      const ordered = pinToTop && preferredId != null
        ? [
            ...response.filter(item => item.id === preferredId),
            ...response.filter(item => item.id !== preferredId),
          ]
        : response;

      setItems(ordered);
      setSelectedId((prev) => {
        const targetId = preferredId ?? prev;
        if (targetId != null && ordered.some(item => item.id === targetId)) {
          return targetId;
        }

        return ordered[0]?.id ?? null;
      });
    } catch (error) {
      console.error('Failed to load first aid guidelines', error);
      setItems([]);
      setListError('Không thể tải danh sách bộ sơ cứu. Vui lòng thử lại.');
      showToast('Không thể tải danh sách bộ sơ cứu.', { type: 'error' });
    } finally {
      setIsListLoading(false);
    }
  };

  const loadDetail = async (id: number) => {
    setIsDetailLoading(true);
    setDetailError(null);

    try {
      const detail = await firstAidGuidelineApi.getById(id);
      setSelectedDetail(detail);
    } catch (error) {
      console.error('Failed to load first aid guideline detail', error);
      setSelectedDetail(null);
      setDetailError('Không thể tải chi tiết bộ sơ cứu. Vui lòng thử lại.');
      showToast('Không thể tải chi tiết bộ sơ cứu.', { type: 'error' });
    } finally {
      setIsDetailLoading(false);
    }
  };

  const loadVenomTypes = async () => {
    try {
      const data = await venomTypeApi.getAll();
      setVenomTypes(data);
    } catch (error) {
      console.error('Failed to load venom types for first aid view', error);
      setVenomTypes([]);
    }
  };

  const openCreateForm = () => {
    setActionError(null);
    setFormMode('create');
    setFormInitialValue(createEmptyFirstAidGuidelinePayload());
    setModalSession(prev => prev + 1);
    setIsModalOpen(true);
  };

  const openUpdateForm = async () => {
    if (selectedId == null) {
      return;
    }

    setActionError(null);

    try {
      const latest = await firstAidGuidelineApi.getById(selectedId);
      setFormMode('update');
      setFormInitialValue(mapToDraftPayload(latest));
      setModalSession(prev => prev + 1);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to load first aid guideline before update', error);
      const message = 'Không thể tải dữ liệu mới nhất để cập nhật. Vui lòng thử lại.';
      setActionError(message);
      showToast(message, { type: 'error' });
    }
  };

  const submitUpsert = async (payload: FirstAidGuidelineUpsertPayload) => {
    setIsSubmittingForm(true);
    setActionError(null);

    const normalized: FirstAidGuidelineUpsertPayload = {
      name: sanitizeText(payload.name),
      type: payload.type,
      summary: sanitizeText(payload.summary ?? '') || null,
      content: normalizeContent(payload.content),
    };

    try {
      let targetId: number | null = null;

      if (formMode === 'create') {
        const created = await firstAidGuidelineApi.create(normalized);
        targetId = created.id;
      } else if (selectedId != null) {
        const updated = await firstAidGuidelineApi.update(selectedId, normalized);
        targetId = updated.id ?? selectedId;
      }

      if (targetId != null) {
        await loadList(targetId, formMode === 'create');
        await loadDetail(targetId);
      }

      showToast(formMode === 'create' ? 'Đã tạo bộ sơ cứu mới.' : 'Đã cập nhật bộ sơ cứu.', { type: 'success' });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to submit first aid guideline form', error);
      const fallback = formMode === 'create'
        ? 'Tạo bộ sơ cứu thất bại. Vui lòng kiểm tra dữ liệu rồi thử lại.'
        : 'Cập nhật bộ sơ cứu thất bại. Vui lòng thử lại.';

      const validationMessage = getApiErrorMessage(error, fallback);
      setActionError(validationMessage);
      showToast(validationMessage, { type: 'error' });
      throw error;
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleDelete = async () => {
    if (selectedId == null || isDeleting) {
      return;
    }

    // eslint-disable-next-line no-alert
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa bộ sơ cứu này không?');
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setActionError(null);

    try {
      await firstAidGuidelineApi.remove(selectedId);
      await loadList(null);
      setSelectedDetail(null);
      showToast('Đã xóa bộ sơ cứu.', { type: 'success' });
    } catch (error) {
      console.error('Failed to delete first aid guideline', error);
      const message = 'Xóa bộ sơ cứu thất bại. Vui lòng thử lại.';
      setActionError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    void loadVenomTypes();
  }, []);

  useEffect(() => {
    if (selectedId == null) {
      return;
    }

    void loadDetail(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    void loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      setSelectedId(null);
      return;
    }

    if (selectedId == null || !items.some(item => item.id === selectedId)) {
      setSelectedId(items[0]?.id ?? null);
    }
  }, [items, selectedId]);

  const renderLineItems = (
    title: string,
    itemsList: Array<{ text: string; mediaUrl: string | null }>,
    emptyLabel: string,
    titleClassName: string,
    badgeClassName: string,
  ) => (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <p className={`mb-3 text-xs font-bold uppercase tracking-[0.2em] ${titleClassName}`}>{title}</p>

      {itemsList.length === 0
        ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-500">
              {emptyLabel}
            </div>
          )
        : (
            <div className="space-y-3">
              {itemsList.map((item, index) => {
                const mediaUrl = normalizeMediaUrl(item.mediaUrl);

                return (
                  <article key={`${title}-${index}-${item.text}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="grid grid-cols-1 gap-0 md:grid-cols-[12rem_minmax(0,1fr)]">
                      {mediaUrl
                        ? (
                            <a
                              href={mediaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="border-b border-slate-200 bg-slate-50 md:border-b-0 md:border-r"
                              title="Mở ảnh minh họa"
                            >
                              <img
                                src={mediaUrl}
                                alt="Ảnh minh họa sơ cứu"
                                className="h-44 w-full object-cover"
                                loading="lazy"
                              />
                            </a>
                          )
                        : (
                            <div className="flex h-44 items-center justify-center border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 md:border-b-0 md:border-r">
                              Không có hình ảnh
                            </div>
                          )}

                      <div className="p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClassName}`}>
                            {title}
                            {' '}
                            #
                            {index + 1}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.text}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
    </section>
  );

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-360 flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Quản lý bộ sơ cứu</h2>
              <p className="mt-1 text-sm text-slate-500">
                Quản lý bộ sơ cứu, kèm xem liên kết nhóm độc đang dùng bộ sơ cứu đó.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800"
              >
                <Plus className="size-4" />
                Thêm bộ sơ cứu
              </button>
              <button
                type="button"
                onClick={() => void loadList(selectedId)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <RefreshCcw className={`size-4 ${isListLoading ? 'animate-spin' : ''}`} />
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

        <section className="grid min-h-[calc(100vh-340px)] grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4 xl:col-span-4">
            <div className="flex h-full min-h-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BookOpenText className="size-4 text-teal-700" />
                  <h3 className="text-sm font-bold text-slate-900">Danh sách bộ sơ cứu</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {items.length}
                </span>
              </div>

              {listError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {listError}
                </div>
              )}

              {isListLoading && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <RefreshCcw className="size-4 animate-spin" />
                  Đang tải bộ sơ cứu...
                </div>
              )}

              {!isListLoading && items.length === 0 && !listError && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <ShieldCheck className="size-4" />
                  Không có bộ sơ cứu.
                </div>
              )}

              {!isListLoading && items.length > 0 && (
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                  {items.map((item) => {
                    const isActive = item.id === selectedId;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          isActive
                            ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-100'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                            <p className="mt-1 text-xs text-slate-500">{getGuidelineTypeLabel(item.type)}</p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            #
                            {item.id}
                          </span>
                        </div>
                        {item.summary && (
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{item.summary}</p>
                        )}
                        <p className="mt-2 text-[11px] text-slate-400">
                          Cập nhật:
                          {formatDateTime(item.updatedAt)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

            </div>
          </div>

          <div className="lg:col-span-8 xl:col-span-8">
            <div className="flex h-full min-h-0 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {selectedId == null && (
                <div className="flex h-80 flex-col items-center justify-center text-center text-slate-500">
                  <BookOpenText className="mb-3 size-10 text-slate-300" />
                  <p className="text-sm">Chọn một bộ sơ cứu để xem chi tiết.</p>
                </div>
              )}

              {selectedId != null && isDetailLoading && (
                <div className="flex h-80 items-center justify-center text-sm text-slate-500">
                  Đang tải chi tiết bộ sơ cứu...
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
                        <BookOpenText className="size-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">{selectedDetail.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{getGuidelineTypeLabel(selectedDetail.type)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={openUpdateForm}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Pencil className="size-4" />
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="size-4" />
                        {isDeleting ? 'Đang xóa...' : 'Xóa'}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-700">
                      {getGuidelineTypeLabel(selectedDetail.type)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      Mã bộ sơ cứu #
                      {selectedDetail.id}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      Cập nhật:
                      {' '}
                      {formatDateTime(selectedDetail.updatedAt)}
                    </span>
                  </div>

                  {selectedDetail.summary && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <h4 className="mb-2 text-sm font-bold text-slate-800">Mô tả ngắn</h4>
                      <p className="text-sm leading-6 text-slate-700">{selectedDetail.summary}</p>
                    </div>
                  )}

                  {linkedVenomTypes.length > 0 && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-800">Nhóm độc đang liên kết</h4>
                      </div>
                      <div className="mt-3 space-y-3">
                        {linkedVenomTypes.map(item => (
                          <div key={item.id} className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
                            <p className="text-sm font-semibold text-emerald-800">{item.name}</p>
                            <p className="mt-1 text-xs font-medium text-slate-500">{item.scientificName}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-700">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDetail.type && selectedDetail.type.toString().toLowerCase().replace(/_/g, '') === 'venomspecific' && linkedVenomTypes.length === 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-800">
                      Đây là bộ sơ cứu theo nhóm độc nhưng hiện chưa có venom type nào trỏ tới bộ này.
                    </div>
                  )}

                  {renderLineItems('Các bước', selectedDetail.content.steps, 'Chưa có bước xử lý.', 'text-amber-700', 'bg-amber-100 text-amber-700')}
                  {renderLineItems('Nên làm', selectedDetail.content.dos, 'Không có mục nên làm.', 'text-emerald-700', 'bg-emerald-100 text-emerald-700')}
                  {renderLineItems('Không nên làm', selectedDetail.content.donts, 'Không có mục không nên làm.', 'text-rose-700', 'bg-rose-100 text-rose-700')}

                  {selectedDetail.content.notes.length > 0 && (
                    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                      <h4 className="mb-3 text-sm font-bold text-slate-800">Ghi chú</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedDetail.content.notes.map((note, index) => (
                          <span key={`${selectedDetail.id}-note-${index}`} className="rounded-full bg-white px-3 py-1 text-xs text-slate-700 shadow-sm">
                            {note}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-4 shadow-sm">
                    <h4 className="mb-3 text-sm font-bold text-slate-800">Thông tin hệ thống</h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2 text-sm text-slate-700">
                        <span className="font-semibold">Ngày tạo:</span>
                        {' '}
                        {formatDateTime(selectedDetail.createdAt)}
                      </p>
                      <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2 text-sm text-slate-700">
                        <span className="font-semibold">Ngày cập nhật:</span>
                        {' '}
                        {formatDateTime(selectedDetail.updatedAt)}
                      </p>
                    </div>
                  </section>
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

      <FirstAidGuidelineUpsertModal
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
