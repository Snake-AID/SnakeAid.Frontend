'use client';

import type {
  BlogCategory,
  BlogStatus,
  BlogTag,
  BlogUpsertPayload,
} from '@/types/blog.type';
import {
  AlignLeft,
  Bold,
  Eye,
  Hash,
  Image,
  Italic,
  List,
  ListOrdered,
  Minus,
  Pencil,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import {
  BLOG_CATEGORY_LABEL,
  BLOG_TAG_LABEL,
} from '@/types/blog.type';
import BlogContentPreview from './BlogContentPreview';

const ALL_CATEGORIES: BlogCategory[] = [
  'SnakeKnowledge',
  'SnakeSpecies',
  'SnakeHealth',
  'SnakeFeeding',
  'SnakeHabitat',
  'Other',
];

const ALL_TAGS: BlogTag[] = [
  'Venomous',
  'NonVenomous',
  'Safety',
  'WildSnake',
  'SnakeCare',
  'SnakeBehavior',
  'SnakeIdentification',
  'SnakeConservation',
  'SnakeMyths',
  'Other',
];

interface BlogUpsertModalProps {
  isOpen: boolean;
  mode: 'create' | 'update';
  initialValue: BlogUpsertPayload;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: BlogUpsertPayload) => Promise<void>;
}

