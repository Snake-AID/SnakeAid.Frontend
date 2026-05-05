'use client';

import type {
  SymptomCategory,
  SymptomConfigAttributeKey,
  SymptomConfigGroupName,
  SymptomConfigResponse,
  SymptomConfigUpsertPayload,
  TimeScorePoint,
} from '@/types/symptom-config.type';
import {
  AlertTriangle,
  Loader2,
  PencilLine,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiClientError } from '@/apis/client';
import { symptomConfigApi } from '@/apis/symptom-config.api';
import { useToast } from '@/components/ToastProvider';

const GROUP_KEY_MATRIX: Record<SymptomConfigGroupName, SymptomConfigAttributeKey[]> = {
  BACKGROUND: ['AGE_GROUP', 'MEDICAL_HISTORY', 'BITE_LOCATION'],
  LOCAL: ['SYMPTOM_LOCAL'],
  CRITICAL: ['CORE_SIGNS'],
};

const ATTRIBUTE_LABELS: Record<SymptomConfigAttributeKey, string> = {
  AGE_GROUP: 'Độ tuổi của người bị cắn',
  MEDICAL_HISTORY: 'Bệnh nền của người bị cắn',
  BITE_LOCATION: 'Rắn cắn vào vị trí nào trên cơ thể?',
  SYMPTOM_LOCAL: 'Có triệu chứng gì ở vết cắn?',
  CORE_SIGNS: 'Có dấu hiệu nguy hiểm nào sau đây không?',
};

const GROUP_LABELS: Record<SymptomConfigGroupName, string> = {
  BACKGROUND: 'Bối cảnh',
  LOCAL: 'Triệu chứng tại chỗ',
  CRITICAL: 'Dấu hiệu nguy hiểm',
};

const CATEGORY_LABELS: Record<SymptomCategory, string> = {
  1: 'Cốt lõi',
  2: 'Bổ trợ',
};

const getCategoryLabel = (detail: SymptomConfigResponse): string => {
  const numeric = Number(detail.category);
  if (numeric === 1 || numeric === 2) {
    return CATEGORY_LABELS[numeric as SymptomCategory];
  }

  const rawDisplay = (detail as { categoryDisplay?: string }).categoryDisplay ?? '';
  const normalized = rawDisplay.trim().toLowerCase();
  if (normalized.includes('core')) {
    return CATEGORY_LABELS[1];
  }
  if (normalized.includes('modifier')) {
    return CATEGORY_LABELS[2];
  }

  return 'Không xác định';
};

const CATEGORY_BADGE_CLASS: Record<SymptomCategory, string> = {
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-amber-100 text-amber-700',
};

const DEFAULT_PAGE_SIZE = 10;

interface FilterState {
  groupName: string;
  attributeKey: string;
  name: string;
  category: string;
  isActive: string;
  isCritical: string;
}

interface SymptomConfigFormState {
  groupName: SymptomConfigGroupName | '';
  attributeKey: SymptomConfigAttributeKey | '';
  attributeLabel: string;
  displayOrder: number;
  name: string;
  description: string;
  isCritical: boolean;
  alertMessage: string;
  category: SymptomCategory;
  timeScoreList: Array<TimeScorePoint & { rowId: string }>;
  isActive: boolean;
}

type SymptomConfigFormErrors = Partial<Record<keyof SymptomConfigFormState, string>> & {
  timeScoreList?: string;
};

const EMPTY_FILTERS: FilterState = {
  groupName: '',
  attributeKey: '',
  name: '',
  category: '',
  isActive: '',
  isCritical: '',
};

let timeScoreRowCounter = 0;

const createTimeScoreRow = (row?: TimeScorePoint): TimeScorePoint & { rowId: string } => {
  timeScoreRowCounter += 1;
  return {
    rowId: `time-score-${timeScoreRowCounter}`,
    minMinutes: row?.minMinutes ?? 0,
    maxMinutes: row?.maxMinutes ?? 0,
    score: row?.score ?? 0,
  };
};

