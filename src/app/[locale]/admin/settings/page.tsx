'use client';

import type {
  SettingValueType,
  SystemSetting,
  UpsertSystemSettingRequest,
} from '@/types/system-setting.type';
import { Loader2, PencilLine, Plus, RefreshCcw, Save, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiClientError } from '@/apis/client';
import { systemSettingApi } from '@/apis/system-setting.api';
import { useToast } from '@/components/ToastProvider';

interface SettingFormState {
  settingKey: string;
  value: string;
  description: string;
  valueType: SettingValueType;
}

type SettingFormErrors = Partial<Record<'settingKey' | 'value' | 'description' | 'valueType', string>>;

type ModalMode = 'create' | 'edit' | null;

const VALUE_TYPE_OPTIONS: Array<{ value: SettingValueType; label: string; hint: string }> = [
  { value: 'String', label: 'Chuỗi (String)', hint: 'Chấp nhận mọi chuỗi không rỗng.' },
  { value: 'Int', label: 'Số nguyên (Int)', hint: 'Giá trị phải là số nguyên hợp lệ.' },
  { value: 'Decimal', label: 'Số thập phân (Decimal)', hint: 'Giá trị phải là số thập phân hợp lệ.' },
  { value: 'Boolean', label: 'Đúng/Sai (Boolean)', hint: 'Chỉ chấp nhận true hoặc false.' },
  { value: 'Json', label: 'JSON (Json)', hint: 'Giá trị phải parse JSON thành công.' },
];

const VALUE_TYPE_BADGE_CLASS: Record<SettingValueType, string> = {
  String: 'bg-slate-100 text-slate-700',
  Int: 'bg-blue-100 text-blue-700',
  Decimal: 'bg-emerald-100 text-emerald-700',
  Boolean: 'bg-violet-100 text-violet-700',
  Json: 'bg-amber-100 text-amber-700',
};

const EMPTY_FORM: SettingFormState = {
  settingKey: '',
  value: '',
  description: '',
  valueType: 'String',
};

const INT_PATTERN = /^-?\d+$/;
const DECIMAL_PATTERN = /^-?\d+(?:\.\d+)?$/;

const mapSettingToForm = (setting: SystemSetting): SettingFormState => ({
  settingKey: setting.settingKey,
  value: setting.value,
  description: setting.description ?? '',
  valueType: setting.valueType,
});

const getValueTypeLabel = (valueType: SettingValueType) => {
  return VALUE_TYPE_OPTIONS.find(option => option.value === valueType)?.label ?? valueType;
};

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

