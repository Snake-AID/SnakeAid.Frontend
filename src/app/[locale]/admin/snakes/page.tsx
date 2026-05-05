'use client';

import type {
  CommonLevel,
  GeographicRegionResponse,
  RegionSnakeMappingResponse,
  UpdateRegionSnakeMappingRequest,
} from '@/types/geographic-region.type';
import type {
  FirstAidGuidelineContent,
  FirstAidGuidelineOverride,
  SnakeSpeciesDetail,
  SnakeSpeciesSummary,
  SnakeSpeciesUpsertPayload,
} from '@/types/snake-species.type';
import {
  AlertTriangle,
  BadgeCheck,
  Edit3,
  Loader2,
  Plus,
  RefreshCcw,
  SearchX,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Polygon, TileLayer, Tooltip } from 'react-leaflet';
import { antivenomApi } from '@/apis/antivenom.api';
import { ApiClientError } from '@/apis/client';
import { geographicRegionApi } from '@/apis/geographic-region.api';
import { libraryMediaApi } from '@/apis/library-media.api';
import { snakeSpeciesApi } from '@/apis/snake-species.api';
import { venomTypeApi } from '@/apis/venom-type.api';
import SnakeSpeciesUpsertModal from '@/components/admin/SnakeSpeciesUpsertModal';
import { useToast } from '@/components/ToastProvider';
import 'leaflet/dist/leaflet.css';

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
  commonName: '',
  mediaId: '',
  imageUrl: '',
  description: '',
  identificationSummary: '',
  primaryVenomTypeId: null,
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
            .map(item => ({
              text: sanitizeText(item.text),
              mediaUrl: item.mediaUrl?.trim() || null,
              mediaId: item.mediaId?.trim() || null,
            }))
            .filter(item => item.text.length > 0),
          dos: payload.firstAidGuidelineOverride.content.dos
            .map(item => ({
              text: sanitizeText(item.text),
              mediaUrl: item.mediaUrl?.trim() || null,
              mediaId: item.mediaId?.trim() || null,
            }))
            .filter(item => item.text.length > 0),
          donts: payload.firstAidGuidelineOverride.content.donts
            .map(item => ({
              text: sanitizeText(item.text),
              mediaUrl: item.mediaUrl?.trim() || null,
              mediaId: item.mediaId?.trim() || null,
            }))
            .filter(item => item.text.length > 0),
          notes: payload.firstAidGuidelineOverride.content.notes.map(sanitizeText).filter(Boolean),
        },
      }
    : null;

  const { imageUrl, ...rest } = payload;

  return {
    ...rest,
    scientificName: sanitizeText(payload.scientificName),
    commonName: sanitizeText(payload.commonName),
    mediaId: sanitizeText(payload.mediaId),
    description: sanitizeText(payload.description),
    identificationSummary: sanitizeText(payload.identificationSummary),
    primaryVenomTypeId: Number.isInteger(payload.primaryVenomTypeId) ? payload.primaryVenomTypeId : null,
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
  commonName: detail.commonName ?? '',
  mediaId: detail.mediaId ?? '',
  description: detail.description ?? '',
  identificationSummary: detail.identificationSummary ?? '',
  identification: {
    physicalTraits: detail.identification?.physicalTraits ?? [],
    behaviors: detail.identification?.behaviors ?? [],
    habitat: detail.identification?.habitat ?? null,
  },
  symptomsByTime: detail.symptomsByTime ?? [],
  firstAidGuidelineOverride: detail.firstAidGuidelineOverride ?? emptyFirstAid,
  imageUrl: detail.imageUrl ?? '',
  riskLevel: detail.riskLevel ?? 1,
  isVenomous: detail.isVenomous,
  isActive: detail.isActive,
  venomIds: detail.venomIds ?? detail.venoms.map(item => item.id).filter(Number.isInteger),
  antivenomIds: detail.antivenomIds ?? detail.antivenoms.map(item => item.id).filter(Number.isInteger),
  primaryVenomTypeId: detail.primaryVenomTypeId ?? null,
  alternativeNames: detail.alternativeNames ?? [],
});

const commonLevelValueMap: Record<CommonLevel, number> = {
  Rare: 1,
  Uncommon: 2,
  Common: 3,
  VeryCommon: 4,
  Abundant: 5,
};

const commonLevelLabelMap: Record<CommonLevel, string> = {
  Rare: 'Rất hiếm gặp',
  Uncommon: 'Ít gặp',
  Common: 'Phổ biến',
  VeryCommon: 'Rất phổ biến',
  Abundant: 'Cực kỳ phổ biến',
};

const levelColorMap: Record<number, string> = {
  1: '#fde047',
  2: '#facc15',
  3: '#fb923c',
  4: '#f97316',
  5: '#dc2626',
};

