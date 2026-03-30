'use client';

import type {
  CommonLevel,
  GeographicRegionResponse,
  UpdateRegionSnakeMappingRequest,
} from '@/types/geographic-region.type';
import type {
  FirstAidGuidelineOverride,
  SnakeSpeciesDetail,
  SnakeSpeciesSummary,
  SnakeSpeciesUpsertPayload,
} from '@/types/snake-species.type';
import {
  AlertTriangle,
  BadgeCheck,
  Edit3,
  Eye,
  Maximize2,
  Minimize2,
  Plus,
  RefreshCcw,
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
    commonName: sanitizeText(payload.commonName),
    mediaId: sanitizeText(payload.mediaId),
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
  commonName: detail.commonName ?? '',
  mediaId: detail.mediaId ?? '',
  description: detail.description ?? '',
  identificationSummary: detail.identificationSummary ?? '',
  primaryVenomType: detail.primaryVenomType ?? 'None',
  identification: {
    physicalTraits: detail.identification?.physicalTraits ?? [],
    behaviors: detail.identification?.behaviors ?? [],
    habitat: detail.identification?.habitat ?? null,
  },
  symptomsByTime: detail.symptomsByTime ?? [],
  firstAidGuidelineOverride: detail.firstAidGuidelineOverride ?? emptyFirstAid,
  riskLevel: detail.riskLevel ?? 1,
  isVenomous: detail.isVenomous,
  isActive: detail.isActive,
  venomIds: detail.venomIds ?? [],
  antivenomIds: detail.antivenomIds ?? [],
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

const getRegionStyle = (region: GeographicRegionResponse) => {
  if (!region.isMapped || !region.mapping) {
    return {
      color: '#64748b',
      fillColor: '#cbd5e1',
      fillOpacity: 0.12,
      weight: 1.2,
    };
  }

  const level = region.mapping.commonLevelValue
    || commonLevelValueMap[region.mapping.commonLevel]
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

const islandLayers: Array<{ name: string; polygon: Array<[number, number]> }> = [
  {
    name: 'Quần đảo Hoàng Sa',
    polygon: [
      [16.95, 111.2],
      [16.95, 113.4],
      [15.95, 113.4],
      [15.95, 111.2],
      [16.95, 111.2],
    ],
  },
  {
    name: 'Quần đảo Trường Sa',
    polygon: [
      [11.4, 113.0],
      [11.4, 116.2],
      [7.2, 116.2],
      [7.2, 113.0],
      [11.4, 113.0],
    ],
  },
];

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

export default function SnakesPage() {
  const [species, setSpecies] = useState<SnakeSpeciesSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<SnakeSpeciesDetail | null>(null);
  const [regions, setRegions] = useState<GeographicRegionResponse[]>([]);
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
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);

  const [venomTypeOptions, setVenomTypeOptions] = useState<Array<{ id: number; label: string }>>([]);
  const [antivenomOptions, setAntivenomOptions] = useState<Array<{ id: number; label: string }>>([]);

  const [regionDialogOpen, setRegionDialogOpen] = useState(false);
  const [activeRegion, setActiveRegion] = useState<GeographicRegionResponse | null>(null);
  const [isSavingRegion, setIsSavingRegion] = useState(false);
  const [regionActionError, setRegionActionError] = useState<string | null>(null);
  const [regionForm, setRegionForm] = useState<UpdateRegionSnakeMappingRequest & { commonLevel: CommonLevel; priority: number }>({
    commonLevel: 'Common',
    priority: 0,
    distributionNotes: '',
    isActive: true,
  });

  const mappedRegionCount = useMemo(
    () => regions.filter(region => region.isMapped).length,
    [regions],
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
      console.error('Failed to load snake detail', err);
      setSelectedDetail(null);
      setDetailError('Không thể tải thông tin loài rắn.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const loadRegions = async (id: number) => {
    setIsMapLoading(true);
    setMapError(null);

    try {
      const regionData = await geographicRegionApi.getBySnakeSpeciesId(id);
      setRegions(regionData);
    } catch (err) {
      console.error('Failed to load geographic regions', err);
      setRegions([]);
      setMapError('Không thể tải bản đồ phân bố.');
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
      })));

      setAntivenomOptions(antivenoms.map(item => ({
        id: item.id,
        label: item.manufacturer ? `${item.name} (${item.manufacturer})` : item.name,
      })));
    } catch (err) {
      console.error('Failed to load reference options', err);
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
        await Promise.all([loadDetail(targetId), loadRegions(targetId)]);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to submit snake form', err);
      const fallbackMessage
        = formMode === 'create'
          ? 'Tạo loài rắn thất bại. Vui lòng kiểm tra dữ liệu rồi thử lại.'
          : 'Cập nhật loài rắn thất bại. Vui lòng thử lại.';

      const validationMessage = getValidationMessage(err, fallbackMessage);
      setActionError(validationMessage);
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
      setRegions([]);
      await loadList(null);
    } catch (err) {
      console.error('Failed to delete snake species', err);
      setActionError('Xóa loài rắn thất bại. Vui lòng thử lại.');
    } finally {
      setIsDeletingSnake(false);
    }
  };

  const openRegionDialog = (region: GeographicRegionResponse) => {
    setActiveRegion(region);
    setRegionActionError(null);

    setRegionForm({
      commonLevel: region.mapping?.commonLevel ?? 'Common',
      priority: region.mapping?.priority ?? 0,
      distributionNotes: region.mapping?.distributionNotes ?? '',
      isActive: region.mapping?.isActive ?? true,
    });

    setRegionDialogOpen(true);
  };

  const submitRegionDialog = async () => {
    if (selectedId == null || activeRegion == null) {
      return;
    }

    setIsSavingRegion(true);
    setRegionActionError(null);

    try {
      if (!activeRegion.isMapped || !activeRegion.mapping) {
        await geographicRegionApi.createMapping(selectedId, {
          geographicRegionId: activeRegion.id,
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

      await loadRegions(selectedId);
      setRegionDialogOpen(false);
      setActiveRegion(null);
    } catch (err) {
      console.error('Failed to save region mapping', err);
      const fallback = activeRegion.isMapped
        ? 'Cập nhật phân bố thất bại.'
        : 'Thêm phân bố thất bại.';
      setRegionActionError(getValidationMessage(err, fallback));
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
      await loadRegions(selectedId);
      setRegionDialogOpen(false);
      setActiveRegion(null);
    } catch (err) {
      console.error('Failed to delete region mapping', err);
      setRegionActionError(getValidationMessage(err, 'Xóa phân bố thất bại.'));
    } finally {
      setIsSavingRegion(false);
    }
  };

  useEffect(() => {
    void loadList();
    void loadReferenceOptions();
  }, []);

  useEffect(() => {
    if (selectedId == null) {
      return;
    }

    void Promise.all([
      loadDetail(selectedId),
      loadRegions(selectedId),
    ]);
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
          {actionError && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {actionError}
            </div>
          )}
        </header>

        <section className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="min-h-0 lg:col-span-4 xl:col-span-3">
            <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                  {species.map((item) => {
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
                              setRegions([]);
                              setIsDetailExpanded(false);
                            } else {
                              setIsDetailExpanded(false);
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
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="min-h-0 lg:col-span-8 xl:col-span-9">
            <div className="relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <MapContainer
                center={[16.2, 106.2]}
                zoom={6}
                scrollWheelZoom
                className="h-full w-full"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />

                {islandLayers.map(layer => (
                  <Polygon
                    key={layer.name}
                    positions={layer.polygon}
                    pathOptions={{
                      color: '#0f766e',
                      weight: 1.4,
                      fillColor: '#14b8a6',
                      fillOpacity: 0.08,
                      dashArray: '6 4',
                    }}
                  >
                    <Tooltip sticky>
                      <p className="text-xs font-semibold text-slate-800">{layer.name}</p>
                    </Tooltip>
                  </Polygon>
                ))}

                {regions
                  .filter(region => region.boundaryCoordinates.length >= 3)
                  .map((region) => {
                    const raw = toLeafletPolygon(region.boundaryCoordinates);
                    const smoothed = smoothClosedPolygon(raw, 2);
                    const style = getRegionStyle(region);

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
                          dashArray: region.isMapped ? undefined : '4 6',
                        }}
                        eventHandlers={{
                          click: () => openRegionDialog(region),
                        }}
                      >
                        <Tooltip sticky>
                          <div className="text-xs">
                            <p className="font-semibold text-slate-800">{region.name}</p>
                            {region.isMapped && region.mapping
                              ? (
                                  <>
                                    <p className="mt-1 text-slate-700">
                                      Mức độ:
                                      {' '}
                                      {commonLevelLabelMap[region.mapping.commonLevel]}
                                    </p>
                                    <p className="text-slate-700">
                                      Độ ưu tiên:
                                      {' '}
                                      {region.mapping.priority}
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

              <div className="pointer-events-none absolute inset-x-0 top-0 z-500 p-4">
                <div className="pointer-events-auto flex flex-wrap items-start justify-end gap-2 pr-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">
                      {mappedRegionCount}
                    </span>
                    <p className="text-sm font-semibold text-slate-800">
                      Phát hiện
                      {' '}
                      {mappedRegionCount}
                      {' '}
                      vùng
                    </p>
                  </div>
                </div>
              </div>

              <div className={`pointer-events-none absolute right-4 z-500 w-full ${isDetailExpanded ? 'top-18 bottom-4 max-w-3xl' : 'top-22 max-w-sm'}`}>
                {selectedId == null && (
                  <div className="pointer-events-auto rounded-2xl border border-slate-200 bg-white/95 p-4 text-sm text-slate-600 shadow-lg backdrop-blur">
                    Chọn một loài rắn ở danh sách bên trái để xem chi tiết.
                  </div>
                )}

                {selectedId != null && isDetailLoading && (
                  <div className="pointer-events-auto rounded-2xl border border-slate-200 bg-white/95 p-4 text-sm text-slate-600 shadow-lg backdrop-blur">
                    Đang tải thông tin loài rắn...
                  </div>
                )}

                {selectedId != null && detailError && !isDetailLoading && (
                  <div className="pointer-events-auto rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-lg">
                    {detailError}
                  </div>
                )}

                {selectedDetail && !isDetailLoading && !detailError && (
                  <div className={`pointer-events-auto rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur ${isDetailExpanded ? 'h-full overflow-y-auto pr-2' : 'max-h-[calc(100vh-260px)] overflow-y-auto pr-1'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chi tiết loài rắn</p>
                        <h3 className="mt-1 text-lg font-bold text-slate-900">{selectedDetail.commonName}</h3>
                        <p className="text-xs italic text-slate-500">{selectedDetail.scientificName}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setIsDetailExpanded(prev => !prev)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                          title={isDetailExpanded ? 'Thu gọn' : 'Phóng to'}
                        >
                          {isDetailExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDetail(null)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-start gap-3">
                      <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        {selectedDetail.imageUrl
                          ? (
                              <Image
                                src={selectedDetail.imageUrl}
                                alt={selectedDetail.commonName}
                                fill
                                sizes="72px"
                                className="object-cover"
                              />
                            )
                          : null}
                      </div>
                      <div className="space-y-1 text-xs text-slate-700">
                        <p>
                          Mức rủi ro:
                          {' '}
                          <span className="font-semibold">{selectedDetail.riskLevel}</span>
                        </p>
                        <p>
                          Vùng đã gán phân bố:
                          {' '}
                          <span className="font-semibold text-rose-700">{mappedRegionCount}</span>
                        </p>
                        <p className="line-clamp-3 text-slate-600">{selectedDetail.identificationSummary}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => void openUpdateForm()}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Edit3 className="size-3.5" />
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDeleteConfirmOpen(true)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200 px-2 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="size-3.5" />
                        Xóa
                      </button>
                      <button
                        type="button"
                        onClick={() => void loadRegions(selectedId!)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-200 px-2 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                      >
                        <Eye className="size-3.5" />
                        Đồng bộ bản đồ
                      </button>
                    </div>

                    {isDetailExpanded && (
                      <div className="mt-4 space-y-4">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <h4 className="text-sm font-bold text-slate-800">Mô tả</h4>
                          <p className="mt-1 text-sm leading-6 text-slate-700">{selectedDetail.description || 'Không có dữ liệu.'}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <h4 className="text-sm font-bold text-slate-800">Tóm tắt nhận diện</h4>
                            <p className="mt-1 text-sm text-slate-700">{selectedDetail.identificationSummary || 'Không có dữ liệu.'}</p>
                            {selectedDetail.identification?.habitat && (
                              <p className="mt-2 text-sm text-slate-600">
                                <span className="font-semibold text-slate-800">Môi trường sống:</span>
                                {' '}
                                {selectedDetail.identification.habitat}
                              </p>
                            )}
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <h4 className="text-sm font-bold text-slate-800">Tên gọi khác</h4>
                            {selectedDetail.alternativeNames.length === 0
                              ? <p className="mt-1 text-sm text-slate-500">Không có dữ liệu.</p>
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
                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                              <ShieldAlert className="size-4 text-rose-600" />
                              Biểu hiện theo thời gian
                            </h4>
                            {selectedDetail.symptomsByTime == null || selectedDetail.symptomsByTime.length === 0
                              ? <p className="text-sm text-slate-500">Không có dữ liệu.</p>
                              : (
                                  <div className="space-y-2">
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
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                              <AlertTriangle className="size-4 text-amber-600" />
                              Hướng dẫn sơ cứu
                            </h4>
                            {selectedDetail.firstAidGuidelineOverride?.content.steps?.length
                              ? (
                                  <ol className="space-y-2 text-sm text-slate-700">
                                    {selectedDetail.firstAidGuidelineOverride.content.steps.map((step, index) => (
                                      <li key={`${selectedDetail.id}-${step.text}-${step.mediaUrl ?? 'none'}`} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
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

                            {(selectedDetail.firstAidGuidelineOverride?.content.dos?.length ?? 0) > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-semibold text-emerald-700">Nên làm</p>
                                <ul className="mt-1 list-disc pl-4 text-sm text-slate-700">
                                  {selectedDetail.firstAidGuidelineOverride?.content.dos.map(item => (
                                    <li key={`do-${item.text}-${item.mediaUrl ?? 'none'}`}>{item.text}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {(selectedDetail.firstAidGuidelineOverride?.content.donts?.length ?? 0) > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-semibold text-rose-700">Không nên làm</p>
                                <ul className="mt-1 list-disc pl-4 text-sm text-slate-700">
                                  {selectedDetail.firstAidGuidelineOverride?.content.donts.map(item => (
                                    <li key={`dont-${item.text}-${item.mediaUrl ?? 'none'}`}>{item.text}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {(selectedDetail.firstAidGuidelineOverride?.content.notes?.length ?? 0) > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-semibold text-slate-700">Ghi chú</p>
                                <ul className="mt-1 list-disc pl-4 text-sm text-slate-700">
                                  {selectedDetail.firstAidGuidelineOverride?.content.notes.map(note => (
                                    <li key={`note-${note}`}>{note}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <h4 className="mb-2 text-sm font-bold text-slate-800">Thông tin độc tố</h4>
                            {selectedDetail.venoms.length === 0
                              ? <p className="text-sm text-slate-500">Không có dữ liệu.</p>
                              : (
                                  <div className="space-y-2">
                                    {selectedDetail.venoms.map(venom => (
                                      <div key={`${venom.venomType}-${venom.description}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                                        <p className="text-sm font-semibold text-slate-800">{venom.venomType}</p>
                                        <p className="mt-1 text-sm text-slate-700">{venom.description}</p>
                                      </div>
                                    ))}
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
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {(isMapLoading || mapError) && (
                <div className="pointer-events-none absolute bottom-4 left-4 z-500">
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
                  {activeRegion.isMapped ? 'Chỉnh sửa phân bố' : 'Thêm phân bố'}
                </h4>
                <p className="text-sm text-slate-500">
                  Khu vực:
                  {' '}
                  <span className="font-semibold text-slate-700">{activeRegion.name}</span>
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

              {activeRegion.isMapped && (
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

              {activeRegion.isMapped && activeRegion.mapping && (
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
                {isSavingRegion ? 'Đang lưu...' : activeRegion.isMapped ? 'Cập nhật' : 'Thêm phân bố'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