const formatValueForDetail = (valueType: SettingValueType, value: string) => {
  if (valueType === 'Json') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  return value;
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

const getFieldValidationErrors = (error: unknown): SettingFormErrors => {
  if (!(error instanceof ApiClientError)) {
    return {};
  }

  const raw = error.error?.validationErrors ?? {};
  const errors: SettingFormErrors = {};

  const resolveFirstMessage = (fieldNames: string[]) => {
    for (const fieldName of fieldNames) {
      const messages = raw[fieldName];
      if (messages && messages.length > 0) {
        return messages[0];
      }
    }
    return undefined;
  };

  errors.settingKey = resolveFirstMessage(['settingKey', 'key']);
  errors.value = resolveFirstMessage(['value']);
  errors.valueType = resolveFirstMessage(['valueType']);
  errors.description = resolveFirstMessage(['description']);

  return errors;
};

export default function SettingsPage() {
  const { showToast } = useToast();

  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<SystemSetting | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState<SettingFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<SettingFormErrors>({});
  const [modalError, setModalError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isReloadingKey, setIsReloadingKey] = useState(false);
  const [isReloadingAll, setIsReloadingAll] = useState(false);

  const isCreateMode = modalMode === 'create';
  const isEditMode = modalMode === 'edit';

  const selectedSummary = useMemo(
    () => settings.find(item => item.settingKey === selectedKey) ?? null,
    [settings, selectedKey],
  );

  const filteredSettings = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const sorted = [...settings].sort((a, b) => a.settingKey.localeCompare(b.settingKey));

    if (!keyword) {
      return sorted;
    }

    return sorted.filter((setting) => {
      const searchable = [
        setting.settingKey,
        setting.value,
        setting.valueType,
        setting.description ?? '',
      ].join(' ').toLowerCase();

      return searchable.includes(keyword);
    });
  }, [searchTerm, settings]);

  const currentValueTypeHint = useMemo(() => {
    return VALUE_TYPE_OPTIONS.find(option => option.value === form.valueType)?.hint ?? '';
  }, [form.valueType]);

  const normalizedSettingKey = form.settingKey.trim();
  const isSettingKeyValid = normalizedSettingKey.length > 0 && normalizedSettingKey.length <= 100;

  const loadSettings = useCallback(async (options?: { preferredKey?: string | null; showSuccessToast?: boolean }) => {
    setListLoading(true);
    setListError(null);

    try {
      const data = await systemSettingApi.getAll();
      setSettings(data);

      const preferredKey = options?.preferredKey ?? null;
      if (preferredKey && data.some(item => item.settingKey === preferredKey)) {
        setSelectedKey(preferredKey);
      } else {
        setSelectedKey(data[0]?.settingKey ?? null);
        if (!data[0]?.settingKey) {
          setSelectedDetail(null);
        }
      }

      if (options?.showSuccessToast) {
        showToast('Đã làm mới danh sách cấu hình.', { type: 'success' });
      }
    } catch (error) {
      console.error('Failed to load system settings list', error);
      const message = getApiErrorMessage(error, 'Không thể tải danh sách cấu hình hệ thống.');
      setListError(message);
      showToast(message, { type: 'error' });
    } finally {
      setListLoading(false);
    }
  }, [showToast]);

  const loadDetail = useCallback(async (key: string) => {
    setDetailLoading(true);
    setDetailError(null);

    try {
      const detail = await systemSettingApi.getByKey(key);
      setSelectedDetail(detail);
    } catch (error) {
      console.error('Failed to load system setting detail', error);
      setSelectedDetail(null);
      const message = getApiErrorMessage(error, 'Không thể tải chi tiết cấu hình.');
      setDetailError(message);
      showToast(message, { type: 'error' });
    } finally {
      setDetailLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (selectedKey) {
      void loadDetail(selectedKey);
    }
  }, [loadDetail, selectedKey]);

  const selectSetting = (key: string) => {
    setModalMode(null);
    setSelectedKey(key);
    setFormErrors({});
    setModalError(null);
  };

  const setFormField = <K extends keyof SettingFormState>(field: K, value: SettingFormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: undefined }));
    setModalError(null);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalError(null);
  };

  const openEditModal = async () => {
    if (!selectedKey) {
      showToast('Vui lòng chọn một cấu hình để chỉnh sửa.', { type: 'warning' });
      return;
    }

    setFormErrors({});
    setModalError(null);

    try {
      const detail = selectedDetail ?? await systemSettingApi.getByKey(selectedKey);
      setForm(mapSettingToForm(detail));
      setModalMode('edit');
    } catch (error) {
      console.error('Failed to prepare edit mode', error);
      const message = getApiErrorMessage(error, 'Không thể tải dữ liệu để chỉnh sửa.');
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
    normalizedKey?: string;
    payload?: UpsertSystemSettingRequest;
    errors: SettingFormErrors;
  } => {
    const errors: SettingFormErrors = {};
    const normalizedKey = form.settingKey.trim();
    const normalizedValue = form.value.trim();
    const normalizedDescription = form.description.trim();

    if (!normalizedKey) {
      errors.settingKey = 'Khóa cấu hình là bắt buộc.';
    } else if (normalizedKey.length > 100) {
      errors.settingKey = 'Khóa cấu hình không được vượt quá 100 ký tự.';
    }

    if (!normalizedValue) {
      errors.value = 'Giá trị là bắt buộc.';
    } else if (normalizedValue.length > 10000) {
      errors.value = 'Giá trị không được vượt quá 10000 ký tự.';
    }

    if (normalizedDescription.length > 500) {
      errors.description = 'Mô tả không được vượt quá 500 ký tự.';
    }

    if (!VALUE_TYPE_OPTIONS.some(option => option.value === form.valueType)) {
      errors.valueType = 'Kiểu giá trị không hợp lệ.';
    }

    if (!errors.value && normalizedValue) {
      if (form.valueType === 'Int' && !INT_PATTERN.test(normalizedValue)) {
        errors.value = 'Giá trị phải là số nguyên hợp lệ.';
      }

      if (form.valueType === 'Decimal' && !DECIMAL_PATTERN.test(normalizedValue)) {
        errors.value = 'Giá trị phải là số thập phân hợp lệ.';
      }

      if (form.valueType === 'Boolean') {
        const lower = normalizedValue.toLowerCase();
        if (lower !== 'true' && lower !== 'false') {
          errors.value = 'Giá trị Boolean chỉ chấp nhận true hoặc false.';
        }
      }

      if (form.valueType === 'Json') {
        try {
          JSON.parse(normalizedValue);
        } catch {
          errors.value = 'Giá trị JSON không hợp lệ.';
        }
      }
    }

    if (Object.values(errors).some(Boolean)) {
      return { errors };
    }

    const payloadValue = form.valueType === 'Boolean'
      ? normalizedValue.toLowerCase()
      : normalizedValue;

    return {
      normalizedKey,
      payload: {
        value: payloadValue,
        valueType: form.valueType,
        description: normalizedDescription || undefined,
      },
      errors: {},
    };
  };

  const formatJsonValue = () => {
    if (form.valueType !== 'Json') {
      return;
    }

    try {
      const parsed = JSON.parse(form.value.trim());
      setFormField('value', JSON.stringify(parsed, null, 2));
      showToast('Đã định dạng JSON thành công.', { type: 'success' });
    } catch {
      showToast('JSON không hợp lệ, không thể định dạng.', { type: 'error' });
    }
  };

  const handleSave = async () => {
    const { normalizedKey, payload, errors } = validateForm();
    setFormErrors(errors);

    if (!normalizedKey || !payload) {
      showToast('Vui lòng kiểm tra lại dữ liệu trước khi lưu.', { type: 'error' });
      return;
    }

    setIsSaving(true);
    setModalError(null);

    const isCreate = modalMode === 'create';

    try {
      const saved = await systemSettingApi.upsert(normalizedKey, payload);

      setSettings((prev) => {
        const existed = prev.some(item => item.settingKey === saved.settingKey);
        if (!existed) {
          return [saved, ...prev];
        }

        return prev.map(item => (item.settingKey === saved.settingKey ? saved : item));
      });

      setSelectedKey(saved.settingKey);
      setSelectedDetail(saved);
      closeModal();

      showToast(isCreate ? 'Đã tạo cấu hình mới thành công.' : 'Đã cập nhật cấu hình thành công.', { type: 'success' });
    } catch (error) {
      console.error('Failed to save system setting', error);
      const validationErrors = getFieldValidationErrors(error);
      if (Object.values(validationErrors).some(Boolean)) {
        setFormErrors(prev => ({ ...prev, ...validationErrors }));
      }

      const message = getApiErrorMessage(error, 'Lưu cấu hình thất bại.');
      setModalError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReloadKey = async () => {
    const key = selectedKey;
    if (!key) {
      showToast('Vui lòng chọn một key để tải lại cache.', { type: 'warning' });
      return;
    }

    setIsReloadingKey(true);

    try {
      const result = await systemSettingApi.reloadKey(key);

      if (!result.exists) {
        setSettings((prev) => {
          const next = prev.filter(item => item.settingKey !== key);
          setSelectedKey(next[0]?.settingKey ?? null);
          return next;
        });
        setSelectedDetail(null);

        showToast(`Đã tải lại key ${key}. Key không tồn tại trong DB nên đã bị loại khỏi cache.`, { type: 'warning' });
        return;
      }

      const latest = await systemSettingApi.getByKey(key);
      setSettings((prev) => {
        const existed = prev.some(item => item.settingKey === latest.settingKey);
        if (!existed) {
          return [latest, ...prev];
        }

        return prev.map(item => (item.settingKey === latest.settingKey ? latest : item));
      });
      setSelectedDetail(latest);

      showToast('Đã tải lại cache theo key thành công.', { type: 'success' });
    } catch (error) {
      console.error('Failed to reload setting key', error);
      const message = getApiErrorMessage(error, 'Tải lại cache theo key thất bại.');
      showToast(message, { type: 'error' });
    } finally {
      setIsReloadingKey(false);
    }
  };

  const handleReloadAll = async () => {
    setIsReloadingAll(true);

    try {
      const result = await systemSettingApi.reloadAll();
      await loadSettings({ preferredKey: selectedKey, showSuccessToast: false });

      if (selectedKey) {
        void loadDetail(selectedKey);
      }

      showToast(`Đã áp dụng lại toàn bộ cấu hình động cho hệ thống (${result.count} key).`, { type: 'success' });
    } catch (error) {
      console.error('Failed to reload all settings', error);
      const message = getApiErrorMessage(error, 'Áp dụng lại toàn bộ cấu hình động cho hệ thống thất bại.');
      showToast(message, { type: 'error' });
    } finally {
      setIsReloadingAll(false);
    }
  };

  const handleRefreshList = async () => {
    await loadSettings({ preferredKey: selectedKey, showSuccessToast: true });
  };

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-360 flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Quản lý cấu hình động</h2>
              <p className="mt-1 text-sm text-slate-500">
                Quản trị cấu hình hệ thống và đồng bộ cache theo key hoặc toàn bộ.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                <Plus className="size-4" />
                Tạo cấu hình
              </button>
              <button
                type="button"
                onClick={() => void handleRefreshList()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <RefreshCcw className="size-4" />
                Làm mới danh sách
              </button>
              <button
                type="button"
                onClick={() => void handleReloadAll()}
                disabled={isReloadingAll || isReloadingKey}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isReloadingAll
                  ? <Loader2 className="size-4 animate-spin" />
                  : <RefreshCcw className="size-4" />}
                Áp dụng lại tất cả cấu hình
              </button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Danh sách cấu hình</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {filteredSettings.length}
                  {' '}
                  mục
                </span>
              </div>

              <label className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <Search className="size-4 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Tìm theo khóa, giá trị, kiểu hoặc mô tả"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none"
                />
              </label>

              {listLoading && (
                <div className="flex h-44 items-center justify-center gap-2 text-sm text-slate-500">
                  <Loader2 className="size-4 animate-spin" />
                  Đang tải danh sách cấu hình...
                </div>
              )}

              {!listLoading && listError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {listError}
                </div>
              )}

              {!listLoading && !listError && (
                <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                  {filteredSettings.length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                      Không tìm thấy cấu hình phù hợp.
                    </div>
                  )}

                  {filteredSettings.map((item) => {
                    const isActive = selectedKey === item.settingKey;

                    return (
                      <button
                        key={item.settingKey}
                        type="button"
                        onClick={() => selectSetting(item.settingKey)}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          isActive
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="break-all text-sm font-semibold text-slate-900">{item.settingKey}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${VALUE_TYPE_BADGE_CLASS[item.valueType]}`}>
                            {item.valueType}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description || 'Không có mô tả'}</p>
                        <p className="mt-2 text-[11px] text-slate-400">
                          Cập nhật:
                          {' '}
                          {formatDateTime(item.updatedAt)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
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
                      {formatDateTime(selectedSummary.updatedAt)}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void openEditModal()}
                    disabled={!selectedKey || detailLoading || isReloadingKey || isReloadingAll}
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PencilLine className="size-4" />
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReloadKey()}
                    disabled={!selectedKey || isReloadingKey || isReloadingAll}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isReloadingKey
                      ? <Loader2 className="size-4 animate-spin" />
                      : <RefreshCcw className="size-4" />}
                    Áp dụng lại cấu hình hiện tại
                  </button>
                </div>
              </div>

              {!selectedKey && !detailLoading && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Chọn một cấu hình ở danh sách bên trái để xem chi tiết.
                </div>
              )}

              {detailLoading && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <Loader2 className="size-4 animate-spin" />
                  Đang tải chi tiết cấu hình...
                </div>
              )}

              {!detailLoading && detailError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {detailError}
                </div>
              )}

              {!detailLoading && !detailError && selectedDetail && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <h4 className="text-sm font-bold text-slate-800">Khóa cấu hình</h4>
                    <p className="mt-1 break-all text-sm text-slate-700">{selectedDetail.settingKey}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <h4 className="text-sm font-bold text-slate-800">Kiểu giá trị</h4>
                      <p className="mt-1 text-sm text-slate-700">{getValueTypeLabel(selectedDetail.valueType)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <h4 className="text-sm font-bold text-slate-800">Mô tả</h4>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{selectedDetail.description || 'Không có mô tả'}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <h4 className="text-sm font-bold text-slate-800">Giá trị</h4>
                    {selectedDetail.valueType === 'Json'
                      ? (
                          <pre className="mt-2 max-h-90 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600">
                            {formatValueForDetail(selectedDetail.valueType, selectedDetail.value)}
                          </pre>
                        )
                      : <p className="mt-1 text-sm leading-6 text-slate-600">{formatValueForDetail(selectedDetail.valueType, selectedDetail.value)}</p>}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <h4 className="text-sm font-bold text-slate-800">Tạo lúc</h4>
                      <p className="mt-1 text-sm text-slate-600">{formatDateTime(selectedDetail.createdAt)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <h4 className="text-sm font-bold text-slate-800">Cập nhật lúc</h4>
                      <p className="mt-1 text-sm text-slate-600">{formatDateTime(selectedDetail.updatedAt)}</p>
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

          <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {isCreateMode ? 'Tạo cấu hình mới' : 'Chỉnh sửa cấu hình'}
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

            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-700">
                  Khóa cấu hình
                  {' '}
                  <span className="text-rose-600">*</span>
                </p>
                <input
                  value={form.settingKey}
                  onChange={event => setFormField('settingKey', event.target.value)}
                  readOnly={isEditMode}
                  placeholder="Ví dụ: dispatch.max_radius_km"
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${formErrors.settingKey ? 'border-rose-300 bg-rose-50' : 'border-slate-300 focus:border-blue-600'} ${isEditMode ? 'cursor-not-allowed bg-slate-100 text-slate-500' : ''}`}
                />
                {formErrors.settingKey && <p className="mt-1 text-xs text-rose-600">{formErrors.settingKey}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-700">Kiểu giá trị</p>
                  <select
                    value={form.valueType}
                    onChange={(event) => {
                      const nextType = event.target.value as SettingValueType;
                      setFormField('valueType', nextType);

                      if (nextType === 'Boolean' && !['true', 'false'].includes(form.value.trim().toLowerCase())) {
                        setFormField('value', 'true');
                      }
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${formErrors.valueType ? 'border-rose-300 bg-rose-50' : 'border-slate-300 focus:border-blue-600'}`}
                  >
                    {VALUE_TYPE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">{currentValueTypeHint}</p>
                  {formErrors.valueType && <p className="mt-1 text-xs text-rose-600">{formErrors.valueType}</p>}
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-700">Mô tả</p>
                  <input
                    value={form.description}
                    onChange={event => setFormField('description', event.target.value)}
                    placeholder="Tối đa 500 ký tự"
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${formErrors.description ? 'border-rose-300 bg-rose-50' : 'border-slate-300 focus:border-blue-600'}`}
                  />
                  {formErrors.description && <p className="mt-1 text-xs text-rose-600">{formErrors.description}</p>}
                </div>
              </div>

              <div>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-700">Giá trị</p>
                  {form.valueType === 'Json' && (
                    <button
                      type="button"
                      onClick={formatJsonValue}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Định dạng JSON
                    </button>
                  )}
                </div>

                {form.valueType === 'Boolean'
                  ? (
                      <select
                        value={form.value.trim().toLowerCase() === 'false' ? 'false' : 'true'}
                        onChange={event => setFormField('value', event.target.value)}
                        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${formErrors.value ? 'border-rose-300 bg-rose-50' : 'border-slate-300 focus:border-blue-600'}`}
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    )
                  : (
                      <textarea
                        value={form.value}
                        onChange={event => setFormField('value', event.target.value)}
                        placeholder={
                          form.valueType === 'Json'
                            ? '{\n  "key": "value"\n}'
                            : 'Nhập giá trị...'
                        }
                        rows={form.valueType === 'Json' ? 8 : 5}
                        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${formErrors.value ? 'border-rose-300 bg-rose-50' : 'border-slate-300 focus:border-blue-600'} ${form.valueType === 'Json' ? 'font-mono' : ''}`}
                      />
                    )}
                {formErrors.value && <p className="mt-1 text-xs text-rose-600">{formErrors.value}</p>}
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
                disabled={isSaving || !isSettingKeyValid}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? <Loader2 className="size-4 animate-spin" />
                  : <Save className="size-4" />}
                {isCreateMode ? 'Tạo cấu hình' : 'Lưu cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
