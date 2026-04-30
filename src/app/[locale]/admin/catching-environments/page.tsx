'use client';

import type {
  CatchingEnvironment,
  CatchingEnvironmentUpsertPayload,
} from '@/types/catching-environment.type';
import { Loader2, PencilLine, Plus, RefreshCcw, Save, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { catchingEnvironmentApi } from '@/apis/catching-environment.api';
import { ApiClientError } from '@/apis/client';
import { useToast } from '@/components/ToastProvider';

interface CatchingEnvironmentFormState {
  name: string;
  description: string;
  price: number;
  currency: string;
}

type CatchingEnvironmentFormErrors = Partial<Record<keyof CatchingEnvironmentFormState, string>>;

type ModalMode = 'create' | 'update' | null;

const EMPTY_FORM: CatchingEnvironmentFormState = {
  name: '',
  description: '',
  price: 0,
  currency: 'VND',
};

const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString('vi-VN')} ${currency || 'VND'}`;
  }
};

const getValidationMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof ApiClientError)) {
    return fallback;
  }

  const validationEntries = Object.entries(error.error?.validationErrors ?? {});
  if (!validationEntries.length) {
    return error.message || fallback;
  }

  return validationEntries
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join(' | ');
};

const getFieldValidationErrors = (error: unknown): CatchingEnvironmentFormErrors => {
  if (!(error instanceof ApiClientError)) {
    return {};
  }

  const raw = error.error?.validationErrors ?? {};
  const errors: CatchingEnvironmentFormErrors = {};

  const resolveFirstMessage = (fieldNames: string[]) => {
    for (const fieldName of fieldNames) {
      const messages = raw[fieldName];
      if (messages && messages.length > 0) {
        return messages[0];
      }
    }
    return undefined;
  };

  errors.name = resolveFirstMessage(['name']);
  errors.description = resolveFirstMessage(['description']);
  errors.price = resolveFirstMessage(['price']);
  errors.currency = resolveFirstMessage(['currency']);

  return errors;
};

export default function CatchingEnvironmentsPage() {
  const { showToast } = useToast();

  const [items, setItems] = useState<CatchingEnvironment[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<CatchingEnvironment | null>(null);

  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState<CatchingEnvironmentFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<CatchingEnvironmentFormErrors>({});
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCreateMode = modalMode === 'create';
  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));

    if (!keyword) {
      return sorted;
    }

    return sorted.filter((item) => {
      const searchable = [
        item.name,
        item.description ?? '',
        item.price.toString(),
        item.currency,
      ].join(' ').toLowerCase();

      return searchable.includes(keyword);
    });
  }, [items, searchTerm]);

  const selectedSummary = useMemo(
    () => items.find(item => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const loadList = useCallback(async (preferredId?: number | null) => {
    setListLoading(true);
    setListError(null);

    try {
      const data = await catchingEnvironmentApi.getAll();
      setItems(data ?? []);

      setSelectedId((prev) => {
        const targetId = preferredId ?? prev;
        if (targetId != null && data.some(item => item.id === targetId)) {
          return targetId;
        }

        return data[0]?.id ?? null;
      });
    } catch (error) {
      console.error('Failed to load catching environments list', error);
      const message = getValidationMessage(error, 'Không thể tải danh sách môi trường bắt rắn.');
      setListError(message);
      showToast(message, { type: 'error' });
    } finally {
      setListLoading(false);
    }
  }, [showToast]);

  const loadDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    setDetailError(null);

    try {
      const detail = await catchingEnvironmentApi.getById(id);
      setSelectedDetail(detail);
    } catch (error) {
      console.error('Failed to load catching environment detail', error);
      setSelectedDetail(null);
      const message = getValidationMessage(error, 'Không thể tải chi tiết môi trường bắt rắn.');
      setDetailError(message);
      showToast(message, { type: 'error' });
    } finally {
      setDetailLoading(false);
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

  const setFormField = <K extends keyof CatchingEnvironmentFormState>(
    field: K,
    value: CatchingEnvironmentFormState[K],
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: undefined }));
    setModalError(null);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setForm({ ...EMPTY_FORM });
    setFormErrors({});
    setModalError(null);
  };

  const openUpdateModal = async () => {
    if (!selectedId) {
      showToast('Vui lòng chọn môi trường cần chỉnh sửa.', { type: 'warning' });
      return;
    }

    setFormErrors({});
    setModalError(null);

    try {
      const detail = await catchingEnvironmentApi.getById(selectedId);
      setForm({
        name: detail.name ?? '',
        description: detail.description ?? '',
        price: Number(detail.price ?? 0),
        currency: 'VND',
      });
      setModalMode('update');
    } catch (error) {
      console.error('Failed to prepare update mode', error);
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
    payload?: CatchingEnvironmentUpsertPayload;
    errors: CatchingEnvironmentFormErrors;
  } => {
    const errors: CatchingEnvironmentFormErrors = {};

    if (!form.name.trim()) {
      errors.name = 'Vui lòng nhập tên môi trường.';
    }

    if (Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
      errors.price = 'Giá phải là số không âm.';
    }

    if (!form.currency.trim()) {
      errors.currency = 'Tiền tệ là bắt buộc.';
    }

    if (Object.values(errors).some(Boolean)) {
      return { errors };
    }

    return {
      payload: {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        currency: 'VND',
      },
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

      if (isCreateMode) {
        const created = await catchingEnvironmentApi.create(payload);
        savedId = created.id;
      } else if (selectedId != null) {
        const updated = await catchingEnvironmentApi.update(selectedId, payload);
        savedId = updated.id ?? selectedId;
      }

      await loadList(savedId);

      if (savedId != null) {
        await loadDetail(savedId);
      }

      closeModal();
      showToast(isCreateMode ? 'Đã tạo môi trường bắt rắn mới.' : 'Đã cập nhật môi trường bắt rắn.', { type: 'success' });
    } catch (error) {
      console.error('Failed to save catching environment', error);
      const validationErrors = getFieldValidationErrors(error);
      if (Object.values(validationErrors).some(Boolean)) {
        setFormErrors(prev => ({ ...prev, ...validationErrors }));
      }

      const message = getValidationMessage(error, 'Lưu môi trường bắt rắn thất bại.');
      setModalError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteConfirm = () => {
    if (!selectedId) {
      showToast('Vui lòng chọn môi trường cần xóa.', { type: 'warning' });
      return;
    }

    setIsDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    if (isDeleting) {
      return;
    }

    setIsDeleteConfirmOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedId) {
      return;
    }

    setIsDeleting(true);

    try {
      await catchingEnvironmentApi.remove(selectedId);
      setSelectedDetail(null);
      await loadList(null);
      showToast('Đã xóa môi trường bắt rắn.', { type: 'success' });
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Failed to delete catching environment', error);
      const message = getValidationMessage(error, 'Xóa môi trường bắt rắn thất bại.');
      showToast(message, { type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefreshList = async () => {
    await loadList(selectedId);
    showToast('Đã làm mới danh sách môi trường.', { type: 'success' });
  };

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-360 flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Quản lý môi trường bắt rắn</h2>
              <p className="mt-1 text-sm text-slate-500">
                Quản trị danh sách môi trường và giá dịch vụ bắt rắn.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                <Plus className="size-4" />
                Tạo môi trường
              </button>
              <button
                type="button"
                onClick={() => void handleRefreshList()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <RefreshCcw className="size-4" />
                Làm mới danh sách
              </button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Danh sách môi trường</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {filteredItems.length}
                  {' '}
                  mục
                </span>
              </div>

              <label className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <Search className="size-4 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Tìm theo tên, mô tả hoặc giá"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none"
                />
              </label>

              {listLoading && (
                <div className="flex h-44 items-center justify-center gap-2 text-sm text-slate-500">
                  <Loader2 className="size-4 animate-spin" />
                  Đang tải danh sách môi trường...
                </div>
              )}

              {!listLoading && listError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {listError}
                </div>
              )}

              {!listLoading && !listError && (
                <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                  {filteredItems.length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                      Không tìm thấy môi trường phù hợp.
                    </div>
                  )}

                  {filteredItems.map((item) => {
                    const isActive = selectedId === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          isActive
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            {formatCurrency(item.price, item.currency)}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {item.description || 'Không có mô tả'}
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
                  <h3 className="text-xl font-bold text-slate-900">Chi tiết môi trường</h3>
                  {selectedSummary && (
                    <p className="mt-1 text-xs text-slate-500">
                      Mã môi trường:
                      {' '}
                      {selectedSummary.id}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void openUpdateModal()}
                    disabled={!selectedId || detailLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PencilLine className="size-4" />
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    onClick={openDeleteConfirm}
                    disabled={!selectedId || detailLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="size-4" />
                    Xóa môi trường
                  </button>
                </div>
              </div>

              {!selectedId && !detailLoading && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Chọn một môi trường ở danh sách bên trái để xem chi tiết.
                </div>
              )}

              {detailLoading && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <Loader2 className="size-4 animate-spin" />
                  Đang tải chi tiết môi trường...
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
                    <h4 className="text-sm font-bold text-slate-800">Tên môi trường</h4>
                    <p className="mt-1 text-sm text-slate-700">{selectedDetail.name}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <h4 className="text-sm font-bold text-slate-800">Mô tả</h4>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {selectedDetail.description || 'Không có mô tả'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <h4 className="text-sm font-bold text-slate-800">Giá dịch vụ</h4>
                      <p className="mt-1 text-sm text-slate-700">
                        {formatCurrency(selectedDetail.price, selectedDetail.currency)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <h4 className="text-sm font-bold text-slate-800">Đơn vị tiền tệ</h4>
                      <p className="mt-1 text-sm text-slate-700">{selectedDetail.currency || 'VND'}</p>
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

          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {isCreateMode ? 'Tạo môi trường mới' : 'Chỉnh sửa môi trường'}
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
                  Tên môi trường
                  {' '}
                  <span className="text-rose-600">*</span>
                </p>
                <input
                  value={form.name}
                  onChange={event => setFormField('name', event.target.value)}
                  placeholder="Ví dụ: Khu công nghiệp, khu chế xuất"
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${formErrors.name ? 'border-rose-300 bg-rose-50' : 'border-slate-300 focus:border-blue-600'}`}
                />
                {formErrors.name && <p className="mt-1 text-xs text-rose-600">{formErrors.name}</p>}
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-slate-700">Mô tả</p>
                <textarea
                  value={form.description}
                  onChange={event => setFormField('description', event.target.value)}
                  placeholder="Mô tả dịch vụ bắt rắn"
                  rows={3}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${formErrors.description ? 'border-rose-300 bg-rose-50' : 'border-slate-300 focus:border-blue-600'}`}
                />
                {formErrors.description && <p className="mt-1 text-xs text-rose-600">{formErrors.description}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-700">
                    Giá dịch vụ
                    {' '}
                    <span className="text-rose-600">*</span>
                  </p>
                  <input
                    type="number"
                    min={0}
                    step="1000"
                    value={Number.isNaN(Number(form.price)) ? '' : form.price}
                    onChange={event => setFormField('price', Number(event.target.value))}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${formErrors.price ? 'border-rose-300 bg-rose-50' : 'border-slate-300 focus:border-blue-600'}`}
                  />
                  {formErrors.price && <p className="mt-1 text-xs text-rose-600">{formErrors.price}</p>}
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-700">Đơn vị tiền tệ</p>
                  <input
                    value="VND"
                    readOnly
                    className="w-full cursor-not-allowed rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-600"
                  />
                  {formErrors.currency && <p className="mt-1 text-xs text-rose-600">{formErrors.currency}</p>}
                </div>
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
                {isSaving
                  ? <Loader2 className="size-4 animate-spin" />
                  : <Save className="size-4" />}
                {isCreateMode ? 'Tạo môi trường' : 'Lưu cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45"
            onClick={closeDeleteConfirm}
            aria-label="Đóng popup"
          />

          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Xác nhận xóa</h3>
              <button
                type="button"
                onClick={closeDeleteConfirm}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Bạn có chắc chắn muốn xóa môi trường
              {' '}
              <span className="font-semibold text-slate-900">{selectedSummary?.name}</span>
              {' '}
              không?
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                disabled={isDeleting}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting
                  ? <Loader2 className="size-4 animate-spin" />
                  : <Trash2 className="size-4" />}
                Xóa môi trường
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