const createEmptyForm = (): SymptomConfigFormState => {
  const defaultGroup: SymptomConfigGroupName = 'BACKGROUND';
  const defaultKey = GROUP_KEY_MATRIX[defaultGroup][0] ?? 'AGE_GROUP';

  return {
    groupName: defaultGroup,
    attributeKey: defaultKey,
    attributeLabel: ATTRIBUTE_LABELS[defaultKey],
    displayOrder: 1,
    name: '',
    description: '',
    isCritical: false,
    alertMessage: '',
    category: 2,
    timeScoreList: [],
    isActive: true,
  };
};

const mapDetailToForm = (detail: SymptomConfigResponse): SymptomConfigFormState => {
  const rawCategory = Number(detail.category);
  let resolvedCategory: SymptomCategory = 2;

  if (rawCategory === 1 || rawCategory === 2) {
    resolvedCategory = rawCategory;
  } else if ((detail as { categoryDisplay?: string }).categoryDisplay?.toLowerCase().includes('core')) {
    resolvedCategory = 1;
  }

  return {
    groupName: detail.groupName,
    attributeKey: detail.attributeKey,
    attributeLabel: detail.attributeLabel ?? ATTRIBUTE_LABELS[detail.attributeKey],
    displayOrder: detail.displayOrder ?? 1,
    name: detail.name ?? '',
    description: detail.description ?? '',
    isCritical: Boolean(detail.isCritical),
    alertMessage: detail.alertMessage ?? '',
    category: resolvedCategory,
    timeScoreList: (detail.timeScoreList ?? []).map(item => createTimeScoreRow(item)),
    isActive: Boolean(detail.isActive),
  };
};

