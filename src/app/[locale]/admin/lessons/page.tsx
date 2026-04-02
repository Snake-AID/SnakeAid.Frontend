'use client';

import type { LessonItem, LessonUpsertPayload } from '@/types/lesson.type';
import { Eye, EyeOff, Pencil, Plus, RefreshCcw, Search, Tag, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ApiClientError } from '@/apis/client';
import { lessonApi } from '@/apis/lesson.api';
import LessonContentPreview from '@/components/admin/LessonContentPreview';
import LessonUpsertModal from '@/components/admin/LessonUpsertModal';
import { useToast } from '@/components/ToastProvider';

const CATEGORY_LABEL_MAP: Record<string, string> = {
  Safety: 'An toàn',
  Catching: 'Bắt rắn',
  FirstAid: 'Sơ cứu',
};

const createEmptyPayload = (): LessonUpsertPayload => ({
  title: '',
  content: '',
  category: 'Safety',
  isPublished: true,
});

const mapToPayload = (item: LessonItem): LessonUpsertPayload => ({
  title: item.title ?? '',
  content: item.content ?? '',
  category: (item.category as LessonUpsertPayload['category']) ?? 'Safety',
  isPublished: item.isPublished,
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

const toVNDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString('vi-VN', { hour12: false });
};

const toCategoryLabel = (value: string) => CATEGORY_LABEL_MAP[value] ?? value;

type CategoryFilter = 'All' | 'Safety' | 'Catching' | 'FirstAid';
type PublishFilter = 'All' | 'published' | 'draft';

const CATEGORY_FILTER_TABS: CategoryFilter[] = ['All', 'Safety', 'Catching', 'FirstAid'];
const CATEGORY_FILTER_LABEL: Record<CategoryFilter, string> = {
  All: 'Tất cả',
  Safety: 'An toàn',
  Catching: 'Bắt rắn',
  FirstAid: 'Sơ cứu',
};

const CATEGORY_CHIP: Record<string, string> = {
  Safety: 'bg-emerald-50 text-emerald-700',
  Catching: 'bg-orange-50 text-orange-700',
  FirstAid: 'bg-rose-50 text-rose-700',
};

const PUBLISH_FILTER_TABS: PublishFilter[] = ['All', 'published', 'draft'];
const PUBLISH_FILTER_LABEL: Record<PublishFilter, string> = {
  All: 'Tất cả',
  published: 'Xuất bản',
  draft: 'Nháp',
};

export default function LessonsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<LessonItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<LessonItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [publishFilter, setPublishFilter] = useState<PublishFilter>('All');

  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSession, setModalSession] = useState(0);
  const [formMode, setFormMode] = useState<'create' | 'update'>('create');
  const [formInitialValue, setFormInitialValue] = useState<LessonUpsertPayload>(() => createEmptyPayload());
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedSummary = useMemo(
    () => items.find(item => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (categoryFilter !== 'All' && item.category !== categoryFilter) {
        return false;
      }
      if (publishFilter === 'published' && !item.isPublished) {
        return false;
      }
      if (publishFilter === 'draft' && item.isPublished) {
        return false;
      }
      if (q && !item.title.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [items, searchQuery, categoryFilter, publishFilter]);

  const countByCategory = useMemo(() => {
    const map: Record<string, number> = { All: items.length };
    for (const item of items) {
      map[item.category] = (map[item.category] ?? 0) + 1;
    }
    return map;
  }, [items]);

  const loadList = async (preferredId?: string | null, pinToTop = false) => {
    setIsListLoading(true);
    setListError(null);

    try {
      const data = await lessonApi.getAll();
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
      console.error('Failed to load lessons', err);
      setListError('Không thể tải danh sách bài học. Vui lòng thử lại.');
      showToast('Không thể tải danh sách bài học.', { type: 'error' });
    } finally {
      setIsListLoading(false);
    }
  };

  const loadDetail = async (id: string) => {
    setIsDetailLoading(true);
    setDetailError(null);

    try {
      const detail = await lessonApi.getById(id);
      setSelectedDetail(detail);
    } catch (err) {
      console.error('Failed to load lesson detail', err);
      setSelectedDetail(null);
      setDetailError('Không thể tải chi tiết bài học. Vui lòng thử lại.');
      showToast('Không thể tải chi tiết bài học.', { type: 'error' });
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
      const latest = await lessonApi.getById(selectedId);
      setFormMode('update');
      setFormInitialValue(mapToPayload(latest));
      setModalSession(prev => prev + 1);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to load lesson before update', err);
      setActionError('Không thể tải dữ liệu mới nhất để cập nhật. Vui lòng thử lại.');
      showToast('Không thể tải dữ liệu bài học để cập nhật.', { type: 'error' });
    }
  };

  const submitUpsert = async (payload: LessonUpsertPayload) => {
    setIsSubmittingForm(true);
    setActionError(null);

    const normalized: LessonUpsertPayload = {
      title: payload.title.trim(),
      content: payload.content.trim(),
      category: payload.category,
      isPublished: payload.isPublished,
    };

    try {
      let targetId: string | null = null;

      if (formMode === 'create') {
        const created = await lessonApi.create(normalized);
        targetId = created.id;
      } else if (selectedId != null) {
        const updated = await lessonApi.update(selectedId, normalized);
        targetId = updated.id ?? selectedId;
      }

      if (targetId != null) {
        await loadList(targetId, formMode === 'create');
        await loadDetail(targetId);
      }

      showToast(formMode === 'create' ? 'Đã tạo bài học mới.' : 'Đã cập nhật bài học.', { type: 'success' });
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to submit lesson form', err);
      const fallback = formMode === 'create'
        ? 'Tạo bài học thất bại. Vui lòng kiểm tra dữ liệu rồi thử lại.'
        : 'Cập nhật bài học thất bại. Vui lòng thử lại.';
      const validationMessage = getValidationMessage(err, fallback);
      setActionError(validationMessage);
      showToast(validationMessage, { type: 'error' });
      throw new Error(validationMessage);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleDelete = async () => {
    if (selectedId == null || isDeleting) {
      return;
    }

    // eslint-disable-next-line no-alert
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa bài học này không?');
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setActionError(null);

    try {
      await lessonApi.remove(selectedId);
      await loadList(null);
      setSelectedDetail(null);
      showToast('Đã xóa bài học.', { type: 'success' });
    } catch (err) {
      console.error('Failed to delete lesson', err);
      setActionError('Xóa bài học thất bại. Vui lòng thử lại.');
      showToast('Xóa bài học thất bại.', { type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCategoryChange = (cat: CategoryFilter) => {
    setCategoryFilter(cat);
    const q = searchQuery.trim().toLowerCase();
    const first = items.find((item) => {
      if (cat !== 'All' && item.category !== cat) {
        return false;
      }
      if (publishFilter === 'published' && !item.isPublished) {
        return false;
      }
      if (publishFilter === 'draft' && item.isPublished) {
        return false;
      }
      if (q && !item.title.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
    setSelectedId(first?.id ?? null);
  };

  const handlePublishChange = (pub: PublishFilter) => {
    setPublishFilter(pub);
    const q = searchQuery.trim().toLowerCase();
    const first = items.find((item) => {
      if (categoryFilter !== 'All' && item.category !== categoryFilter) {
        return false;
      }
      if (pub === 'published' && !item.isPublished) {
        return false;
      }
      if (pub === 'draft' && item.isPublished) {
        return false;
      }
      if (q && !item.title.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
    setSelectedId(first?.id ?? null);
  };

  useEffect(() => {
    void loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId == null) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setSelectedDetail(null);
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setDetailError(null);
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
              <h2 className="text-3xl font-bold text-slate-900">Quản lý bài học</h2>
              <p className="mt-1 text-sm text-slate-500">
                Quản trị nội dung bài học cho Safety, Catching, FirstAid và trạng thái xuất bản.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800"
              >
                <Plus className="size-4" />
                Thêm bài học
              </button>
              <button
                type="button"
                onClick={() => void loadList(selectedId)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <RefreshCcw className="size-4" />
                Làm mới
              </button>
            </div>
          </div>
        </header>

        <section className="grid min-h-[calc(100vh-240px)] grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="min-h-0 lg:col-span-4 xl:col-span-3">
            <div className="flex h-full min-h-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Danh sách bài học</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {filteredItems.length !== items.length
                    ? `${filteredItems.length}/${items.length}`
                    : items.length}
                  {' '}
                  bài
                </span>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm bài học..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-8 text-xs text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {CATEGORY_FILTER_TABS.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                        categoryFilter === cat
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {CATEGORY_FILTER_LABEL[cat]}
                      {countByCategory[cat] !== undefined && (
                        <span className={`ml-1 ${categoryFilter === cat ? 'opacity-75' : 'text-slate-400'}`}>
                          {countByCategory[cat]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1">
                  {PUBLISH_FILTER_TABS.map(pub => (
                    <button
                      key={pub}
                      type="button"
                      onClick={() => handlePublishChange(pub)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                        publishFilter === pub
                          ? pub === 'published'
                            ? 'bg-emerald-600 text-white'
                            : pub === 'draft'
                              ? 'bg-slate-500 text-white'
                              : 'bg-teal-700 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {PUBLISH_FILTER_LABEL[pub]}
                    </button>
                  ))}
                </div>
              </div>

              {isListLoading && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Đang tải danh sách bài học...
                </div>
              )}

              {listError && !isListLoading && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {listError}
                </div>
              )}

              {!isListLoading && !listError && (
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                  {filteredItems.length === 0 && (
                    <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                      {items.length === 0 ? 'Chưa có bài học nào.' : 'Không có bài học nào khớp với bộ lọc.'}
                    </p>
                  )}

                  {filteredItems.map((item) => {
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
                        <p className="line-clamp-2 text-sm font-semibold text-slate-900">{item.title}</p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_CHIP[item.category] ?? 'bg-blue-50 text-blue-700'}`}>
                            {toCategoryLabel(item.category)}
                          </span>
                          <span className={`text-xs font-semibold ${item.isPublished ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {item.isPublished ? 'Đã xuất bản' : 'Nháp'}
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
            <div className="flex h-full min-h-0 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              {selectedId == null && (
                <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600">
                  Chọn một bài học ở danh sách bên trái để xem chi tiết.
                </div>
              )}

              {actionError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {actionError}
                </div>
              )}

              {isDetailLoading && selectedId != null && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Đang tải chi tiết bài học...
                </div>
              )}

              {detailError && !isDetailLoading && selectedId != null && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {detailError}
                </div>
              )}

              {selectedSummary && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <Tag className="size-4 text-slate-500" />
                      {toCategoryLabel(selectedSummary.category)}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${selectedSummary.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                      {selectedSummary.isPublished ? 'Đã xuất bản' : 'Nháp'}
                    </span>
                  </div>
                </div>
              )}

              {selectedDetail && !isDetailLoading && !detailError && (
                <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-bold text-slate-900">{selectedDetail.title}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>
                          Tạo lúc:
                          {' '}
                          {toVNDateTime(selectedDetail.createdAt)}
                        </span>
                        <span>
                          Cập nhật:
                          {' '}
                          {toVNDateTime(selectedDetail.updatedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void openUpdateForm()}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Pencil className="size-4" />
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <Trash2 className="size-4" />
                        {isDeleting ? 'Đang xóa...' : 'Xóa'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <LessonContentPreview content={selectedDetail.content} category={selectedDetail.category} />
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
                    {selectedDetail.isPublished
                      ? (
                          <>
                            <Eye className="size-4 text-emerald-600" />
                            Hiển thị cho người dùng.
                          </>
                        )
                      : (
                          <>
                            <EyeOff className="size-4" />
                            Bài học đang ở trạng thái nháp.
                          </>
                        )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <LessonUpsertModal
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
