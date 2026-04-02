'use client';

import type {
  BlogDetail,
  BlogStatus,
  BlogSummary,
  BlogTag,
  BlogUpsertPayload,
} from '@/types/blog.type';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { blogApi } from '@/apis/blog.api';
import { ApiClientError } from '@/apis/client';
import BlogContentPreview from '@/components/admin/BlogContentPreview';
import BlogUpsertModal from '@/components/admin/BlogUpsertModal';
import { useToast } from '@/components/ToastProvider';
import {
  BLOG_CATEGORY_LABEL,
  BLOG_STATUS_LABEL,
  BLOG_TAG_LABEL,
} from '@/types/blog.type';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_FILTER_TABS: Array<BlogStatus | 'All'> = [
  'All',
  'PendingApproval',
  'Published',
  'Draft',
  'Rejected',
];

const STATUS_FILTER_LABEL: Record<BlogStatus | 'All', string> = {
  All: 'Tất cả',
  PendingApproval: 'Chờ duyệt',
  Published: 'Đã đăng',
  Draft: 'Bản nháp',
  Rejected: 'Bị từ chối',
};

const STATUS_BADGE: Record<BlogStatus, string> = {
  Draft: 'bg-slate-100 text-slate-600 border-slate-200',
  PendingApproval: 'bg-amber-50 text-amber-700 border-amber-200',
  Published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

const createEmptyPayload = (): BlogUpsertPayload => ({
  title: '',
  content: '',
  thumbnailUrl: '',
  status: 'Draft',
  category: 'SnakeKnowledge',
  tags: [],
  readingTime: 5,
});

const mapDetailToPayload = (detail: BlogDetail): BlogUpsertPayload => ({
  title: detail.title,
  content: detail.content,
  thumbnailUrl: detail.thumbnailUrl ?? '',
  status: detail.status,
  category: detail.category,
  tags: detail.tags,
  readingTime: detail.readingTime,
});

const getErrorMessage = (err: unknown, fallback: string) => {
  if (!(err instanceof ApiClientError)) {
    return fallback;
  }
  const entries = Object.entries(err.error?.validationErrors ?? {});
  if (!entries.length) {
    return err.message || fallback;
  }
  return entries.map(([f, msgs]) => `${f}: ${msgs.join(', ')}`).join(' | ');
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BlogsPage() {
  const { showToast } = useToast();

  // List state
  const [items, setItems] = useState<BlogSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<BlogStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<BlogDetail | null>(null);

  // Loading / error
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSession, setModalSession] = useState(0);
  const [formMode, setFormMode] = useState<'create' | 'update'>('create');
  const [formInitialValue, setFormInitialValue] = useState<BlogUpsertPayload>(createEmptyPayload);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Action states
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // ─── Data loading ────────────────────────────────────────────────────────

  const loadList = async (preferredId?: string | null) => {
    setIsListLoading(true);
    setListError(null);
    try {
      const data = await blogApi.getAll();
      setItems(data);
      setSelectedId((prev) => {
        const target = preferredId ?? prev;
        if (target && data.some(b => b.id === target)) {
          return target;
        }
        return data[0]?.id ?? null;
      });
    } catch (err) {
      setListError('Không thể tải danh sách bài viết.');
      showToast('Không thể tải danh sách bài viết.', { type: 'error' });
      console.error(err);
    } finally {
      setIsListLoading(false);
    }
  };

  const loadDetail = async (id: string) => {
    setIsDetailLoading(true);
    setDetailError(null);
    setSelectedDetail(null);
    setShowRejectForm(false);
    setActionError(null);
    try {
      const data = await blogApi.getById(id);
      setSelectedDetail(data);
    } catch (err) {
      setDetailError('Không thể tải chi tiết bài viết.');
      showToast('Không thể tải chi tiết bài viết.', { type: 'error' });
      console.error(err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
    } else {
      setSelectedDetail(null);
    }
  }, [selectedId]);

  // ─── Filtered list ───────────────────────────────────────────────────────

  // Hide Draft posts from non-Admin authors (Experts' drafts are not relevant to admin)
  const adminVisibleItems = useMemo(() =>
    items.filter(b => b.status !== 'Draft' || b.account?.role === 'Admin'), [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const byStatus = statusFilter === 'All' ? adminVisibleItems : adminVisibleItems.filter(b => b.status === statusFilter);
    if (!q) {
      return byStatus;
    }
    return byStatus.filter(b =>
      b.title.toLowerCase().includes(q)
      || (b.account?.fullName ?? '').toLowerCase().includes(q),
    );
  }, [adminVisibleItems, statusFilter, searchQuery]);

  const countByStatus = useMemo(() => {
    const map: Record<string, number> = { All: adminVisibleItems.length };
    for (const item of adminVisibleItems) {
      map[item.status] = (map[item.status] ?? 0) + 1;
    }
    return map;
  }, [adminVisibleItems]);

  const handleFilterChange = (filter: BlogStatus | 'All') => {
    setStatusFilter(filter);
    const q = searchQuery.trim().toLowerCase();
    const first = adminVisibleItems.find((b) => {
      if (filter !== 'All' && b.status !== filter) {
        return false;
      }
      if (q && !b.title.toLowerCase().includes(q) && !(b.account?.fullName ?? '').toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
    setSelectedId(first?.id ?? null);
  };

  // ─── CRUD actions ────────────────────────────────────────────────────────

  const openCreateModal = () => {
    setFormMode('create');
    setFormInitialValue(createEmptyPayload());
    setModalSession(s => s + 1);
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    if (!selectedDetail) {
      return;
    }
    setFormMode('update');
    setFormInitialValue(mapDetailToPayload(selectedDetail));
    setModalSession(s => s + 1);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (payload: BlogUpsertPayload) => {
    setIsSubmittingForm(true);
    try {
      if (formMode === 'create') {
        const created = await blogApi.create(payload);
        setIsModalOpen(false);
        const label = payload.status === 'Published' ? 'Đã đăng bài viết thành công!' : 'Đã lưu bản nháp thành công!';
        showToast(label, { type: 'success' });
        await loadList(created.id);
      } else if (selectedId) {
        const updated = await blogApi.update(selectedId, payload);
        setIsModalOpen(false);
        // Immediately reflect changes in preview + list without waiting for a reload
        setSelectedDetail(updated);
        setItems(prev => prev.map(b =>
          b.id === updated.id
            ? { ...b, title: updated.title, thumbnailUrl: updated.thumbnailUrl, category: updated.category, tags: updated.tags, readingTime: updated.readingTime, status: updated.status, updatedAt: updated.updatedAt }
            : b,
        ));
        showToast('Đã cập nhật bài viết thành công!', { type: 'success' });
        // Background sync to keep list fully consistent with server
        loadList(updated.id);
      }
    } catch (err) {
      showToast(getErrorMessage(err, 'Không thể lưu bài viết.'), { type: 'error' });
      throw err;
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDetail) {
      return;
    }
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Xóa bài "${selectedDetail.title}"? Hành động này không thể hoàn tác.`)) {
      return;
    }
    setIsDeleting(true);
    setActionError(null);
    try {
      await blogApi.remove(selectedDetail.id);
      showToast('Đã xóa bài viết thành công.', { type: 'success' });
      await loadList(null);
    } catch (err) {
      const msg = getErrorMessage(err, 'Không thể xóa bài viết.');
      setActionError(msg);
      showToast(msg, { type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedDetail) {
      return;
    }
    setIsApproving(true);
    setActionError(null);
    try {
      const updated = await blogApi.updateStatus(selectedDetail.id, { status: 'Published' });
      setSelectedDetail(updated);
      setItems(prev => prev.map(b => b.id === updated.id ? { ...b, status: updated.status } : b));
      showToast('Đã duyệt và đăng bài viết thành công!', { type: 'success' });
    } catch (err) {
      const msg = getErrorMessage(err, 'Không thể duyệt bài viết.');
      setActionError(msg);
      showToast(msg, { type: 'error' });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDetail || !rejectReason.trim()) {
      return;
    }
    setIsRejecting(true);
    setActionError(null);
    try {
      const updated = await blogApi.updateStatus(selectedDetail.id, {
        status: 'Rejected',
        rejectionReason: rejectReason.trim(),
      });
      setSelectedDetail(updated);
      setItems(prev => prev.map(b => b.id === updated.id ? { ...b, status: updated.status } : b));
      setShowRejectForm(false);
      setRejectReason('');
      showToast('Đã từ chối bài viết.', { type: 'warning' });
    } catch (err) {
      const msg = getErrorMessage(err, 'Không thể từ chối bài viết.');
      setActionError(msg);
      showToast(msg, { type: 'error' });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleTakeDown = async () => {
    if (!selectedDetail) {
      return;
    }
    // eslint-disable-next-line no-alert
    if (!window.confirm('Gỡ bài viết xuống? Bài sẽ chuyển về trạng thái Bản nháp.')) {
      return;
    }
    setActionError(null);
    try {
      const updated = await blogApi.updateStatus(selectedDetail.id, { status: 'Draft' });
      setSelectedDetail(updated);
      setItems(prev => prev.map(b => b.id === updated.id ? { ...b, status: updated.status } : b));
      showToast('Đã gỡ bài viết xuống. Bài chuyển về Bản nháp.', { type: 'info' });
    } catch (err) {
      const msg = getErrorMessage(err, 'Không thể gỡ bài viết.');
      setActionError(msg);
      showToast(msg, { type: 'error' });
    }
  };

  const handlePublishDirect = async () => {
    if (!selectedDetail) {
      return;
    }
    setActionError(null);
    try {
      const updated = await blogApi.updateStatus(selectedDetail.id, { status: 'Published' });
      setSelectedDetail(updated);
      setItems(prev => prev.map(b => b.id === updated.id ? { ...b, status: updated.status } : b));
      showToast('Đã đăng bài viết thành công!', { type: 'success' });
    } catch (err) {
      const msg = getErrorMessage(err, 'Không thể đăng bài viết.');
      setActionError(msg);
      showToast(msg, { type: 'error' });
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <main className="h-[calc(100vh-81px)] overflow-hidden bg-slate-50">
      <div className="flex h-full">
        {/* ── Left panel: list ─────────────────────────────────────────── */}
        <aside className="flex w-96 shrink-0 flex-col border-r border-slate-200 bg-white">
          {/* Header */}
          <div className="border-b border-slate-200 px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="size-5 text-blue-700" />
                <h2 className="text-base font-bold text-slate-900">Quản lý bài viết</h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => loadList(selectedId)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  title="Làm mới"
                >
                  <RefreshCcw className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800"
                >
                  <Plus className="size-3.5" />
                  Tạo bài
                </button>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="border-b border-slate-200 px-3 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm tiêu đề, tác giả..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-8 text-xs text-slate-800 outline-none focus:border-blue-400 focus:bg-white"
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
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-0.5 overflow-x-auto border-b border-slate-100 bg-slate-50 px-2 py-1.5">
            {STATUS_FILTER_TABS.map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => handleFilterChange(tab)}
                className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === tab
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {STATUS_FILTER_LABEL[tab]}
                {countByStatus[tab] !== undefined && countByStatus[tab]! > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                    statusFilter === tab ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                  >
                    {countByStatus[tab]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isListLoading && (
              <div className="flex items-center justify-center py-12">
                <RefreshCcw className="size-5 animate-spin text-blue-600" />
              </div>
            )}
            {listError && (
              <div className="m-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {listError}
              </div>
            )}
            {!isListLoading && !listError && filteredItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <BookOpen className="mb-3 size-8" />
                <p className="text-sm">Chưa có bài viết nào</p>
              </div>
            )}
            {filteredItems.map(blog => (
              <button
                key={blog.id}
                type="button"
                onClick={() => setSelectedId(blog.id)}
                className={`w-full border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-blue-50 ${
                  selectedId === blog.id ? 'border-l-4 border-l-blue-700 bg-blue-50' : ''
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[blog.status]}`}>
                    {BLOG_STATUS_LABEL[blog.status]}
                  </span>
                  <span className="text-[10px] text-slate-400">{formatDate(blog.createdAt)}</span>
                </div>
                <p className="line-clamp-2 text-sm font-semibold text-slate-800">{blog.title}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                  <span>{BLOG_CATEGORY_LABEL[blog.category]}</span>
                  {blog.account && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <User className="size-3" />
                        {blog.account.fullName}
                      </span>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* ── Right panel: detail ──────────────────────────────────────── */}
        <section className="flex min-w-0 flex-1 flex-col">
          {!selectedId && !isListLoading && (
            <div className="flex h-full flex-col items-center justify-center text-slate-400">
              <BookOpen className="mb-3 size-12" strokeWidth={1} />
              <p>Chọn bài viết để xem chi tiết</p>
            </div>
          )}

          {isDetailLoading && (
            <div className="flex h-full items-center justify-center">
              <RefreshCcw className="size-6 animate-spin text-blue-600" />
            </div>
          )}

          {detailError && !isDetailLoading && (
            <div className="m-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {detailError}
            </div>
          )}

          {selectedDetail && !isDetailLoading && (
            <div className="flex h-full flex-col">
              {/* Detail header / actions */}
              <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[selectedDetail.status]}`}>
                        {BLOG_STATUS_LABEL[selectedDetail.status]}
                      </span>
                      <span className="text-xs text-slate-400">{BLOG_CATEGORY_LABEL[selectedDetail.category]}</span>
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 line-clamp-2">{selectedDetail.title}</h1>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {selectedDetail.account && (
                        <span className="flex items-center gap-1">
                          <User className="size-3.5" />
                          {selectedDetail.account.fullName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {selectedDetail.readingTime}
                        {' '}
                        phút đọc
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="size-3.5" />
                        {selectedDetail.viewCount}
                        {' '}
                        lượt xem
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="size-3.5" />
                        {selectedDetail.likeCount}
                        {' '}
                        thích
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={openEditModal}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil className="size-3.5" />
                      Sửa
                    </button>

                    {selectedDetail.status === 'Draft' && (
                      <button
                        type="button"
                        onClick={handlePublishDirect}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <CheckCircle className="size-3.5" />
                        Đăng ngay
                      </button>
                    )}

                    {selectedDetail.status === 'PendingApproval' && (
                      <>
                        <button
                          type="button"
                          disabled={isApproving}
                          onClick={handleApprove}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle className="size-3.5" />
                          {isApproving ? 'Đang duyệt...' : 'Duyệt'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRejectForm(v => !v)}
                          className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                        >
                          <XCircle className="size-3.5" />
                          Từ chối
                        </button>
                      </>
                    )}

                    {selectedDetail.status === 'Rejected' && (
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={isApproving}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle className="size-3.5" />
                        {isApproving ? 'Đang duyệt...' : 'Duyệt luôn'}
                      </button>
                    )}

                    {selectedDetail.status === 'Published' && (
                      <button
                        type="button"
                        onClick={handleTakeDown}
                        className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                      >
                        Gỡ xuống
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDelete}
                      className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" />
                      {isDeleting ? '...' : 'Xóa'}
                    </button>
                  </div>
                </div>

                {/* Tags */}
                {selectedDetail.tags.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {selectedDetail.tags.map(tag => (
                      <span key={tag} className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                        {BLOG_TAG_LABEL[tag as BlogTag]}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action error */}
                {actionError && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    <X className="size-4 shrink-0" />
                    {actionError}
                    <button type="button" onClick={() => setActionError(null)} className="ml-auto text-rose-500 hover:text-rose-700">
                      <X className="size-4" />
                    </button>
                  </div>
                )}

                {/* Reject form */}
                {showRejectForm && (
                  <div className="mt-3 space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-sm font-semibold text-rose-700">Lý do từ chối</p>
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Mô tả lý do từ chối để tác giả biết và chỉnh sửa..."
                      rows={3}
                      className="w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isRejecting || !rejectReason.trim()}
                        onClick={handleReject}
                        className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isRejecting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectReason('');
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}

                {/* Rejection reason display */}
                {selectedDetail.status === 'Rejected' && selectedDetail.rejectionReason && (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    <span className="font-semibold">Lý do bị từ chối: </span>
                    {selectedDetail.rejectionReason}
                  </div>
                )}
              </div>

              {/* Content area */}
              <div className="flex min-h-0 flex-1 gap-0">
                {/* Thumbnail + stats sidebar */}
                {(selectedDetail.thumbnailUrl || selectedDetail.status) && (
                  <div className="w-52 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50 p-4">
                    {selectedDetail.thumbnailUrl && (
                      <div className="mb-4">
                        <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ảnh bìa</p>
                        <img
                          src={selectedDetail.thumbnailUrl}
                          alt={selectedDetail.title}
                          className="w-full rounded-lg object-cover"
                          onError={e => e.currentTarget.classList.add('hidden')}
                        />
                      </div>
                    )}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Thông tin</p>
                      <dl className="space-y-2 text-xs">
                        <div>
                          <dt className="text-slate-400">Danh mục</dt>
                          <dd className="font-medium text-slate-700">{BLOG_CATEGORY_LABEL[selectedDetail.category]}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Tạo lúc</dt>
                          <dd className="font-medium text-slate-700">{formatDateTime(selectedDetail.createdAt)}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Cập nhật</dt>
                          <dd className="font-medium text-slate-700">{formatDateTime(selectedDetail.updatedAt)}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Lượt xem</dt>
                          <dd className="font-medium text-slate-700">{selectedDetail.viewCount}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Lượt thích</dt>
                          <dd className="font-medium text-slate-700">{selectedDetail.likeCount}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                )}

                {/* Content preview */}
                <div className="min-w-0 flex-1 overflow-y-auto p-6">
                  <BlogContentPreview content={selectedDetail.content} />
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Modal */}
      <BlogUpsertModal
        key={modalSession}
        isOpen={isModalOpen}
        mode={formMode}
        initialValue={formInitialValue}
        isSubmitting={isSubmittingForm}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </main>
  );
}