const normalizePayload = (form: SymptomConfigFormState): SymptomConfigUpsertPayload => ({
  groupName: form.groupName as SymptomConfigGroupName,
  attributeKey: form.attributeKey as SymptomConfigAttributeKey,
  attributeLabel: form.attributeLabel.trim(),
  displayOrder: Number(form.displayOrder),
  name: form.name.trim(),
  description: form.description.trim() || null,
  isCritical: Boolean(form.isCritical),
  alertMessage: form.alertMessage.trim() || null,
  category: form.category,
  timeScoreList: form.timeScoreList.map(item => ({
    minMinutes: Number(item.minMinutes),
    maxMinutes: Number(item.maxMinutes),
    score: Number(item.score),
  })),
  isActive: Boolean(form.isActive),
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

const getFieldValidationErrors = (error: unknown): SymptomConfigFormErrors => {
  if (!(error instanceof ApiClientError)) {
    return {};
  }

  const raw = error.error?.validationErrors ?? {};
  const errors: SymptomConfigFormErrors = {};

  const resolveFirstMessage = (fieldNames: string[]) => {
    for (const fieldName of fieldNames) {
      const messages = raw[fieldName];
      if (messages && messages.length > 0) {
        return messages[0];
      }
    }
    return undefined;
  };

  errors.groupName = resolveFirstMessage(['groupName']);
  errors.attributeKey = resolveFirstMessage(['attributeKey']);
  errors.attributeLabel = resolveFirstMessage(['attributeLabel']);
  errors.displayOrder = resolveFirstMessage(['displayOrder']);
  errors.name = resolveFirstMessage(['name']);
  errors.description = resolveFirstMessage(['description']);
  errors.isCritical = resolveFirstMessage(['isCritical']);
  errors.alertMessage = resolveFirstMessage(['alertMessage']);
  errors.category = resolveFirstMessage(['category']);
  errors.timeScoreList = resolveFirstMessage(['timeScoreList']);
  errors.isActive = resolveFirstMessage(['isActive']);

  return errors;
};

export default function SymptomConfigsPage() {
  const { showToast } = useToast();

  const [items, setItems] = useState<SymptomConfigResponse[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<SymptomConfigResponse | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [modalMode, setModalMode] = useState<'create' | 'update' | null>(null);
  const [form, setForm] = useState<SymptomConfigFormState>(() => createEmptyForm());
  const [formErrors, setFormErrors] = useState<SymptomConfigFormErrors>({});
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const selectedSummary = useMemo(
    () => items.find(item => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const filterAttributeKeys = useMemo(() => {
    const groupName = filters.groupName as SymptomConfigGroupName | '';
    if (!groupName) {
      return Object.values(GROUP_KEY_MATRIX).flat();
    }

    return GROUP_KEY_MATRIX[groupName] ?? [];
  }, [filters.groupName]);

  const formAttributeKeys = useMemo(() => {
    if (!form.groupName) {
      return [] as SymptomConfigAttributeKey[];
    }

    return GROUP_KEY_MATRIX[form.groupName] ?? [];
  }, [form.groupName]);

  const loadList = useCallback(async () => {
    setIsListLoading(true);
    setListError(null);

    try {
      const response = await symptomConfigApi.list({
        groupName: filters.groupName || undefined,
        attributeKey: filters.attributeKey || undefined,
        name: filters.name || undefined,
        category: filters.category ? Number(filters.category) : undefined,
        isActive: filters.isActive ? filters.isActive === 'true' : undefined,
        isCritical: filters.isCritical ? filters.isCritical === 'true' : undefined,
        pageNumber,
        pageSize,
      });

      const nextItems = response.items ?? [];
      setItems(nextItems);
      setTotalPages(response.meta?.totalPages ?? 1);
      setTotalCount(response.meta?.totalCount ?? nextItems.length);

      setSelectedId((prev) => {
        const targetId = prev ?? null;
        if (targetId != null && nextItems.some(item => item.id === targetId)) {
          return targetId;
        }

        return nextItems[0]?.id ?? null;
      });
    } catch (error) {
      console.error('Failed to load symptom configs list', error);
      const message = getValidationMessage(error, 'Không thể tải danh sách cấu hình triệu chứng.');
      setListError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsListLoading(false);
    }
  }, [filters, pageNumber, pageSize, showToast]);

  const loadDetail = useCallback(async (id: number) => {
    setIsDetailLoading(true);
    setDetailError(null);

    try {
      const detail = await symptomConfigApi.getById(id);
      setSelectedDetail(detail);
    } catch (error) {
      console.error('Failed to load symptom config detail', error);
      setSelectedDetail(null);
      const message = getValidationMessage(error, 'Không thể tải chi tiết cấu hình triệu chứng.');
      setDetailError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsDetailLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId != null) {
      void loadDetail(selectedId);
    }
  }, [loadDetail, selectedId]);

  const setFilterField = <K extends keyof FilterState>(field: K, value: FilterState[K]) => {
    setFilters((prev) => {
      if (field === 'groupName') {
        const groupName = value as FilterState['groupName'];
        const allowed = groupName
          ? GROUP_KEY_MATRIX[groupName as SymptomConfigGroupName] ?? []
          : Object.values(GROUP_KEY_MATRIX).flat();

        const nextAttributeKey = allowed.includes(prev.attributeKey as SymptomConfigAttributeKey)
          ? prev.attributeKey
          : '';

        return {
          ...prev,
          groupName,
          attributeKey: nextAttributeKey,
        };
      }

      return { ...prev, [field]: value };
    });
    setPageNumber(1);
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPageNumber(1);
  };

  const setFormField = <K extends keyof SymptomConfigFormState>(field: K, value: SymptomConfigFormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: undefined }));
    setModalError(null);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setForm(createEmptyForm());
    setFormErrors({});
    setModalError(null);
  };

  const openUpdateModal = async () => {
    if (selectedId == null) {
      showToast('Vui lòng chọn cấu hình để chỉnh sửa.', { type: 'warning' });
      return;
    }

    setFormErrors({});
    setModalError(null);

    try {
      const detail = selectedDetail ?? await symptomConfigApi.getById(selectedId);
      setForm(mapDetailToForm(detail));
      setModalMode('update');
    } catch (error) {
      console.error('Failed to prepare edit mode', error);
      const message = getValidationMessage(error, 'Không thể tải dữ liệu để chỉnh sửa.');
      showToast(message, { type: 'error' });
    }
  };

  const closeModal = () => {
    if (isSaving) {
      return;
    }

    setModalMode(null);
    setFormErrors({});
    setModalError(null);
  };

  const validateForm = (): {
    payload?: SymptomConfigUpsertPayload;
    errors: SymptomConfigFormErrors;
  } => {
    const errors: SymptomConfigFormErrors = {};

    if (!form.groupName) {
      errors.groupName = 'Vui lòng chọn nhóm câu hỏi.';
    }

    if (!form.attributeKey) {
      errors.attributeKey = 'Vui lòng chọn khóa thuộc tính.';
    }

    const allowedKeys = form.groupName ? GROUP_KEY_MATRIX[form.groupName] : [];
    if (form.groupName && form.attributeKey && !allowedKeys.includes(form.attributeKey)) {
      errors.attributeKey = 'Khóa thuộc tính không thuộc nhóm đã chọn.';
    }

    if (!form.attributeLabel.trim()) {
      errors.attributeLabel = 'Vui lòng nhập tiêu đề câu hỏi.';
    }

    if (Number.isNaN(Number(form.displayOrder)) || form.displayOrder < 1 || form.displayOrder > 999) {
      errors.displayOrder = 'Thứ tự hiển thị phải nằm trong khoảng 1-999.';
    }

    if (!form.name.trim()) {
      errors.name = 'Tên tuỳ chọn là bắt buộc.';
    }

    if (!form.category || ![1, 2].includes(form.category)) {
      errors.category = 'Vui lòng chọn loại điểm.';
    }

    const activeRows = form.timeScoreList.filter(item =>
      Number(item.minMinutes) !== 0
      || Number(item.maxMinutes) !== 0
      || Number(item.score) !== 0,
    );

    if (activeRows.some(item => item.minMinutes > item.maxMinutes)) {
      errors.timeScoreList = 'Khoảng thời gian không hợp lệ (min > max).';
    }

    if (!errors.timeScoreList && activeRows.length > 1) {
      const sorted = [...activeRows].sort((a, b) => a.minMinutes - b.minMinutes);
      for (let i = 1; i < sorted.length; i += 1) {
        const prev = sorted[i - 1];
        const current = sorted[i];
        if (!prev || !current) {
          continue;
        }
        if (current.minMinutes <= prev.maxMinutes) {
          errors.timeScoreList = 'Khoảng thời gian bị trùng với dòng trước. Hãy tách khoảng rõ ràng.';
          break;
        }
      }
    }

    if (Object.values(errors).some(Boolean)) {
      return { errors };
    }

    return {
      payload: normalizePayload(form),
      errors: {},
    };
  };

  const handleSave = async () => {
    const { payload, errors } = validateForm();
    setFormErrors(errors);

    if (!payload) {
      showToast('Vui lòng kiểm tra lại dữ liệu trước khi lưu.', { type: 'error' });
      return;
    }

    setIsSaving(true);
    setModalError(null);

    try {
      let savedId = selectedId ?? null;

      if (modalMode === 'create') {
        const created = await symptomConfigApi.create(payload);
        savedId = created.id;
      } else if (selectedId != null) {
        const updated = await symptomConfigApi.update(selectedId, payload);
        savedId = updated.id ?? selectedId;
      }

      await loadList();

      if (savedId != null) {
        setSelectedId(savedId);
        await loadDetail(savedId);
      }

      showToast(
        modalMode === 'create' ? 'Đã tạo cấu hình triệu chứng mới.' : 'Đã cập nhật cấu hình triệu chứng.',
        { type: 'success' },
      );

      closeModal();
    } catch (error) {
      console.error('Failed to save symptom config', error);
      const validationErrors = getFieldValidationErrors(error);
      if (Object.values(validationErrors).some(Boolean)) {
        setFormErrors(prev => ({ ...prev, ...validationErrors }));
      }

      const message = getValidationMessage(error, 'Lưu cấu hình triệu chứng thất bại.');
      setModalError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedId == null || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setActionError(null);

    try {
      await symptomConfigApi.remove(selectedId);
      setIsDeleteConfirmOpen(false);
      setSelectedDetail(null);
      await loadList();
      showToast('Đã xóa cấu hình triệu chứng.', { type: 'success' });
    } catch (error) {
      console.error('Failed to delete symptom config', error);
      const message = getValidationMessage(error, 'Xóa cấu hình triệu chứng thất bại.');
      setActionError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const addTimeScoreRow = () => {
    setForm(prev => ({
      ...prev,
      timeScoreList: [...prev.timeScoreList, createTimeScoreRow()],
    }));
    setFormErrors(prev => ({ ...prev, timeScoreList: undefined }));
  };

  const updateTimeScoreRow = (index: number, patch: Partial<TimeScorePoint>) => {
    setForm(prev => ({
      ...prev,
      timeScoreList: prev.timeScoreList.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
    setFormErrors(prev => ({ ...prev, timeScoreList: undefined }));
  };

  const removeTimeScoreRow = (index: number) => {
    setForm(prev => ({
      ...prev,
      timeScoreList: prev.timeScoreList.filter((_, i) => i !== index),
    }));
    setFormErrors(prev => ({ ...prev, timeScoreList: undefined }));
  };

  const handleFormGroupChange = (value: SymptomConfigGroupName) => {
    setForm((prev) => {
      const nextKeys = GROUP_KEY_MATRIX[value] ?? [];
      const nextKey = nextKeys.includes(prev.attributeKey as SymptomConfigAttributeKey)
        ? prev.attributeKey
        : nextKeys[0] ?? '';
      const nextLabel = nextKey ? ATTRIBUTE_LABELS[nextKey as SymptomConfigAttributeKey] : '';

      return {
        ...prev,
        groupName: value,
        attributeKey: nextKey,
        attributeLabel: prev.attributeKey === nextKey && prev.attributeLabel.trim()
          ? prev.attributeLabel
          : nextLabel,
      };
    });

    setFormErrors(prev => ({ ...prev, groupName: undefined, attributeKey: undefined }));
  };

  const handleFormAttributeKeyChange = (value: SymptomConfigAttributeKey) => {
    setForm(prev => ({
      ...prev,
      attributeKey: value,
      attributeLabel: ATTRIBUTE_LABELS[value] ?? prev.attributeLabel,
    }));

    setFormErrors(prev => ({ ...prev, attributeKey: undefined, attributeLabel: undefined }));
  };

  const attributeLabelHint = form.attributeKey
    ? `Gợi ý: ${ATTRIBUTE_LABELS[form.attributeKey as SymptomConfigAttributeKey]}`
    : '';

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-360 flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Quản lý cấu hình triệu chứng</h2>
              <p className="mt-1 text-sm text-slate-500">
                Quản trị câu hỏi triệu chứng theo nhóm, tuỳ chọn và điểm số theo thời gian.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                <Plus className="size-4" />
                Tạo cấu hình
              </button>
              <button
                type="button"
                onClick={() => void loadList()}
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
                <h3 className="text-base font-bold text-slate-900">Danh sách cấu hình</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {totalCount}
                  {' '}
                  mục
                </span>
              </div>

              <label className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <Search className="size-4 text-slate-400" />
                <input
                  value={filters.name}
                  onChange={event => setFilterField('name', event.target.value)}
                  placeholder="Tìm theo tên tuỳ chọn"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none"
                />
              </label>

              <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-600">Nhóm</p>
                  <select
                    value={filters.groupName}
                    onChange={event => setFilterField('groupName', event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                  >
                    <option value="">Tất cả</option>
                    {Object.entries(GROUP_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-600">Khóa thuộc tính</p>
                  <select
                    value={filters.attributeKey}
                    onChange={event => setFilterField('attributeKey', event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                  >
                    <option value="">Tất cả</option>
                    {filterAttributeKeys.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-600">Loại điểm</p>
                  <select
                    value={filters.category}
                    onChange={event => setFilterField('category', event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                  >
                    <option value="">Tất cả</option>
                    <option value="1">Cốt lõi</option>
                    <option value="2">Bổ trợ</option>
                  </select>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-600">Trạng thái</p>
                  <select
                    value={filters.isActive}
                    onChange={event => setFilterField('isActive', event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                  >
                    <option value="">Tất cả</option>
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Đang ẩn</option>
                  </select>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-600">Nguy hiểm</p>
                  <select
                    value={filters.isCritical}
                    onChange={event => setFilterField('isCritical', event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                  >
                    <option value="">Tất cả</option>
                    <option value="true">Nguy hiểm</option>
                    <option value="false">Bình thường</option>
                  </select>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Xóa bộ lọc
                </button>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Trang</span>
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setPageNumber(1);
                    }}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                  >
                    {[10, 20, 30].map(size => (
                      <option key={size} value={size}>
                        {size}
                        /trang
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isListLoading && (
                <div className="flex h-44 items-center justify-center gap-2 text-sm text-slate-500">
                  <Loader2 className="size-4 animate-spin" />
                  Đang tải danh sách...
                </div>
              )}

              {!isListLoading && listError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {listError}
                </div>
              )}

              {!isListLoading && !listError && (
                <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                  {items.length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                      Không có cấu hình nào phù hợp bộ lọc.
                    </div>
                  )}

                  {items.map((item) => {
                    const isActive = item.id === selectedId;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          isActive
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.groupName}
                              {' · '}
                              {item.attributeKey}
                            </p>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${CATEGORY_BADGE_CLASS[item.category]}`}>
                            {CATEGORY_LABELS[item.category]}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                            {item.isActive ? 'Đang hoạt động' : 'Đang ẩn'}
                          </span>
                          {item.isCritical && (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-700">
                              Nguy hiểm
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Trang
                  {' '}
                  {pageNumber}
                  {' / '}
                  {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                    disabled={pageNumber <= 1}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageNumber(prev => Math.min(totalPages, prev + 1))}
                    disabled={pageNumber >= totalPages}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 xl:col-span-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Chi tiết cấu hình</h3>
                  {selectedSummary && (
                    <p className="mt-1 text-xs text-slate-500">
                      Cập nhật gần nhất:
                      {' '}
                      {new Date(selectedSummary.updatedAt).toLocaleString('vi-VN', { hour12: false })}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void openUpdateModal()}
                    disabled={!selectedId || isDetailLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PencilLine className="size-4" />
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    disabled={!selectedId || isDetailLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="size-4" />
                    Xóa
                  </button>
                </div>
              </div>

              {!selectedId && !isDetailLoading && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Chọn một cấu hình ở danh sách bên trái để xem chi tiết.
                </div>
              )}

              {isDetailLoading && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <Loader2 className="size-4 animate-spin" />
                  Đang tải chi tiết cấu hình...
                </div>
              )}

              {!isDetailLoading && detailError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {detailError}
                </div>
              )}

              {!isDetailLoading && !detailError && selectedDetail && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <h4 className="text-sm font-bold text-slate-800">Câu hỏi</h4>
                    <p className="mt-1 text-sm text-slate-700">{selectedDetail.attributeLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedDetail.groupName}
                      {' · '}
                      {selectedDetail.attributeKey}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <h4 className="text-sm font-bold text-slate-800">Tuỳ chọn</h4>
                      <p className="mt-1 text-sm text-slate-700">{selectedDetail.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Thứ tự:
                        {selectedDetail.displayOrder}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <h4 className="text-sm font-bold text-slate-800">Loại điểm</h4>
                      <p className="mt-1 text-sm text-slate-700">
                        {getCategoryLabel(selectedDetail)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2">
                      <h4 className="text-sm font-bold text-slate-800">Cảnh báo</h4>
                      <div className="mt-2 grid gap-3 md:grid-cols-[12rem_1fr]">
                        <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                          <p className="text-xs font-semibold text-slate-600">Mức độ</p>
                          <p className={`mt-1 text-sm font-semibold ${selectedDetail.isCritical ? 'text-rose-700' : 'text-slate-700'}`}>
                            {selectedDetail.isCritical ? 'Nguy hiểm' : 'Thông thường'}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                          <p className="text-xs font-semibold text-slate-600">Hiển thị cảnh báo</p>
                          {selectedDetail.isCritical
                            ? (
                                <div className="mt-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                                  {selectedDetail.alertMessage || 'Chưa có nội dung cảnh báo.'}
                                </div>
                              )
                            : (
                                <p className="mt-1 text-sm text-slate-700">Không</p>
                              )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <h4 className="text-sm font-bold text-slate-800">Mô tả</h4>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedDetail.description || 'Không có mô tả.'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <h4 className="text-sm font-bold text-slate-800">Trạng thái</h4>
                    <p className="mt-1 text-sm text-slate-700">
                      {selectedDetail.isActive ? 'Đang hoạt động' : 'Đang ẩn'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <h4 className="text-sm font-bold text-slate-800">Điểm theo thời gian</h4>
                    {selectedDetail.timeScoreList && selectedDetail.timeScoreList.length > 0
                      ? (
                          <div className="mt-2 space-y-2">
                            <div className="grid grid-cols-3 gap-2 rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500">
                              <span>Từ (phút)</span>
                              <span>Đến (phút)</span>
                              <span>Điểm</span>
                            </div>
                            {selectedDetail.timeScoreList.map(item => (
                              <div
                                key={`${item.minMinutes}-${item.maxMinutes}-${item.score}`}
                                className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                              >
                                <span className="font-semibold text-slate-800">{item.minMinutes}</span>
                                <span className="font-semibold text-slate-800">{item.maxMinutes}</span>
                                <span className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                  {item.score}
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      : (
                          <p className="mt-1 text-sm text-slate-500">Không có cấu hình điểm thời gian.</p>
                        )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <h4 className="text-sm font-bold text-slate-800">Tạo lúc</h4>
                      <p className="mt-1 text-sm text-slate-600">
                        {new Date(selectedDetail.createdAt).toLocaleString('vi-VN', { hour12: false })}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <h4 className="text-sm font-bold text-slate-800">Cập nhật lúc</h4>
                      <p className="mt-1 text-sm text-slate-600">
                        {new Date(selectedDetail.updatedAt).toLocaleString('vi-VN', { hour12: false })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45"
            onClick={closeModal}
            aria-label="Đóng popup"
          />

          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {modalMode === 'create' ? 'Tạo cấu hình triệu chứng' : 'Cập nhật cấu hình triệu chứng'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="size-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {modalError}
              </div>
            )}

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-700">
                    Nhóm câu hỏi
                    {' '}
                    <span className="text-rose-600">*</span>
                  </p>
                  <select
                    value={form.groupName}
                    onChange={event => handleFormGroupChange(event.target.value as SymptomConfigGroupName)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${formErrors.groupName ? 'border-rose-300 bg-rose-50' : 'border-slate-300 focus:border-emerald-600'}`}
                  >
                    {Object.entries(GROUP_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  {formErrors.groupName && <p className="mt-1 text-xs text-rose-600">{formErrors.groupName}</p>}
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-700">
                    Khóa thuộc tính
                    {' '}
                    <span className="text-rose-600">*</span>
                  </p>
                  <select
                    value={form.attributeKey}
                    onChange={event => handleFormAttributeKeyChange(event.target.value as SymptomConfigAttributeKey)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${formErrors.attributeKey ? 'border-rose-300 bg-rose-50' : 'border-slate-300 focus:border-emerald-600'}`}
                  >
                    {formAttributeKeys.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {formErrors.attributeKey && <p className="mt-1 text-xs text-rose-600">{formErrors.attributeKey}</p>}
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-slate-700">
                  Tiêu đề câu hỏi
                  {' '}
                  <span className="text-rose-600">*</span>
                </p>
                <input
                  value={form.attributeLabel}
                  onChange={event => setFormField('attributeLabel', event.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${formErrors.attributeLabel ? 'border-rose-300 bg-rose-50' : 'border-slate-300 focus:border-emerald-600'}`}
                />
                {attributeLabelHint && <p className="mt-1 text-xs text-slate-500">{attributeLabelHint}</p>}
                {formErrors.attributeLabel && <p className="mt-1 text-xs text-rose-600">{formErrors.attributeLabel}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-700">
                    Thứ tự hiển thị
                    {' '}
                    <span className="text-rose-600">*</span>
                  </p>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={form.displayOrder}
                    onChange={event => setFormField('displayOrder', Number(event.target.value))}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${formErrors.displayOrder ? 'border-rose-300 bg-rose-50' : 'border-slate-300 focus:border-emerald-600'}`}
                  />
                  {formErrors.displayOrder && <p className="mt-1 text-xs text-rose-600">{formErrors.displayOrder}</p>}
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-700">
                    Tuỳ chọn
                    {' '}
                    <span className="text-rose-600">*</span>
                  </p>
                  <input
                    value={form.name}
                    onChange={event => setFormField('name', event.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${formErrors.name ? 'border-rose-300 bg-rose-50' : 'border-slate-300 focus:border-emerald-600'}`}
                  />
                  {formErrors.name && <p className="mt-1 text-xs text-rose-600">{formErrors.name}</p>}
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-slate-700">Mô tả</p>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={event => setFormField('description', event.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${formErrors.description ? 'border-rose-300 bg-rose-50' : 'border-slate-300 focus:border-emerald-600'}`}
                />
                {formErrors.description && <p className="mt-1 text-xs text-rose-600">{formErrors.description}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-700">Loại điểm</p>
                  <div className="flex gap-2">
                    {[1, 2].map(value => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormField('category', value as SymptomCategory)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                          form.category === value
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {CATEGORY_LABELS[value as SymptomCategory]}
                      </button>
                    ))}
                  </div>
                  {formErrors.category && <p className="mt-1 text-xs text-rose-600">{formErrors.category}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <label className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-700">
                    Tuỳ chọn nguy hiểm
                    <input
                      type="checkbox"
                      checked={form.isCritical}
                      onChange={(event) => {
                        const nextValue = event.target.checked;
                        setForm(prev => ({
                          ...prev,
                          isCritical: nextValue,
                          alertMessage: nextValue ? prev.alertMessage : '',
                        }));
                        setFormErrors(prev => ({ ...prev, isCritical: undefined, alertMessage: undefined }));
                        setModalError(null);
                      }}
                    />
                  </label>
                  <p className="mt-1 text-xs text-slate-500">Hiển thị cảnh báo ngay khi chọn.</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <label className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-700">
                    Đang hoạt động
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={event => setFormField('isActive', event.target.checked)}
                    />
                  </label>
                  <p className="mt-1 text-xs text-slate-500">Ẩn khỏi mobile UI khi tắt.</p>
                </div>
              </div>

              {form.isCritical && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-700">Cảnh báo</p>
                  <textarea
                    rows={3}
                    value={form.alertMessage}
                    onChange={event => setFormField('alertMessage', event.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${formErrors.alertMessage ? 'border-rose-300 bg-rose-50' : 'border-slate-300 focus:border-emerald-600'}`}
                  />
                  {formErrors.alertMessage && <p className="mt-1 text-xs text-rose-600">{formErrors.alertMessage}</p>}
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700">Điểm theo thời gian</p>
                  <button
                    type="button"
                    onClick={addTimeScoreRow}
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    + Thêm dòng
                  </button>
                </div>

                {form.timeScoreList.length === 0
                  ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                        Chưa có dòng điểm theo thời gian.
                      </div>
                    )
                  : (
                      <div className="space-y-2">
                        {form.timeScoreList.map((row, index) => (
                          <div
                            key={row.rowId}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-xs font-semibold text-slate-600">
                                Dòng
                                {' '}
                                {index + 1}
                              </p>
                              <button
                                type="button"
                                onClick={() => removeTimeScoreRow(index)}
                                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                              >
                                Xóa
                              </button>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                              <div>
                                <p className="mb-1 text-xs font-semibold text-slate-600">Min (phút)</p>
                                <input
                                  type="number"
                                  value={row.minMinutes}
                                  onChange={event => updateTimeScoreRow(index, { minMinutes: Number(event.target.value) })}
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                                />
                              </div>
                              <div>
                                <p className="mb-1 text-xs font-semibold text-slate-600">Max (phút)</p>
                                <input
                                  type="number"
                                  value={row.maxMinutes}
                                  onChange={event => updateTimeScoreRow(index, { maxMinutes: Number(event.target.value) })}
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                                />
                              </div>
                              <div>
                                <p className="mb-1 text-xs font-semibold text-slate-600">Điểm</p>
                                <input
                                  type="number"
                                  value={row.score}
                                  onChange={event => updateTimeScoreRow(index, { score: Number(event.target.value) })}
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                {formErrors.timeScoreList && <p className="mt-1 text-xs text-rose-600">{formErrors.timeScoreList}</p>}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {modalMode === 'create' ? 'Tạo cấu hình' : 'Lưu cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-2000 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-rose-600" />
              <h4 className="text-base font-bold text-slate-900">Xóa cấu hình triệu chứng</h4>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Hành động này sẽ ẩn cấu hình khỏi danh sách active. Bạn có chắc chắn muốn tiếp tục?
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
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