const getRegionStyle = (mapping: RegionSnakeMappingResponse | null) => {
  if (!mapping) {
    return {
      color: '#64748b',
      fillColor: '#cbd5e1',
      fillOpacity: 0.12,
      weight: 1.2,
    };
  }

  const level = mapping.commonLevelValue
    || commonLevelValueMap[mapping.commonLevel]
    || 1;

  const fillColor = levelColorMap[level] ?? '#f97316';
  const fillOpacity = Math.min(0.95, 0.25 + (level * 0.13));

  return {
    color: '#7f1d1d',
    fillColor,
    fillOpacity: Math.min(0.72, fillOpacity),
    weight: 2,
  };
};

const toLeafletPolygon = (boundaryCoordinates: Array<[number, number]>) =>
  boundaryCoordinates.map(([lng, lat]) => [lat, lng] as [number, number]);

const smoothClosedPolygon = (points: Array<[number, number]>, iterations = 2) => {
  if (points.length < 4) {
    return points;
  }

  let current = [...points];

  for (let iter = 0; iter < iterations; iter += 1) {
    const first = current[0];
    const last = current[current.length - 1];
    if (!first || !last) {
      return points;
    }

    const open = first[0] === last[0]
      && first[1] === last[1]
      ? current.slice(0, -1)
      : current;

    if (open.length < 2) {
      return points;
    }

    const next: Array<[number, number]> = [];

    for (let i = 0; i < open.length; i += 1) {
      const p0 = open[i]!;
      const p1 = open[(i + 1) % open.length]!;

      const q: [number, number] = [
        (0.75 * p0[0]) + (0.25 * p1[0]),
        (0.75 * p0[1]) + (0.25 * p1[1]),
      ];
      const r: [number, number] = [
        (0.25 * p0[0]) + (0.75 * p1[0]),
        (0.25 * p0[1]) + (0.75 * p1[1]),
      ];

      next.push(q, r);
    }

    if (next.length === 0) {
      return points;
    }

    current = [...next, next[0]!];
  }

  return current;
};

const getAntivenomLabel = (item: SnakeSpeciesDetail['antivenoms'][number]) => {
  if ('antivenomName' in item) {
    return item.antivenomName;
  }

  return item.venomType;
};

const getAntivenomDescription = (item: SnakeSpeciesDetail['antivenoms'][number]) => {
  if ('antivenomName' in item) {
    return item.effectiveness || item.manufacturer || 'Không có mô tả';
  }

  return item.description;
};

const hasFirstAidData = (content: FirstAidGuidelineContent | null | undefined) => Boolean(content
  && (content.steps.length > 0
    || content.dos.length > 0
    || content.donts.length > 0
    || content.notes.length > 0));

const normalizeMediaUrl = (mediaUrl: string | null | undefined) => {
  const value = (mediaUrl ?? '').trim();
  return value.length > 0 ? value : null;
};

const getGuidelineTypeLabel = (type: string | null | undefined) => {
  const normalized = (type ?? '').trim().toLowerCase();
  if (normalized === 'general') {
    return 'Chung';
  }
  if (normalized === 'venomtype') {
    return 'Theo loại độc';
  }

  return type || 'Không xác định';
};

const getOverrideModeLabel = (mode: string | null | undefined) => {
  const normalized = (mode ?? '').trim().toLowerCase();
  if (normalized === 'replace') {
    return 'Thay thế';
  }
  if (normalized === 'append') {
    return 'Bổ sung';
  }

  return mode || 'Bổ sung';
};