export default function BlogUpsertModal({
  isOpen,
  mode,
  initialValue,
  isSubmitting,
  onClose,
  onSubmit,
}: BlogUpsertModalProps) {
  const [draft, setDraft] = useState<BlogUpsertPayload>(initialValue);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) {
    return null;
  }

  // ─── Toolbar helpers ────────────────────────────────────────────────────────
  const wrapSelection = (before: string, after: string) => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = draft.content.slice(start, end);
    const next = draft.content.slice(0, start) + before + selected + after + draft.content.slice(end);
    setDraft(p => ({ ...p, content: next }));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    const pos = el.selectionStart;
    const next = draft.content.slice(0, pos) + text + draft.content.slice(pos);
    setDraft(p => ({ ...p, content: next }));
    setTimeout(() => {
      el.focus();
      const np = pos + text.length;
      el.setSelectionRange(np, np);
    }, 0);
  };

  const toggleTag = (tag: BlogTag) => {
    setDraft(p => ({
      ...p,
      tags: p.tags.includes(tag) ? p.tags.filter(t => t !== tag) : [...p.tags, tag],
    }));
  };

  const handleSubmit = async (targetStatus: BlogStatus) => {
    setSubmitError(null);
    try {
      await onSubmit({
        ...draft,
        title: draft.title.trim(),
        content: draft.content.trim(),
        thumbnailUrl: draft.thumbnailUrl.trim(),
        status: targetStatus,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể lưu bài viết.');
    }
  };

  const toolbarButtons = [
    { icon: <Bold className="size-3.5" />, title: 'In đậm (Ctrl+B)', action: () => wrapSelection('**', '**') },
    { icon: <Italic className="size-3.5" />, title: 'In nghiêng (Ctrl+I)', action: () => wrapSelection('*', '*') },
    { icon: <Hash className="size-3.5" />, title: 'Tiêu đề H2', action: () => insertAtCursor('\n## ') },
    { icon: <span className="text-[10px] font-bold leading-none">H3</span>, title: 'Tiêu đề H3', action: () => insertAtCursor('\n### ') },
    { icon: <Minus className="size-3.5" />, title: 'Đường kẻ ngang', action: () => insertAtCursor('\n\n---\n\n') },
    { icon: <List className="size-3.5" />, title: 'Danh sách gạch đầu dòng', action: () => insertAtCursor('\n- ') },
    { icon: <ListOrdered className="size-3.5" />, title: 'Danh sách có số', action: () => insertAtCursor('\n1. ') },
    { icon: <Image className="size-3.5" />, title: 'Chèn ảnh', action: () => insertAtCursor('\n![Mô tả ảnh](url_ảnh)\n') },
    { icon: <span className="text-base leading-none">⚠️</span>, title: 'Callout cảnh báo', action: () => insertAtCursor('\n> ⚠️ ') },
    { icon: <span className="text-base leading-none">✅</span>, title: 'Callout thành công', action: () => insertAtCursor('\n> ✅ ') },
    { icon: <span className="text-base leading-none">💡</span>, title: 'Callout lưu ý', action: () => insertAtCursor('\n> 💡 ') },
    { icon: <span className="text-base leading-none">🚫</span>, title: 'Callout nguy hiểm', action: () => insertAtCursor('\n> 🚫 ') },
    { icon: <AlignLeft className="size-3.5" />, title: 'Blockquote', action: () => insertAtCursor('\n> ') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 pt-6">
      <div className="flex h-[calc(100vh-3rem)] w-full max-w-5xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {mode === 'create' ? 'Tạo bài viết mới' : 'Chỉnh sửa bài viết'}
            </h3>
            <p className="text-sm text-slate-500">Nội dung được soạn bằng cú pháp Markdown</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {submitError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {submitError}
            </div>
          )}

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Tiêu đề bài viết
                {' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                required
                placeholder="Nhập tiêu đề hấp dẫn, tối đa 200 ký tự..."
                maxLength={200}
                value={draft.title}
                onChange={e => setDraft(p => ({ ...p, title: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>

            {/* Category + ReadingTime */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="blog-category" className="mb-1.5 block text-xs font-semibold text-slate-700">Danh mục</label>
                <select
                  id="blog-category"
                  value={draft.category}
                  onChange={e => setDraft(p => ({ ...p, category: e.target.value as BlogCategory }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  {ALL_CATEGORIES.map(c => (
                    <option key={c} value={c}>{BLOG_CATEGORY_LABEL[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="blog-reading-time" className="mb-1.5 block text-xs font-semibold text-slate-700">Thời gian đọc (phút)</label>
                <input
                  id="blog-reading-time"
                  type="number"
                  min={1}
                  max={60}
                  value={draft.readingTime}
                  onChange={e => setDraft(p => ({ ...p, readingTime: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Thumbnail URL */}
            <div>
              <label htmlFor="blog-thumbnail" className="mb-1.5 block text-xs font-semibold text-slate-700">URL ảnh bìa</label>
              <input
                id="blog-thumbnail"
                placeholder="https://cdn.snakeaid.vn/images/..."
                value={draft.thumbnailUrl}
                onChange={(e) => {
                  setThumbnailError(false);
                  setDraft(p => ({ ...p, thumbnailUrl: e.target.value }));
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
              {draft.thumbnailUrl && (
                <div className="relative mt-2 w-full overflow-hidden rounded-lg" style={{ aspectRatio: '16/9' }}>
                  {thumbnailError
                    ? (
                        <div className="flex h-full w-full items-center justify-center gap-2 border border-dashed border-rose-300 bg-rose-50 text-sm text-rose-500">
                          <Image size={16} />
                          <span>Không thể tải ảnh — kiểm tra lại URL</span>
                        </div>
                      )
                    : (
                        <img
                          src={draft.thumbnailUrl}
                          alt="Xem trước ảnh bìa"
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={() => setThumbnailError(true)}
                        />
                      )}
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <p className="mb-1.5 text-xs font-semibold text-slate-700">
                Tags (chọn 1–5)
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      draft.tags.includes(tag)
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-blue-400'
                    }`}
                  >
                    {BLOG_TAG_LABEL[tag]}
                  </button>
                ))}
              </div>
            </div>

            {/* Content editor with tab switcher */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Nội dung (Markdown)
                  {' '}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="flex rounded-lg border border-slate-200 p-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeTab === 'edit' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Pencil className="size-3" />
                    Soạn thảo
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeTab === 'preview' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="size-3" />
                    Xem trước
                  </button>
                </div>
              </div>

              {activeTab === 'edit' && (
                <div className="rounded-xl border border-slate-300 overflow-hidden focus-within:border-blue-500">
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
                    {/* eslint-disable-next-line react-hooks/refs */}
                    {toolbarButtons.map((btn, i) => (
                      <button
                        key={i}
                        type="button"
                        title={btn.title}
                        onClick={btn.action}
                        className="flex h-7 min-w-7 items-center justify-center rounded p-1 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                      >
                        {btn.icon}
                      </button>
                    ))}
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={draft.content}
                    onChange={e => setDraft(p => ({ ...p, content: e.target.value }))}
                    placeholder="Soạn nội dung bài viết bằng Markdown...&#10;&#10;## Tiêu đề chính&#10;&#10;Nội dung đoạn văn bản...&#10;&#10;> ⚠️ Cảnh báo quan trọng&#10;&#10;![Mô tả ảnh](URL ảnh)"
                    className="block w-full resize-none p-4 font-mono text-sm text-slate-800 outline-none"
                    style={{ minHeight: '360px' }}
                  />
                  <div className="border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-right text-xs text-slate-400">
                    {draft.content.length}
                    {' '}
                    ký tự
                  </div>
                </div>
              )}

              {activeTab === 'preview' && (
                <div className="min-h-64 rounded-xl border border-slate-200 bg-white p-6">
                  <BlogContentPreview content={draft.content} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Hủy
          </button>
          <div className="flex gap-2">
            {draft.status !== 'Published' && (
              <button
                type="button"
                disabled={isSubmitting || !draft.title.trim() || !draft.content.trim()}
                onClick={() => handleSubmit('Draft')}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu nháp'}
              </button>
            )}
            <button
              type="button"
              disabled={isSubmitting || !draft.title.trim() || !draft.content.trim()}
              onClick={() => handleSubmit('Published')}
              className="rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Đang đăng...' : 'Đăng ngay'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
