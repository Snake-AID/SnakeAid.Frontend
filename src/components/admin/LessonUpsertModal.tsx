'use client';

import type { LessonCategory, LessonUpsertPayload } from '@/types/lesson.type';
import { Eye, Pencil, X } from 'lucide-react';
import { useRef, useState } from 'react';
import LessonContentPreview from './LessonContentPreview';

interface LessonUpsertModalProps {
  isOpen: boolean;
  mode: 'create' | 'update';
  initialValue: LessonUpsertPayload;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: LessonUpsertPayload) => Promise<void>;
}

const CATEGORY_OPTIONS: Array<{ value: LessonCategory; label: string }> = [
  { value: 'Safety', label: 'An toàn' },
  { value: 'Catching', label: 'Bắt rắn' },
  { value: 'FirstAid', label: 'Sơ cứu' },
];

const TOOLBAR_BUTTONS = [
  { label: '🛡️', title: 'Section mới với 🛡️', insert: '\n🛡️ TIÊU ĐỀ:\n' },
  { label: '🔍', title: 'Section mới với 🔍', insert: '\n🔍 TIÊU ĐỀ:\n' },
  { label: '⚠️', title: 'Section mới với ⚠️', insert: '\n⚠️ TIÊU ĐỀ:\n' },
  { label: '✅', title: 'Section mới với ✅', insert: '\n✅ TIÊU ĐỀ:\n' },
  { label: '🏥', title: 'Section mới với 🏥', insert: '\n🏥 TIÊU ĐỀ:\n' },
  { label: '-', title: 'Bullet point', insert: '\n- ' },
  { label: '📹', title: 'Chèn URL YouTube', insert: '\nhttps://youtu.be/VIDEO_ID\n' },
] as const;

export default function LessonUpsertModal({
  isOpen,
  mode,
  initialValue,
  isSubmitting,
  onClose,
  onSubmit,
}: LessonUpsertModalProps) {
  const [draft, setDraft] = useState<LessonUpsertPayload>(initialValue);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) {
    return null;
  }

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) {
      setDraft(prev => ({ ...prev, content: prev.content + text }));
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newContent = draft.content.slice(0, start) + text + draft.content.slice(end);
    setDraft(prev => ({ ...prev, content: newContent }));
    requestAnimationFrame(() => {
      el.focus();
      const newPos = start + text.length;
      el.setSelectionRange(newPos, newPos);
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    try {
      await onSubmit({
        title: draft.title.trim(),
        content: draft.content.trim(),
        category: draft.category,
        isPublished: draft.isPublished,
      });
    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message || 'Không thể lưu dữ liệu bài học. Vui lòng thử lại.');
      } else {
        setSubmitError('Không thể lưu dữ liệu bài học. Vui lòng thử lại.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {mode === 'create' ? 'Thêm bài học mới' : 'Cập nhật bài học'}
            </h3>
            <p className="text-sm text-slate-500">Nhập nội dung bài học trước khi xuất bản cho người dùng.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-6">
          {submitError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {submitError}
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-700">Tiêu đề bài học</p>
            <input
              required
              value={draft.title}
              onChange={e => setDraft(prev => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-700">Danh mục</p>
              <select
                value={draft.category}
                onChange={e => setDraft(prev => ({ ...prev, category: e.target.value as LessonCategory }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              >
                {CATEGORY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-slate-700">Trạng thái xuất bản</p>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={draft.isPublished}
                  onChange={e => setDraft(prev => ({ ...prev, isPublished: e.target.checked }))}
                />
                Hiển thị cho người dùng
              </label>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-700">Nội dung bài học</p>
              <div className="flex overflow-hidden rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditorTab('edit')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition ${
                    editorTab === 'edit'
                      ? 'bg-teal-700 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Pencil className="size-3" />
                  Soạn thảo
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab('preview')}
                  className={`inline-flex items-center gap-1.5 border-l border-slate-200 px-3 py-1.5 text-xs font-semibold transition ${
                    editorTab === 'preview'
                      ? 'bg-teal-700 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Eye className="size-3" />
                  Xem trước
                </button>
              </div>
            </div>

            {editorTab === 'edit' && (
              <div className="overflow-hidden rounded-lg border border-slate-300 focus-within:border-teal-600">
                <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
                  {TOOLBAR_BUTTONS.map(btn => (
                    <button
                      key={btn.label}
                      type="button"
                      title={btn.title}
                      onClick={() => insertAtCursor(btn.insert)}
                      className="rounded px-2 py-1 text-sm hover:bg-slate-200"
                    >
                      {btn.label}
                    </button>
                  ))}
                  <span className="ml-auto hidden text-xs text-slate-400 sm:block">
                    Dòng bắt đầu bằng emoji = tiêu đề section
                  </span>
                </div>
                <textarea
                  ref={textareaRef}
                  required
                  rows={16}
                  value={draft.content}
                  onChange={e => setDraft(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 font-mono text-sm leading-relaxed text-slate-800 outline-none"
                  placeholder={`🛡️ TIÊU ĐỀ SECTION:\n- Điểm quan trọng thứ nhất\n- Điểm quan trọng thứ hai\n\n⚠️ LƯU Ý:\n- Cảnh báo quan trọng\n\nhttps://youtu.be/VIDEO_ID`}
                />
              </div>
            )}

            {editorTab === 'preview' && (
              <div className="min-h-100 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <LessonContentPreview content={draft.content} category={draft.category} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              disabled={isSubmitting}
              type="submit"
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo mới' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
