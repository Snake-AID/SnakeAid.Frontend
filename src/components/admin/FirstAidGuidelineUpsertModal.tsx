'use client';

import type {
  FirstAidGuidelineDraftContent,
  FirstAidGuidelineDraftLineItem,
  FirstAidGuidelineType,
  FirstAidGuidelineUpsertPayload,
} from '@/types/first-aid-guideline.type';
import type { LibraryMediaItem } from '@/types/library-media.type';
import { ImageIcon, Plus, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { libraryMediaApi } from '@/apis/library-media.api';
import LibraryMediaPickerModal from '@/components/admin/LibraryMediaPickerModal';

interface FirstAidGuidelineUpsertModalProps {
  isOpen: boolean;
  mode: 'create' | 'update';
  initialValue: FirstAidGuidelineUpsertPayload;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: FirstAidGuidelineUpsertPayload) => Promise<void>;
}

type SectionKey = 'steps' | 'dos' | 'donts';

interface SectionTarget {
  section: SectionKey;
  index: number;
}

const sectionMeta: Record<SectionKey, { title: string; description: string; emptyLabel: string }> = {
  steps: {
    title: 'Các bước xử lý',
    description: 'Các bước sơ cứu theo đúng thứ tự thực hiện.',
    emptyLabel: 'Chưa có bước nào. Hãy thêm bước đầu tiên.',
  },
  dos: {
    title: 'Nên làm',
    description: 'Những điều nên làm trong tình huống này.',
    emptyLabel: 'Chưa có mục nên làm.',
  },
  donts: {
    title: 'Không nên làm',
    description: 'Những điều cần tránh để không làm tình trạng xấu hơn.',
    emptyLabel: 'Chưa có mục không nên làm.',
  },
};

const createLineItem = (): FirstAidGuidelineDraftLineItem => ({
  text: '',
  mediaUrl: null,
  mediaId: null,
});

const createEmptyContent = (): FirstAidGuidelineDraftContent => ({
  steps: [createLineItem()],
  dos: [],
  donts: [],
  notes: [],
});

export const createEmptyFirstAidGuidelinePayload = (): FirstAidGuidelineUpsertPayload => ({
  name: '',
  content: createEmptyContent(),
  type: 'General' as FirstAidGuidelineType,
  summary: '',
});

const mapMediaToLineItem = (media: LibraryMediaItem): Partial<FirstAidGuidelineDraftLineItem> => ({
  mediaId: media.id,
  mediaUrl: media.mediaUrl,
});