const renderFirstAidContent = (content: FirstAidGuidelineContent | null | undefined) => {
  if (!hasFirstAidData(content)) {
    return <p className="text-sm text-slate-500">Không có dữ liệu.</p>;
  }

  const resolvedContent = content as FirstAidGuidelineContent;

  const sections: Array<{
    key: 'steps' | 'dos' | 'donts';
    title: string;
    emptyLabel: string;
    items: FirstAidGuidelineContent['steps'];
    titleClass: string;
    badgeClass: string;
  }> = [
    {
      key: 'steps',
      title: 'Các bước',
      emptyLabel: 'Chưa có bước xử lý.',
      items: resolvedContent.steps,
      titleClass: 'text-amber-700',
      badgeClass: 'bg-amber-100 text-amber-700',
    },
    {
      key: 'dos',
      title: 'Nên làm',
      emptyLabel: 'Không có mục bắt buộc.',
      items: resolvedContent.dos,
      titleClass: 'text-emerald-700',
      badgeClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      key: 'donts',
      title: 'Không nên làm',
      emptyLabel: 'Không có chống chỉ định.',
      items: resolvedContent.donts,
      titleClass: 'text-rose-700',
      badgeClass: 'bg-rose-100 text-rose-700',
    },
  ];

  return (
    <div className="space-y-4">
      {sections.map(section => (
        <div key={section.key}>
          <p className={`mb-2 text-xs font-bold uppercase tracking-wide ${section.titleClass}`}>
            {section.title}
          </p>

          {section.items.length === 0
            ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-500">
                  {section.emptyLabel}
                </div>
              )
            : (
                <div className="space-y-2">
                  {section.items.map((item, index) => {
                    const mediaUrl = normalizeMediaUrl(item.mediaUrl);

                    return (
                      <article key={`${section.key}-${item.text}-${mediaUrl ?? 'none'}`} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="flex flex-col gap-2.5 md:flex-row md:items-start">
                          {mediaUrl
                            ? (
                                <a
                                  href={mediaUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block w-full shrink-0 overflow-hidden rounded-lg border border-slate-200 md:w-40"
                                  title="Mở ảnh minh họa"
                                >
                                  <img
                                    src={mediaUrl}
                                    alt="Ảnh minh họa bước sơ cứu"
                                    className="h-26 w-full object-cover"
                                    loading="lazy"
                                  />
                                  <p className="border-t border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600">
                                    Mở ảnh minh họa
                                  </p>
                                </a>
                              )
                            : (
                                <div className="flex h-26 w-full shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2 text-center text-xs font-semibold text-slate-500 md:w-40">
                                  Không có hình ảnh
                                </div>
                              )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2.5">
                              <span className={`mt-0.5 inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-1 text-[11px] font-bold ${section.badgeClass}`}>
                                {index + 1}
                              </span>
                              <p className="text-sm leading-6 text-slate-700">{item.text}</p>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
        </div>
      ))}

      {resolvedContent.notes.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">Ghi chú quan trọng</p>
          <ul className="space-y-2">
            {resolvedContent.notes.map(note => (
              <li key={`note-${note}`} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

interface ActiveRegionDialog {
  region: GeographicRegionResponse;
  mapping: RegionSnakeMappingResponse | null;
}

export default function SnakesPage() {
  const { showToast } = useToast();
  const [species, setSpecies] = useState<SnakeSpeciesSummary[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [riskLevelFilter, setRiskLevelFilter] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<SnakeSpeciesDetail | null>(null);
  const [regions, setRegions] = useState<GeographicRegionResponse[]>([]);
  const [mappings, setMappings] = useState<RegionSnakeMappingResponse[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSession, setModalSession] = useState(0);
  const [formMode, setFormMode] = useState<'create' | 'update'>('create');
  const [formInitialValue, setFormInitialValue] = useState<SnakeSpeciesUpsertPayload>(() => createEmptyPayload());
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isDeletingSnake, setIsDeletingSnake] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [venomTypeOptions, setVenomTypeOptions] = useState<Array<{ id: number; label: string; value: string }>>([]);
  const [antivenomOptions, setAntivenomOptions] = useState<Array<{ id: number; label: string }>>([]);

  const [regionDialogOpen, setRegionDialogOpen] = useState(false);
  const [activeRegion, setActiveRegion] = useState<ActiveRegionDialog | null>(null);
  const [isSavingRegion, setIsSavingRegion] = useState(false);
  const [regionActionError, setRegionActionError] = useState<string | null>(null);
  const [regionForm, setRegionForm] = useState<UpdateRegionSnakeMappingRequest & { commonLevel: CommonLevel; priority: number }>({
    commonLevel: 'Common',
    priority: 0,
    distributionNotes: '',
    isActive: true,
  });

  const mappedRegionCount = useMemo(
    () => mappings.length,
    [mappings],
  );

  const trimmedNameFilter = useMemo(() => nameFilter.trim().toLowerCase(), [nameFilter]);
  const parsedRiskLevelFilter = useMemo(() => {
    const value = riskLevelFilter.trim();
    if (!value) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }, [riskLevelFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPageNumber(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [trimmedNameFilter, riskLevelFilter]);

  const filteredSpecies = useMemo(() => {
    return species.filter((item) => {
      if (trimmedNameFilter) {
        const haystack = `${item.commonName} ${item.scientificName}`.toLowerCase();
        if (!haystack.includes(trimmedNameFilter)) {
          return false;
        }
      }

      if (parsedRiskLevelFilter != null && item.riskLevel !== parsedRiskLevelFilter) {
        return false;
      }

      return true;
    });
  }, [parsedRiskLevelFilter, species, trimmedNameFilter]);

  const totalItems = filteredSpecies.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(pageNumber, totalPages);
  const pagedSpecies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSpecies.slice(start, start + pageSize);
  }, [currentPage, filteredSpecies, pageSize]);

  useEffect(() => {
    if (pageNumber > totalPages) {
      setPageNumber(totalPages);
    }
  }, [pageNumber, totalPages]);

  useEffect(() => {
    if (selectedId == null) {
      return;
    }

    if (!filteredSpecies.some(item => item.id === selectedId)) {
      setSelectedId(null);
      setSelectedDetail(null);
      setMappings([]);
    }
  }, [filteredSpecies, selectedId]);

  const mappingByRegionId = useMemo(
    () => mappings.reduce<Record<number, RegionSnakeMappingResponse>>((acc, item) => {
      acc[item.geographicRegionId] = item;
      return acc;
    }, {}),
    [mappings],
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
      showToast('Không thể tải danh sách loài rắn.', { type: 'error' });
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
      console.error('Failed to load snake detail', err);
      setSelectedDetail(null);
      setDetailError('Không thể tải thông tin loài rắn.');
      showToast('Không thể tải chi tiết loài rắn.', { type: 'error' });
    } finally {
      setIsDetailLoading(false);
    }
  };

  const loadRegions = async () => {
    setIsMapLoading(true);
    setMapError(null);

    try {
      const regionData = await geographicRegionApi.getAll();
      setRegions(regionData);
    } catch (err) {
      console.error('Failed to load geographic regions', err);
      setRegions([]);
      setMapError('Không thể tải dữ liệu vùng bản đồ.');
      showToast('Không thể tải dữ liệu vùng bản đồ.', { type: 'error' });
    } finally {
      setIsMapLoading(false);
    }
  };

  const loadMappings = async (id: number) => {
    setIsMapLoading(true);
    setMapError(null);

    try {
      const mappingData = await geographicRegionApi.getMappedBySnakeSpeciesId(id);
      setMappings(mappingData);
    } catch (err) {
      console.error('Failed to load region mappings', err);
      setMappings([]);
      setMapError('Không thể tải dữ liệu phân bố của loài rắn.');
      showToast('Không thể tải dữ liệu phân bố của loài rắn.', { type: 'error' });
    } finally {
      setIsMapLoading(false);
    }
  };

  const loadReferenceOptions = async () => {
    try {
      const [venoms, antivenoms] = await Promise.all([
        venomTypeApi.getAll(),
        antivenomApi.getAll(),
      ]);

      setVenomTypeOptions(venoms.map(item => ({
        id: item.id,
        label: item.scientificName ? `${item.name} (${item.scientificName})` : item.name,
        value: item.scientificName || item.name,
      })));

      setAntivenomOptions(antivenoms.map(item => ({
        id: item.id,
        label: item.manufacturer ? `${item.name} (${item.manufacturer})` : item.name,
      })));
    } catch (err) {
      console.error('Failed to load reference options', err);
      showToast('Không thể tải dữ liệu tham chiếu venom/huyết thanh.', { type: 'error' });
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
      const latestDetail = await snakeSpeciesApi.getById(selectedId);
      setFormMode('update');
      setFormInitialValue(mapDetailToPayload(latestDetail));
      setModalSession(prev => prev + 1);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to load latest snake detail for update', err);
      setActionError('Không thể tải dữ liệu mới nhất để cập nhật.');
      showToast('Không thể tải dữ liệu loài rắn để cập nhật.', { type: 'error' });
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
        await Promise.all([loadDetail(targetId), loadMappings(targetId)]);
      }

      showToast(formMode === 'create' ? 'Đã tạo loài rắn mới.' : 'Đã cập nhật loài rắn.', { type: 'success' });

      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to submit snake form', err);
      const fallbackMessage
        = formMode === 'create'
          ? 'Tạo loài rắn thất bại. Vui lòng kiểm tra dữ liệu rồi thử lại.'
          : 'Cập nhật loài rắn thất bại. Vui lòng thử lại.';

      const validationMessage = getValidationMessage(err, fallbackMessage);
      setActionError(validationMessage);
      showToast(validationMessage, { type: 'error' });
      throw new Error(validationMessage);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const uploadSnakeMedia = async (file: File) => {
    return libraryMediaApi.uploadSnakeImage(file);
  };

  const confirmDeleteSnake = async () => {
    if (selectedId == null || isDeletingSnake) {
      return;
    }

    setIsDeletingSnake(true);
    setActionError(null);

    try {
      await snakeSpeciesApi.remove(selectedId);
      setIsDeleteConfirmOpen(false);
      setSelectedDetail(null);
      setMappings([]);
      await loadList(null);
      showToast('Đã xóa loài rắn.', { type: 'success' });
    } catch (err) {
      console.error('Failed to delete snake species', err);
      setActionError('Xóa loài rắn thất bại. Vui lòng thử lại.');
      showToast('Xóa loài rắn thất bại.', { type: 'error' });
    } finally {
      setIsDeletingSnake(false);
    }
  };

  const openRegionDialog = (region: GeographicRegionResponse) => {
    const mapping = mappingByRegionId[region.id] ?? null;
    setRegionActionError(null);

    setRegionForm({
      commonLevel: mapping?.commonLevel ?? 'Common',
      priority: mapping?.priority ?? 0,
      distributionNotes: mapping?.distributionNotes ?? '',
      isActive: mapping?.isActive ?? true,
    });

    setActiveRegion({ region, mapping });
    setRegionDialogOpen(true);
  };

  const submitRegionDialog = async () => {
    if (selectedId == null || activeRegion == null) {
      return;
    }

    setIsSavingRegion(true);
    setRegionActionError(null);

    try {
      if (!activeRegion.mapping) {
        await geographicRegionApi.createMapping(selectedId, {
          geographicRegionId: activeRegion.region.id,
          commonLevel: regionForm.commonLevel,
          priority: regionForm.priority,
          distributionNotes: (regionForm.distributionNotes ?? '').trim() || null,
        });
      } else {
        await geographicRegionApi.updateMapping(selectedId, activeRegion.mapping.id, {
          commonLevel: regionForm.commonLevel,
          priority: regionForm.priority,
          distributionNotes: (regionForm.distributionNotes ?? '').trim() || null,
          isActive: Boolean(regionForm.isActive),
        });
      }

      await loadMappings(selectedId);
      setRegionDialogOpen(false);
      setActiveRegion(null);
      showToast(activeRegion.mapping ? 'Đã cập nhật phân bố vùng.' : 'Đã thêm phân bố vùng.', { type: 'success' });
    } catch (err) {
      console.error('Failed to save region mapping', err);
      const fallback = activeRegion.mapping
        ? 'Cập nhật phân bố thất bại.'
        : 'Thêm phân bố thất bại.';
      const message = getValidationMessage(err, fallback);
      setRegionActionError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsSavingRegion(false);
    }
  };

  const deleteRegionMapping = async () => {
    if (selectedId == null || activeRegion?.mapping == null) {
      return;
    }

    setIsSavingRegion(true);
    setRegionActionError(null);

    try {
      await geographicRegionApi.deleteMapping(selectedId, activeRegion.mapping.id);
      await loadMappings(selectedId);
      setRegionDialogOpen(false);
      setActiveRegion(null);
      showToast('Đã xóa phân bố vùng.', { type: 'success' });
    } catch (err) {
      console.error('Failed to delete region mapping', err);
      const message = getValidationMessage(err, 'Xóa phân bố thất bại.');
      setRegionActionError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsSavingRegion(false);
    }
  };

  useEffect(() => {
    void loadList();
    void loadReferenceOptions();
    void loadRegions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId == null) {
      return;
    }

    void Promise.all([
      loadDetail(selectedId),
      loadMappings(selectedId),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <main className="h-[calc(100vh-81px)] overflow-hidden bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto flex h-full max-w-425 flex-col gap-5">
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Quản lý loài rắn</h2>
              <p className="mt-1 text-sm text-slate-500">
                Chọn loài rắn để xem ngay phân bố trên bản đồ nhiệt vàng-đỏ và chỉnh sửa từng vùng.
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
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-700">Tìm theo tên</p>
              <input
                value={nameFilter}
                onChange={e => setNameFilter(e.target.value)}
                placeholder="Tên thường gọi hoặc khoa học"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-600"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-700">Độ nguy hiểm</p>
              <input
                type="number"
                min={0}
                step="0.1"
                value={riskLevelFilter}
                onChange={e => setRiskLevelFilter(e.target.value)}
                placeholder="Ví dụ: 7"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-600"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-700">Số dòng / trang</p>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageNumber(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-600"
              >
                {[10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
          {actionError && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {actionError}
            </div>
          )}
        </header>

        <section className="relative grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="min-h-0 lg:col-span-4 xl:col-span-3">
            <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Danh sách loài rắn</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {totalItems}
                  {' '}
                  loài
                </span>
              </div>

              {isListLoading && (
                <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                  <div className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Đang tải dữ liệu...
                  </div>
                </div>
              )}

              {!isListLoading && listError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {listError}
                </div>
              )}

              {!isListLoading && !listError && pagedSpecies.length === 0 && (
                <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                  <div className="inline-flex items-center gap-2">
                    <SearchX className="size-4" />
                    Không có loài rắn phù hợp.
                  </div>
                </div>
              )}

              {!isListLoading && !listError && pagedSpecies.length > 0 && (
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                  {pagedSpecies.map((item) => {
                    const isActive = item.id === selectedId;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedId((prev) => {
                            const next = prev === item.id ? null : item.id;
                            if (next == null) {
                              setSelectedDetail(null);
                              setMappings([]);
                            }
                            return next;
                          });
                        }}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          isActive
                            ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-100'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-1 items-start gap-2.5">
                            <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                              {item.imageUrl
                                ? (
                                    <Image
                                      src={item.imageUrl}
                                      alt={item.commonName}
                                      fill
                                      sizes="44px"
                                      className="object-cover"
                                    />
                                  )
                                : null}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">{item.commonName}</p>
                              <p className="mt-0.5 truncate text-xs italic text-slate-500">{item.scientificName}</p>
                            </div>
                          </div>
                          <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                            Độ nguy hiểm
                            {' '}
                            {item.riskLevel}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {!isListLoading && !listError && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
                  <p>
                    Tổng
                    {' '}
                    <span className="font-semibold text-slate-800">{totalItems}</span>
                    {' '}
                    loài
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1 || isListLoading}
                      onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Trước
                    </button>

                    <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                      Trang
                      {' '}
                      {currentPage}
                      {' '}
                      /
                      {' '}
                      {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={currentPage >= totalPages || isListLoading}
                      onClick={() => setPageNumber(prev => prev + 1)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="min-h-0 lg:col-span-8 xl:col-span-9">
            <div className="relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="h-full overflow-y-auto p-4 pr-2">
                {selectedId == null && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Chọn một loài rắn ở danh sách bên trái để xem chi tiết.
                  </div>
                )}

                {selectedId != null && isDetailLoading && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Đang tải thông tin loài rắn...
                  </div>
                )}

                {selectedId != null && detailError && !isDetailLoading && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    {detailError}
                  </div>
                )}

                {selectedDetail && !isDetailLoading && !detailError && (
                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
                      <div className="flex items-center">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Chi tiết loài rắn</p>
                      </div>

                      <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
                        <button
                          type="button"
                          onClick={() => void openUpdateForm()}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Edit3 className="size-3.5" />
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsDeleteConfirmOpen(true)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="size-3.5" />
                          Xóa
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(null);
                            setSelectedDetail(null);
                            setMappings([]);
                          }}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
                          title="Đóng chi tiết"
                        >
                          <X className="size-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-white px-1 py-1">
                          <div className="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-5">
                            <div className="flex h-56 w-full items-center overflow-hidden rounded-xl bg-white md:h-60 md:w-auto md:max-w-[28rem] md:shrink-0">
                              {selectedDetail.imageUrl
                                ? (
                                    <Image
                                      src={selectedDetail.imageUrl}
                                      alt={selectedDetail.commonName}
                                      width={560}
                                      height={360}
                                      sizes="(max-width: 768px) 100vw, 448px"
                                      className="h-full w-full object-contain object-left md:w-auto"
                                    />
                                  )
                                : null}
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col gap-3">
                              <div className="py-1">
                                <h3 className="text-2xl font-bold leading-tight text-slate-900 lg:text-[1.7rem]">{selectedDetail.commonName}</h3>
                                <p className="mt-1 text-sm italic text-slate-600 lg:text-base">{selectedDetail.scientificName}</p>

                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                  <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-800">
                                    Mức độ nguy hiểm
                                    {' '}
                                    {selectedDetail.riskLevel}
                                  </span>
                                  <span className="rounded-full bg-rose-100 px-2.5 py-1 font-semibold text-rose-700">
                                    {mappedRegionCount}
                                    {' '}
                                    vùng phân bố
                                  </span>
                                  <span className={`rounded-full px-2.5 py-1 font-semibold ${selectedDetail.isVenomous ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {selectedDetail.isVenomous ? 'Rắn có độc' : 'Rắn không độc'}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-auto pb-1">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Tên gọi khác</p>
                                {selectedDetail.alternativeNames.length === 0
                                  ? <p className="mt-1 text-sm text-slate-500">Không có dữ liệu.</p>
                                  : (
                                      <ul className="mt-2 grid grid-cols-1 gap-1 text-sm text-slate-700 md:grid-cols-2">
                                        {selectedDetail.alternativeNames.map(name => (
                                          <li key={name} className="flex items-start gap-1.5">
                                            <BadgeCheck className="mt-0.5 size-4 shrink-0 text-teal-700" />
                                            <span>{name}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <h4 className="text-sm font-bold text-slate-800">Mô tả</h4>
                          <p className="mt-1 text-sm leading-6 text-slate-700">{selectedDetail.description || 'Không có dữ liệu.'}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <h4 className="text-sm font-bold text-slate-800">Tóm tắt nhận diện</h4>
                          <p className="mt-1 text-sm leading-6 text-slate-700">{selectedDetail.identificationSummary || 'Không có dữ liệu.'}</p>
                          {selectedDetail.identification?.habitat && (
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              <span className="font-semibold text-slate-800">Môi trường sống:</span>
                              {' '}
                              {selectedDetail.identification.habitat}
                            </p>
                          )}
                        </div>
                      </div>

                      <aside className="relative self-start h-[25.5rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:h-[28.5rem]">
                        <MapContainer
                          center={[16.2, 106.1]}
                          zoom={5.4}
                          dragging={false}
                          scrollWheelZoom={false}
                          doubleClickZoom={false}
                          boxZoom={false}
                          keyboard={false}
                          touchZoom={false}
                          zoomControl={false}
                          className="h-full w-full"
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; OpenStreetMap contributors"
                          />

                          {regions
                            .filter(region => region.boundaryCoordinates.length >= 3)
                            .map((region) => {
                              const mapping = mappingByRegionId[region.id] ?? null;
                              const raw = toLeafletPolygon(region.boundaryCoordinates);
                              const smoothed = smoothClosedPolygon(raw, 2);
                              const style = getRegionStyle(mapping);

                              return (
                                <Polygon
                                  key={region.id}
                                  positions={smoothed}
                                  pathOptions={{
                                    color: style.color,
                                    fillColor: style.fillColor,
                                    fillOpacity: style.fillOpacity,
                                    weight: style.weight,
                                    lineCap: 'round',
                                    lineJoin: 'round',
                                    dashArray: mapping ? undefined : '4 6',
                                  }}
                                  eventHandlers={{
                                    click: () => openRegionDialog(region),
                                  }}
                                >
                                  <Tooltip sticky>
                                    <div className="text-xs">
                                      <p className="font-semibold text-slate-800">{region.name}</p>
                                      {mapping
                                        ? (
                                            <>
                                              <p className="mt-1 text-slate-700">
                                                Mức độ:
                                                {' '}
                                                {commonLevelLabelMap[mapping.commonLevel]}
                                              </p>
                                              <p className="text-slate-700">
                                                Độ ưu tiên:
                                                {' '}
                                                {mapping.priority}
                                              </p>
                                            </>
                                          )
                                        : <p className="mt-1 text-slate-600">Chưa có dữ liệu phân bố</p>}
                                    </div>
                                  </Tooltip>
                                </Polygon>
                              );
                            })}
                        </MapContainer>

                        <div className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 px-2 py-1 text-[11px] font-semibold text-slate-700">
                          <span className="inline-flex size-5 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-700">
                            {mappedRegionCount}
                          </span>
                          vùng
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (selectedId != null) {
                              void loadMappings(selectedId);
                            }
                          }}
                          disabled={selectedId == null || isMapLoading}
                          className="absolute right-2 top-2 z-10 rounded-md bg-white/95 p-1.5 text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                          title="Đồng bộ phân bố"
                        >
                          <RefreshCcw className={`size-4 ${isMapLoading ? 'animate-spin' : ''}`} />
                        </button>

                        {(isMapLoading || mapError) && (
                          <div className="pointer-events-none absolute bottom-3 left-3 z-10">
                            {isMapLoading && (
                              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow">
                                Đang tải dữ liệu phân bố...
                              </div>
                            )}
                            {!isMapLoading && mapError && (
                              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 shadow">
                                {mapError}
                              </div>
                            )}
                          </div>
                        )}
                      </aside>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      <h4 className="mb-2 text-sm font-bold text-slate-800">Đặc điểm nhận diện và hành vi</h4>
                      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Đặc điểm hình thái</p>
                          {selectedDetail.identification?.physicalTraits?.length
                            ? (
                                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                                  {selectedDetail.identification.physicalTraits.map(trait => (
                                    <li key={trait} className="flex items-start gap-1.5">
                                      <BadgeCheck className="mt-0.5 size-4 shrink-0 text-teal-700" />
                                      <span>{trait}</span>
                                    </li>
                                  ))}
                                </ul>
                              )
                            : <p className="mt-2 text-sm text-slate-500">Không có dữ liệu.</p>}
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Hành vi</p>
                          {selectedDetail.identification?.behaviors?.length
                            ? (
                                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                                  {selectedDetail.identification.behaviors.map(behavior => (
                                    <li key={behavior} className="flex items-start gap-1.5">
                                      <BadgeCheck className="mt-0.5 size-4 shrink-0 text-teal-700" />
                                      <span>{behavior}</span>
                                    </li>
                                  ))}
                                </ul>
                              )
                            : <p className="mt-2 text-sm text-slate-500">Không có dữ liệu.</p>}
                        </div>
                      </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                        <ShieldAlert className="size-4 text-rose-600" />
                        Biểu hiện theo thời gian
                      </h4>
                      {selectedDetail.symptomsByTime == null || selectedDetail.symptomsByTime.length === 0
                        ? <p className="text-sm text-slate-500">Không có dữ liệu.</p>
                        : (
                            <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                              {selectedDetail.symptomsByTime.map(symptom => (
                                <div key={symptom.timeRange} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
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
                    </section>

                    <section className="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-3">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                          <AlertTriangle className="size-4 text-amber-600" />
                          Bộ hướng dẫn sơ cứu áp dụng
                        </h4>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          Đang sử dụng thực tế
                        </span>
                      </div>

                      <div className="rounded-2xl border border-emerald-200 bg-white p-3 shadow-sm">
                        {selectedDetail.effectiveFirstAidGuideline
                          ? renderFirstAidContent(selectedDetail.effectiveFirstAidGuideline)
                          : (
                              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                                {
                                  selectedDetail.baseFirstAidGuideline
                                    ? 'Hiện chưa có bộ áp dụng sau cùng. Bạn có thể xem hướng dẫn nền bên dưới.'
                                    : 'Chưa có hướng dẫn sơ cứu cho loài rắn này.'
                                }
                              </p>
                            )}
                      </div>

                      <div className="mt-3 grid grid-cols-1 items-start gap-3 xl:grid-cols-2">
                        <details name="snake-first-aid-layer" className="group self-start rounded-xl border border-slate-200 bg-white p-3">
                          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-800">
                            <span className="inline-flex items-center gap-2">
                              Hướng dẫn nền
                              {selectedDetail.baseFirstAidGuideline?.type && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                                  {getGuidelineTypeLabel(selectedDetail.baseFirstAidGuideline.type)}
                                </span>
                              )}
                            </span>
                          </summary>

                          <div className="mt-3 space-y-3">
                            {selectedDetail.baseFirstAidGuideline
                              ? (
                                  <>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                      <p className="text-sm font-semibold text-slate-900">{selectedDetail.baseFirstAidGuideline.name}</p>
                                      <p className="mt-1 text-xs leading-5 text-slate-600">{selectedDetail.baseFirstAidGuideline.summary}</p>
                                    </div>
                                    {renderFirstAidContent(selectedDetail.baseFirstAidGuideline.content)}
                                  </>
                                )
                              : (
                                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                                    Chưa có hướng dẫn nền.
                                  </p>
                                )}
                          </div>
                        </details>

                        <details name="snake-first-aid-layer" className="group self-start rounded-xl border border-slate-200 bg-white p-3">
                          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-800">
                            <span className="inline-flex items-center gap-2">
                              Tùy chỉnh riêng
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                {getOverrideModeLabel(selectedDetail.firstAidGuidelineOverride?.mode)}
                              </span>
                            </span>
                          </summary>

                          <div className="mt-3">
                            {selectedDetail.firstAidGuidelineOverride?.content
                              ? renderFirstAidContent(selectedDetail.firstAidGuidelineOverride.content)
                              : (
                                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                                    Không có tùy chỉnh riêng cho loài rắn này.
                                  </p>
                                )}
                          </div>
                        </details>
                      </div>
                    </section>

                    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <h4 className="mb-2 text-sm font-bold text-slate-800">Thông tin độc tố</h4>
                        {selectedDetail.venoms.length === 0
                          ? <p className="text-sm text-slate-500">Không có dữ liệu.</p>
                          : (
                              <div className="space-y-2">
                                {selectedDetail.venoms.map((venom) => {
                                  const isPrimary = selectedDetail.primaryVenomTypeId === venom.id;

                                  return (
                                    <div
                                      key={`${venom.venomType}-${venom.description}`}
                                      className={`rounded-lg border p-2.5 ${isPrimary ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-slate-800">{venom.venomType}</p>
                                        {isPrimary && (
                                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                            Độc tố chính
                                          </span>
                                        )}
                                      </div>
                                      <p className="mt-1 text-sm text-slate-700">{venom.description}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <h4 className="mb-2 text-sm font-bold text-slate-800">Huyết thanh khuyến nghị</h4>
                        {selectedDetail.antivenoms.length === 0
                          ? <p className="text-sm text-slate-500">Không có dữ liệu.</p>
                          : (
                              <div className="space-y-2">
                                {selectedDetail.antivenoms.map(item => (
                                  <div key={`${getAntivenomLabel(item)}-${getAntivenomDescription(item)}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                                    <p className="text-sm font-semibold text-slate-800">{getAntivenomLabel(item)}</p>
                                    <p className="mt-1 text-sm text-slate-700">{getAntivenomDescription(item)}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                      </div>
                    </section>
                  </div>
                )}
              </div>
            </div>
          </div>

        </section>
      </div>

      <SnakeSpeciesUpsertModal
        key={modalSession}
        isOpen={isModalOpen}
        mode={formMode}
        initialValue={formInitialValue}
        venomTypeOptions={venomTypeOptions}
        antivenomOptions={antivenomOptions}
        isSubmitting={isSubmittingForm}
        onClose={() => setIsModalOpen(false)}
        onUploadMedia={uploadSnakeMedia}
        onSubmit={submitUpsert}
      />

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-2000 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h4 className="text-base font-bold text-slate-900">Xóa loài rắn</h4>
            <p className="mt-2 text-sm text-slate-600">
              Hành động này sẽ xóa loài rắn đang chọn. Bạn có chắc chắn muốn tiếp tục?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteSnake()}
                disabled={isDeletingSnake}
                className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <AlertTriangle className="size-4" />
                {isDeletingSnake ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {regionDialogOpen && activeRegion && (
        <div className="fixed inset-0 z-2000 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  {activeRegion.mapping ? 'Chỉnh sửa phân bố' : 'Thêm phân bố'}
                </h4>
                <p className="text-sm text-slate-500">
                  Khu vực:
                  {' '}
                  <span className="font-semibold text-slate-700">{activeRegion.region.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRegionDialogOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            {regionActionError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {regionActionError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-700">Mức độ phổ biến</p>
                <select
                  value={regionForm.commonLevel}
                  onChange={e => setRegionForm(prev => ({ ...prev, commonLevel: e.target.value as CommonLevel }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-600"
                >
                  {Object.entries(commonLevelLabelMap).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-slate-700">Độ ưu tiên (0-100)</p>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={regionForm.priority}
                  onChange={e => setRegionForm(prev => ({ ...prev, priority: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-600"
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-slate-700">Ghi chú phân bố</p>
                <textarea
                  rows={3}
                  value={regionForm.distributionNotes ?? ''}
                  onChange={e => setRegionForm(prev => ({ ...prev, distributionNotes: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-600"
                />
              </div>

              {activeRegion.mapping && (
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(regionForm.isActive)}
                    onChange={e => setRegionForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  Phân bố đang hoạt động
                </label>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRegionDialogOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>

              {activeRegion.mapping && (
                <button
                  type="button"
                  onClick={() => void deleteRegionMapping()}
                  disabled={isSavingRegion}
                  className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Xóa phân bố
                </button>
              )}

              <button
                type="button"
                onClick={() => void submitRegionDialog()}
                disabled={isSavingRegion}
                className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <ShieldCheck className="size-4" />
                {isSavingRegion ? 'Đang lưu...' : activeRegion.mapping ? 'Cập nhật' : 'Thêm phân bố'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
