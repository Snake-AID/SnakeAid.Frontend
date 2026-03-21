'use client';

import type {
  FirstAidGuidelineOverride,
  FirstAidLineItem,
  SnakeSpeciesDetail,
  SnakeSpeciesSummary,
  SnakeSpeciesUpsertPayload,
} from '@/types/snake-species.type';
import {
  AlertTriangle,
  BadgeCheck,
  Pencil,
  Plus,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { ApiClientError } from '@/apis/client';
import { snakeSpeciesApi } from '@/apis/snake-species.api';
import SnakeSpeciesUpsertModal from '@/components/admin/SnakeSpeciesUpsertModal';

const emptyFirstAid: FirstAidGuidelineOverride = {
  mode: 'Append',
  content: {
    steps: [],
    dos: [],
    donts: [],
    notes: [],
  },
};

const createEmptyPayload = (): SnakeSpeciesUpsertPayload => ({
  scientificName: '',
  slug: '',
  commonName: '',
  imageUrl: '',
  description: '',
  identificationSummary: '',
  primaryVenomType: 'None',
  identification: {
    physicalTraits: [],
    behaviors: [],
    habitat: null,
  },
  symptomsByTime: [],
  firstAidGuidelineOverride: emptyFirstAid,
  riskLevel: 1,
  isVenomous: false,
  isActive: true,
  venomIds: [],
  antivenomIds: [],
  alternativeNames: [],
});

const normalizeLineItems = (items: unknown): FirstAidLineItem[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.flatMap((item) => {
    if (typeof item === 'string') {
      return [{ text: item, mediaUrl: null }];
    }

    if (item && typeof item === 'object' && 'text' in item) {
      const text = typeof (item as { text?: unknown }).text === 'string'
        ? (item as { text: string }).text
        : '';
      const mediaUrl = typeof (item as { mediaUrl?: unknown }).mediaUrl === 'string'
        ? (item as { mediaUrl: string }).mediaUrl
        : null;

      return [{ text, mediaUrl }];
    }

    return [];
  });
};

const sanitizeText = (value: string) => value.trim();

const sanitizePayload = (payload: SnakeSpeciesUpsertPayload): SnakeSpeciesUpsertPayload => {
  const normalizedSymptoms = payload.symptomsByTime
    .map(item => ({
      timeRange: sanitizeText(item.timeRange),
      signs: item.signs.map(sanitizeText).filter(Boolean),
      isCritical: Boolean(item.isCritical),
    }))
    .filter(item => item.timeRange.length > 0 || item.signs.length > 0);

  const firstAid = payload.firstAidGuidelineOverride
    ? {
        mode: payload.firstAidGuidelineOverride.mode,
        content: {
          steps: payload.firstAidGuidelineOverride.content.steps
            .map(item => ({ text: sanitizeText(item.text), mediaUrl: item.mediaUrl?.trim() ?? '' }))
            .filter(item => item.text.length > 0),
          dos: payload.firstAidGuidelineOverride.content.dos
            .map(item => ({ text: sanitizeText(item.text), mediaUrl: item.mediaUrl?.trim() ?? '' }))
            .filter(item => item.text.length > 0),
          donts: payload.firstAidGuidelineOverride.content.donts
            .map(item => ({ text: sanitizeText(item.text), mediaUrl: item.mediaUrl?.trim() ?? '' }))
            .filter(item => item.text.length > 0),
          notes: payload.firstAidGuidelineOverride.content.notes.map(sanitizeText).filter(Boolean),
        },
      }
    : null;

  return {
    ...payload,
    scientificName: sanitizeText(payload.scientificName),
    slug: sanitizeText(payload.slug),
    commonName: sanitizeText(payload.commonName),
    imageUrl: sanitizeText(payload.imageUrl),
    description: sanitizeText(payload.description),
    identificationSummary: sanitizeText(payload.identificationSummary),
    primaryVenomType: payload.primaryVenomType ?? 'None',
    identification: {
      physicalTraits: payload.identification.physicalTraits.map(sanitizeText).filter(Boolean),
      behaviors: payload.identification.behaviors.map(sanitizeText).filter(Boolean),
      habitat: sanitizeText(payload.identification.habitat ?? ''),
    },
    symptomsByTime: normalizedSymptoms,
    firstAidGuidelineOverride: firstAid,
    riskLevel: Number(payload.riskLevel),
    venomIds: payload.venomIds.filter(Number.isInteger),
    antivenomIds: payload.antivenomIds.filter(Number.isInteger),
    alternativeNames: payload.alternativeNames.map(sanitizeText).filter(Boolean),
  };
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

const mapDetailToPayload = (detail: SnakeSpeciesDetail): SnakeSpeciesUpsertPayload => ({
  scientificName: detail.scientificName ?? '',
  slug: detail.slug ?? '',
  commonName: detail.commonName ?? '',
  imageUrl: detail.imageUrl ?? '',
  description: detail.description ?? '',
  identificationSummary: detail.identificationSummary ?? '',
  primaryVenomType: detail.primaryVenomType ?? 'None',
  identification: {
    physicalTraits: detail.identification?.physicalTraits ?? [],
    behaviors: detail.identification?.behaviors ?? [],
    habitat: detail.identification?.habitat ?? null,
  },
  symptomsByTime: detail.symptomsByTime ?? [],
  firstAidGuidelineOverride: detail.firstAidGuidelineOverride
    ? {
        mode: detail.firstAidGuidelineOverride.mode,
        content: {
          steps: normalizeLineItems(detail.firstAidGuidelineOverride.content.steps),
          dos: normalizeLineItems(detail.firstAidGuidelineOverride.content.dos),
          donts: normalizeLineItems(detail.firstAidGuidelineOverride.content.donts),
          notes: Array.isArray(detail.firstAidGuidelineOverride.content.notes)
            ? detail.firstAidGuidelineOverride.content.notes
            : [],
        },
      }
    : emptyFirstAid,
  riskLevel: detail.riskLevel ?? 1,
  isVenomous: detail.isVenomous,
  isActive: detail.isActive,
  venomIds: detail.venomIds ?? [],
  antivenomIds: detail.antivenomIds ?? [],
  alternativeNames: detail.alternativeNames ?? [],
});

const venomBadgeClass = (isVenomous: boolean) => (
  isVenomous
    ? 'bg-rose-100 text-rose-700 border-rose-200'
    : 'bg-emerald-100 text-emerald-700 border-emerald-200'
);

export default function SnakesPage() {
  const [species, setSpecies] = useState<SnakeSpeciesSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<SnakeSpeciesDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSession, setModalSession] = useState(0);
  const [formMode, setFormMode] = useState<'create' | 'update'>('create');
  const [formInitialValue, setFormInitialValue] = useState<SnakeSpeciesUpsertPayload>(createEmptyPayload());
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedSummary = useMemo(
    () => species.find(item => item.id === selectedId) ?? null,
    [selectedId, species],
  );

  const loadList = async (preferredId?: number | null, pinToTop = false) => {
    setIsListLoading(true);
    setListError(null);

    try {
      const data = await snakeSpeciesApi.getAll();
      const ordered = pinToTop && preferredId != null
        ? [
            ...data.filter(item => item.id === preferredId),
            ...data.filter(item => item.id !== preferredId),
          ]
        : data;

      setSpecies(ordered);
      setSelectedId((prev) => {
        const targetId = preferredId ?? prev;
        if (targetId != null && ordered.some(item => item.id === targetId)) {
          return targetId;
        }

        return ordered[0]?.id ?? null;
      });
    } catch (err) {
      console.error('Failed to load snake species', err);
      setListError('Không thể tải danh sách loài rắn. Vui lòng thử lại.');
    } finally {
      setIsListLoading(false);
    }
  };

  const loadDetail = async (id: number) => {
    setIsDetailLoading(true);
    setDetailError(null);

    try {
      const detail = await snakeSpeciesApi.getById(id);
      setSelectedDetail(detail);
    } catch (err) {
      console.error('Failed to load snake species detail', err);
      setSelectedDetail(null);
      setDetailError('Không thể tải chi tiết loài rắn. Vui lòng thử lại.');
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
      // Always fetch latest data before editing.
      const latestDetail = await snakeSpeciesApi.getById(selectedId);
      setFormMode('update');
      setFormInitialValue(mapDetailToPayload(latestDetail));
      setModalSession(prev => prev + 1);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to load latest snake detail for update', err);
      setActionError('Không thể tải dữ liệu mới nhất để cập nhật. Vui lòng thử lại.');
    }
  };

  const submitUpsert = async (payload: SnakeSpeciesUpsertPayload) => {
    setIsSubmittingForm(true);
    setActionError(null);
    const normalizedPayload = sanitizePayload(payload);

    try {
      let targetId: number | null = null;

      if (formMode === 'create') {
        const created = await snakeSpeciesApi.create(normalizedPayload);
        targetId = created.id;
      } else if (selectedId != null) {
        const updated = await snakeSpeciesApi.update(selectedId, normalizedPayload);
        targetId = updated.id ?? selectedId;
      }

      if (targetId != null) {
        await loadList(targetId, formMode === 'create');
        await loadDetail(targetId);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to submit snake species form', err);
      const fallbackMessage
        = formMode === 'create'
          ? 'Tạo loài rắn thất bại. Vui lòng kiểm tra dữ liệu rồi thử lại.'
          : 'Cập nhật loài rắn thất bại. Vui lòng thử lại.';

      const validationMessage = getValidationMessage(err, fallbackMessage);
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

    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedId == null || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setActionError(null);

    try {
      await snakeSpeciesApi.remove(selectedId);
      await loadList(null);
      setSelectedDetail(null);
      setIsDeleteConfirmOpen(false);
    } catch (err) {
      console.error('Failed to delete snake species', err);
      setActionError('Xóa loài rắn thất bại. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    void loadList();
  }, []);

  useEffect(() => {
    if (selectedId == null) {
      setSelectedDetail(null);
      setIsDeleteConfirmOpen(false);
      return;
    }

    void loadDetail(selectedId);
  }, [selectedId]);

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-360 flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Quản lý loài rắn</h2>
              <p className="mt-1 text-sm text-slate-500">
                Theo dõi danh mục loài rắn, mức độ nguy hiểm và hướng dẫn sơ cứu.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                <Plus className="size-4" />
                Thêm loài rắn
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
                <h3 className="text-base font-bold text-slate-900">Danh sách loài rắn</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {species.length}
                  {' '}
                  loài
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
                  {species.map((item) => {
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
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{item.commonName}</p>
                            <p className="mt-0.5 text-xs italic text-slate-500">{item.scientificName}</p>
                          </div>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                            Rủi ro
                            {' '}
                            {item.riskLevel}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${venomBadgeClass(item.isVenomous)}`}>
                            {item.isVenomous ? 'Có độc' : 'Không độc'}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {item.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                          </span>
                        </div>
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
                  <p className="text-sm">Chọn một loài rắn để xem chi tiết.</p>
                </div>
              )}

              {selectedId != null && isDetailLoading && (
                <div className="flex h-80 items-center justify-center text-sm text-slate-500">
                  Đang tải chi tiết loài rắn...
                </div>
              )}

              {selectedId != null && !isDetailLoading && detailError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {detailError}
                </div>
              )}

              {selectedId != null && !isDetailLoading && !detailError && selectedDetail && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                      {selectedDetail.imageUrl
                        ? (
                            <Image
                              src={selectedDetail.imageUrl}
                              alt={selectedDetail.commonName}
                              fill
                              sizes="144px"
                              className="h-full w-full object-cover"
                            />
                          )
                        : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900">{selectedDetail.commonName}</h3>
                          <p className="mt-1 text-sm italic text-slate-500">{selectedDetail.scientificName}</p>
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

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${venomBadgeClass(selectedDetail.isVenomous)}`}>
                          {selectedDetail.isVenomous ? 'Có độc' : 'Không độc'}
                        </span>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                          Rủi ro
                          {' '}
                          {selectedDetail.riskLevel}
                        </span>
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          Venom
                          {' '}
                          {selectedDetail.primaryVenomType ?? 'N/A'}
                        </span>
                      </div>

                      {isDeleteConfirmOpen && (
                        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
                          <p className="text-sm text-rose-700">
                            Bạn có chắc chắn muốn xóa loài rắn này không?
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void confirmDelete()}
                              disabled={isDeleting}
                              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsDeleteConfirmOpen(false)}
                              disabled={isDeleting}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      )}

                      <p className="mt-4 text-sm leading-6 text-slate-700">{selectedDetail.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <h4 className="text-sm font-bold text-slate-800">Tóm tắt nhận diện</h4>
                      <p className="mt-2 text-sm text-slate-700">{selectedDetail.identificationSummary}</p>
                      {selectedDetail.identification?.habitat && (
                        <p className="mt-3 text-sm text-slate-600">
                          <span className="font-semibold text-slate-800">Môi trường sống:</span>
                          {' '}
                          {selectedDetail.identification.habitat}
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <h4 className="text-sm font-bold text-slate-800">Tên gọi khác</h4>
                      {selectedDetail.alternativeNames.length === 0
                        ? <p className="mt-2 text-sm text-slate-500">Không có dữ liệu.</p>
                        : (
                            <ul className="mt-2 space-y-1 text-sm text-slate-700">
                              {selectedDetail.alternativeNames.map(name => (
                                <li key={name} className="flex items-start gap-2">
                                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-teal-700" />
                                  <span>{name}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                        <ShieldAlert className="size-4 text-rose-600" />
                        Biểu hiện theo thời gian
                      </h4>
                      {selectedDetail.symptomsByTime == null || selectedDetail.symptomsByTime.length === 0
                        ? <p className="text-sm text-slate-500">Không có dữ liệu.</p>
                        : (
                            <div className="space-y-2">
                              {selectedDetail.symptomsByTime.map(symptom => (
                                <div key={symptom.timeRange} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                  <p className="text-xs font-semibold text-slate-800">{symptom.timeRange}</p>
                                  <p className={`mt-1 text-xs font-semibold ${symptom.isCritical ? 'text-rose-700' : 'text-emerald-700'}`}>
                                    {symptom.isCritical ? 'Mức độ: Nguy kịch' : 'Mức độ: Theo dõi'}
                                  </p>
                                  <ul className="mt-1 list-disc pl-4 text-sm text-slate-700">
                                    {symptom.signs.map(sign => (
                                      <li key={sign}>{sign}</li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          )}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                        <AlertTriangle className="size-4 text-amber-600" />
                        Hướng dẫn sơ cứu
                      </h4>
                      {selectedDetail.firstAidGuidelineOverride?.content.steps?.length
                        ? (
                            <ol className="space-y-2 text-sm text-slate-700">
                              {selectedDetail.firstAidGuidelineOverride.content.steps.map((step, index) => (
                                <li key={`${selectedDetail.id}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                  <span className="mr-2 font-semibold text-slate-800">
                                    {index + 1}
                                    .
                                  </span>
                                  {step.text}
                                </li>
                              ))}
                            </ol>
                          )
                        : <p className="text-sm text-slate-500">Không có dữ liệu.</p>}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h4 className="mb-2 text-sm font-bold text-slate-800">Thông tin độc tố</h4>
                    {selectedDetail.venoms.length === 0
                      ? <p className="text-sm text-slate-500">Không có dữ liệu.</p>
                      : (
                          <div className="space-y-2">
                            {selectedDetail.venoms.map(venom => (
                              <div key={`${venom.venomType}-${venom.description}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <p className="text-sm font-semibold text-slate-800">{venom.venomType}</p>
                                <p className="mt-1 text-sm text-slate-700">{venom.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                  </div>
                </div>
              )}

              {selectedId != null && !isDetailLoading && !detailError && !selectedDetail && selectedSummary && (
                <div className="flex h-72 items-center justify-center text-sm text-slate-500">
                  Không tìm thấy dữ liệu chi tiết cho
                  {' '}
                  {selectedSummary.commonName}
                  .
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <SnakeSpeciesUpsertModal
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