export default function FirstAidGuidelineUpsertModal({
  isOpen,
  mode,
  initialValue,
  isSubmitting,
  onClose,
  onSubmit,
}: FirstAidGuidelineUpsertModalProps) {
  const [draft, setDraft] = useState<FirstAidGuidelineUpsertPayload>(initialValue);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pickerTarget, setPickerTarget] = useState<SectionTarget | null>(null);
  const [uploadTarget, setUploadTarget] = useState<SectionTarget | null>(null);
  const [uploadingTargetKey, setUploadingTargetKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraft(initialValue);
    setSubmitError(null);
    setPickerTarget(null);
    setUploadTarget(null);
    setUploadingTargetKey(null);
    setUploadError(null);

    return () => {
      Object.values(objectUrlRef.current).forEach(url => URL.revokeObjectURL(url));
      objectUrlRef.current = {};
    };
  }, [initialValue, isOpen]);

  if (!isOpen) {
    return null;
  }

  const updateSectionItem = (
    section: SectionKey,
    index: number,
    patch: Partial<FirstAidGuidelineDraftLineItem>,
  ) => {
    setDraft(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [section]: prev.content[section].map((item, itemIndex) => (
          itemIndex === index ? { ...item, ...patch } : item
        )),
      },
    }));
  };

  const addSectionItem = (section: SectionKey) => {
    setDraft(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [section]: [...prev.content[section], createLineItem()],
      },
    }));
  };

  const removeSectionItem = (section: SectionKey, index: number) => {
    setDraft(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [section]: prev.content[section].filter((_, itemIndex) => itemIndex !== index),
      },
    }));
  };

  const clearMedia = (section: SectionKey, index: number) => {
    updateSectionItem(section, index, {
      mediaId: null,
      mediaUrl: null,
    });
  };

  const handlePickMedia = (media: LibraryMediaItem) => {
    if (!pickerTarget) {
      return;
    }

    updateSectionItem(pickerTarget.section, pickerTarget.index, mapMediaToLineItem(media));
    setPickerTarget(null);
  };

  const handleUploadClick = (section: SectionKey, index: number) => {
    setUploadTarget({ section, index });
    fileInputRef.current?.click();
  };

  const handleUploadChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !uploadTarget) {
      return;
    }

    const targetKey = `${uploadTarget.section}-${uploadTarget.index}`;
    setUploadError(null);
    setUploadingTargetKey(targetKey);

    try {
      const mediaId = await libraryMediaApi.uploadSnakeImage(file);
      let mediaUrl: string | null = null;

      try {
        const detail = await libraryMediaApi.getById(mediaId);
        mediaUrl = detail.mediaUrl ?? null;
      } catch {
        const fallbackUrl = URL.createObjectURL(file);
        objectUrlRef.current[targetKey] = fallbackUrl;
        mediaUrl = fallbackUrl;
      }

      updateSectionItem(uploadTarget.section, uploadTarget.index, {
        mediaId,
        mediaUrl,
      });
    } catch (error) {
      console.error('Failed to upload first aid media', error);
      setUploadError('Không thể upload ảnh. Vui lòng thử lại.');
    } finally {
      setUploadingTargetKey(null);
      setUploadTarget(null);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    try {
      await onSubmit(draft);
    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message || 'Không thể lưu dữ liệu. Vui lòng kiểm tra lại.');
      } else {
        setSubmitError('Không thể lưu dữ liệu. Vui lòng kiểm tra lại.');
      }
    }
  };

  const renderSectionEditor = (section: SectionKey) => {
    const items = draft.content[section];
    const meta = sectionMeta[section];

    return (
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">{meta.title}</h4>
            <p className="mt-1 text-xs text-slate-500">{meta.description}</p>
          </div>
          <button
            type="button"
            onClick={() => addSectionItem(section)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Plus className="size-3.5" />
            Thêm dòng
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {items.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-500">
              {meta.emptyLabel}
            </div>
          )}

          {items.map((item, index) => {
            const itemKey = `${section}-${index}`;
            const isUploading = uploadingTargetKey === itemKey;

            return (
              <div key={itemKey} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {meta.title}
                    {' '}
                    #
                    {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeSectionItem(section, index)}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    Xóa dòng
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={item.text}
                  onChange={e => updateSectionItem(section, index, { text: e.target.value })}
                  placeholder="Nhập nội dung sơ cứu"
                  className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                />

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUploadClick(section, index)}
                    disabled={isUploading}
                    className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Upload className="size-3.5" />
                    {isUploading ? 'Đang upload...' : 'Upload ảnh'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerTarget({ section, index })}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <ImageIcon className="size-3.5" />
                    Chọn từ thư viện
                  </button>
                  {item.mediaUrl && (
                    <button
                      type="button"
                      onClick={() => clearMedia(section, index)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>

                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {item.mediaUrl
                    ? (
                        <div className="grid grid-cols-1 gap-0 md:grid-cols-[12rem_minmax(0,1fr)]">
                          <a
                            href={item.mediaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex min-h-44 items-center justify-center border-b border-slate-200 bg-white md:border-b-0 md:border-r"
                            title="Mở ảnh minh họa"
                          >
                            <img
                              src={item.mediaUrl}
                              alt={item.text || 'Ảnh minh họa sơ cứu'}
                              className="h-full max-h-44 w-full object-cover"
                              loading="lazy"
                            />
                          </a>
                          <div className="p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ảnh đã gắn</p>
                            <p className="mt-1 text-sm text-slate-700">
                              {item.text ? 'Ảnh minh họa cho mục này.' : 'Ảnh sẽ được gắn để minh họa cho mục này.'}
                            </p>
                          </div>
                        </div>
                      )
                    : (
                        <div className="flex h-36 items-center justify-center gap-2 text-sm text-slate-500">
                          <ImageIcon className="size-5 text-slate-300" />
                          Chưa có ảnh minh họa
                        </div>
                      )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
        <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {mode === 'create' ? 'Thêm bộ sơ cứu mới' : 'Cập nhật bộ sơ cứu'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Quản lý bộ sơ cứu theo cấu trúc bước, điều nên làm, điều không nên làm và ghi chú.
              </p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100">
              <X className="size-5" />
            </button>
          </div>

          <div className="min-h-0 overflow-y-auto p-6">
            {submitError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {submitError}
              </div>
            )}

            {uploadError && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {uploadError}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-700">Tên bộ sơ cứu</p>
                  <input
                    required
                    value={draft.name}
                    onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                    placeholder="Ví dụ: Sơ cứu rắn độc thần kinh"
                  />
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-700">Loại bộ sơ cứu</p>
                  <select
                    value={draft.type}
                    onChange={e => setDraft(prev => ({ ...prev, type: e.target.value as FirstAidGuidelineType }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                  >
                    <option value="General">Bộ sơ cứu chung</option>
                    <option value="VenomSpecific">Bộ sơ cứu riêng từng loài</option>
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <p className="mb-2 text-xs font-semibold text-slate-700">Mô tả bộ sơ cứu</p>
                  <textarea
                    rows={3}
                    value={draft.summary ?? ''}
                    onChange={e => setDraft(prev => ({ ...prev, summary: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                    placeholder="Mô tả ngắn cho bộ sơ cứu"
                  />
                </div>
              </section>

              {(draft.type ?? '').toString().toLowerCase().replace(/_/g, '') === 'venomspecific' && (
                <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-800">
                  Bộ sơ cứu riêng từng loài này sẽ được liên kết ngược với các nhóm độc thông qua trường
                  {' '}
                  <span className="font-semibold">firstAidGuidelineId</span>
                  {' '}
                  ở màn quản lý loại độc.
                </section>
              )}

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="xl:col-span-3">
                  {renderSectionEditor('steps')}
                </div>
                <div>
                  {renderSectionEditor('dos')}
                </div>
                <div>
                  {renderSectionEditor('donts')}
                </div>
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm xl:col-span-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Ghi chú</h4>
                      <p className="mt-1 text-xs text-slate-500">Ghi chú được lưu dưới dạng danh sách ngắn.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDraft(prev => ({
                          ...prev,
                          content: {
                            ...prev.content,
                            notes: [...prev.content.notes, ''],
                          },
                        }));
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <Plus className="size-3.5" />
                      Thêm ghi chú
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {draft.content.notes.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-500">
                        Chưa có ghi chú nào.
                      </div>
                    )}

                    {draft.content.notes.map((note, index) => (
                      <div key={`note-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Ghi chú #
                            {index + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setDraft(prev => ({
                                ...prev,
                                content: {
                                  ...prev.content,
                                  notes: prev.content.notes.filter((_, noteIndex) => noteIndex !== index),
                                },
                              }));
                            }}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            Xóa ghi chú
                          </button>
                        </div>
                        <input
                          value={note}
                          onChange={(e) => {
                            const next = e.target.value;
                            setDraft(prev => ({
                              ...prev,
                              content: {
                                ...prev.content,
                                notes: prev.content.notes.map((item, noteIndex) => (
                                  noteIndex === index ? next : item
                                )),
                              },
                            }));
                          }}
                          placeholder="Nhập ghi chú"
                          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                        />
                      </div>
                    ))}
                  </div>
                </section>
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
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUploadChange}
      />

      <LibraryMediaPickerModal
        isOpen={pickerTarget != null}
        title="Chọn ảnh minh họa cho bộ sơ cứu"
        mediaType="Image"
        onClose={() => setPickerTarget(null)}
        onSelect={handlePickMedia}
      />
    </>
  );
}
