'use client';

import type { LibraryMediaItem } from '@/types/library-media.type';
import type {
  FirstAidLineItem,
  SnakeSpeciesSymptomByTime,
  SnakeSpeciesUpsertPayload,
} from '@/types/snake-species.type';
import { Plus, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { libraryMediaApi } from '@/apis/library-media.api';
import LibraryMediaPickerModal from './LibraryMediaPickerModal';

export type SnakeSpeciesFormMode = 'create' | 'update';

interface SnakeSpeciesUpsertModalProps {
  isOpen: boolean;
  mode: SnakeSpeciesFormMode;
  initialValue: SnakeSpeciesUpsertPayload;
  venomTypeOptions: Array<{ id: number; label: string; value: string }>;
  antivenomOptions: Array<{ id: number; label: string }>;
  isSubmitting: boolean;
  onClose: () => void;
  onUploadMedia: (file: File) => Promise<string>;
  onSubmit: (value: SnakeSpeciesUpsertPayload) => Promise<void>;
}

interface TagListInputProps {
  label: string;
  values: string[];
  placeholder?: string;
  onChange: (next: string[]) => void;
}

interface LineItemEditorProps {
  label: string;
  values: FirstAidLineItem[];
  onChange: (next: FirstAidLineItem[]) => void;
  onUploadMedia: (file: File) => Promise<string>;
}

function TagListInput({ label, values, placeholder, onChange }: TagListInputProps) {
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const value = draft.trim();
    if (!value) {
      return;
    }

    if (values.includes(value)) {
      setDraft('');
      return;
    }

    onChange([...values, value]);
    setDraft('');
  };

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-slate-700">{label}</p>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={addTag}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder ?? 'Nhập rồi nhấn Enter'}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
        />
        <button
          type="button"
          onClick={addTag}
          className="inline-flex items-center rounded-lg border border-slate-200 px-3 text-slate-700 hover:bg-slate-100"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map(item => (
          <span key={item} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
            {item}
            <button
              type="button"
              onClick={() => onChange(values.filter(value => value !== item))}
              className="text-slate-500 hover:text-slate-900"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function LineItemEditor({ label, values, onChange, onUploadMedia }: LineItemEditorProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [lineItemUploadError, setLineItemUploadError] = useState<Record<number, string>>({});
  const [lineItemPreviewUrl, setLineItemPreviewUrl] = useState<Record<number, string>>({});
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const previewUrlRef = useRef<Record<number, string>>({});

  useEffect(() => {
    previewUrlRef.current = lineItemPreviewUrl;
  }, [lineItemPreviewUrl]);

  useEffect(() => () => {
    Object.values(previewUrlRef.current).forEach((preview) => {
      URL.revokeObjectURL(preview);
    });
  }, []);

  const addItem = () => {
    onChange([...values, { text: '', mediaUrl: null, mediaId: null }]);
  };

  const updateItem = (index: number, patch: Partial<FirstAidLineItem>) => {
    onChange(values.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleLineItemFileSelected = async (index: number, file: File | null) => {
    if (!file) {
      return;
    }

    setLineItemUploadError(prev => ({ ...prev, [index]: '' }));
    setUploadingIndex(index);

    const nextPreview = URL.createObjectURL(file);
    setLineItemPreviewUrl((prev) => {
      const previous = prev[index];
      if (previous) {
        URL.revokeObjectURL(previous);
      }

      return {
        ...prev,
        [index]: nextPreview,
      };
    });

    try {
      const mediaId = await onUploadMedia(file);
      let mediaUrl: string | null = null;

      try {
        const mediaDetail = await libraryMediaApi.getById(mediaId);
        mediaUrl = mediaDetail.mediaUrl ?? null;
      } catch {
        mediaUrl = null;
      }

      updateItem(index, { mediaId, mediaUrl });
    } catch (error) {
      const message = error instanceof Error
        ? (error.message || 'Upload ảnh cho bước sơ cứu thất bại.')
        : 'Upload ảnh cho bước sơ cứu thất bại.';

      setLineItemUploadError(prev => ({ ...prev, [index]: message }));
    } finally {
      setUploadingIndex(prev => (prev === index ? null : prev));
    }
  };

  const handleSelectFromLibrary = (index: number, media: LibraryMediaItem) => {
    setLineItemUploadError(prev => ({ ...prev, [index]: '' }));
    setLineItemPreviewUrl((prev) => {
      const previous = prev[index];
      if (previous) {
        URL.revokeObjectURL(previous);
      }

      const next = { ...prev };
      delete next[index];
      return next;
    });
    updateItem(index, { mediaId: media.id, mediaUrl: media.mediaUrl });
    setPickerIndex(null);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-700">{label}</p>
        <button type="button" onClick={addItem} className="text-xs font-semibold text-teal-700 hover:underline">
          + Thêm
        </button>
      </div>
      <div className="space-y-2">
        {values.map((item, index) => (
          <div key={`line-item-${item.mediaId ?? item.mediaUrl ?? index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">
                Mục
                {' '}
                {index + 1}
              </p>
              <button
                type="button"
                onClick={() => onChange(values.filter((_, i) => i !== index))}
                className="text-rose-600 hover:text-rose-700"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <input
              value={item.text}
              onChange={e => updateItem(index, { text: e.target.value })}
              placeholder="Nội dung"
              className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
            <input
              value={item.mediaUrl ?? ''}
              readOnly
              placeholder="URL media"
              className="w-full cursor-not-allowed rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-600 outline-none"
            />

            <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2.5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                  Chọn ảnh bước này
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => void handleLineItemFileSelected(index, e.target.files?.[0] ?? null)}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setPickerIndex(index)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Lấy từ thư viện
                </button>

                {item.mediaId && (
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                    Đã gán ảnh
                  </span>
                )}

                {(item.mediaId || item.mediaUrl || lineItemPreviewUrl[index]) && (
                  <button
                    type="button"
                    onClick={() => {
                      setLineItemUploadError(prev => ({ ...prev, [index]: '' }));
                      setLineItemPreviewUrl((prev) => {
                        const previous = prev[index];
                        if (previous) {
                          URL.revokeObjectURL(previous);
                        }

                        const next = { ...prev };
                        delete next[index];
                        return next;
                      });
                      updateItem(index, { mediaId: null, mediaUrl: null });
                    }}
                    className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    Bỏ ảnh
                  </button>
                )}

                {uploadingIndex === index && (
                  <span className="text-[11px] font-semibold text-blue-600">Đang upload ảnh...</span>
                )}
              </div>

              {(lineItemPreviewUrl[index] || item.mediaUrl) && (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <p className="border-b border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600">
                    {lineItemPreviewUrl[index] ? 'Ảnh mới đã chọn' : 'Ảnh hiện tại của bước'}
                  </p>
                  <div className="h-28 w-full bg-contain bg-left bg-no-repeat" style={{ backgroundImage: `url('${lineItemPreviewUrl[index] ?? item.mediaUrl}')` }} />
                </div>
              )}

              {lineItemUploadError[index] && (
                <p className="mt-2 text-xs text-rose-600">{lineItemUploadError[index]}</p>
              )}
            </div>

            <LibraryMediaPickerModal
              isOpen={pickerIndex === index}
              title="Chọn ảnh cho bước sơ cứu"
              mediaType="Image"
              onClose={() => setPickerIndex(null)}
              onSelect={media => handleSelectFromLibrary(index, media)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SnakeSpeciesUpsertModal({
  isOpen,
  mode,
  initialValue,
  venomTypeOptions,
  antivenomOptions,
  isSubmitting,
  onClose,
  onUploadMedia,
  onSubmit,
}: SnakeSpeciesUpsertModalProps) {
  const [draft, setDraft] = useState<SnakeSpeciesUpsertPayload>(initialValue);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);
  const [isUploadSuccess, setIsUploadSuccess] = useState(false);
  const [isSnakeMediaPickerOpen, setIsSnakeMediaPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedPrimaryVenomTypeOption = venomTypeOptions.find(option => option.id === draft.primaryVenomTypeId);
  const primaryVenomTypeLabel = selectedPrimaryVenomTypeOption?.label ?? (draft.primaryVenomType === 'None' ? 'None (Không độc)' : draft.primaryVenomType ?? 'None');

  const previewUrl = useMemo(() => {
    if (selectedImageFile) {
      return URL.createObjectURL(selectedImageFile);
    }

    return draft.imageUrl ?? null;
  }, [selectedImageFile, draft.imageUrl]);

  useEffect(() => {
    if (!selectedImageFile) {
      return undefined;
    }

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [selectedImageFile, previewUrl]);

  if (!isOpen) {
    return null;
  }

  const addSymptom = () => {
    const next: SnakeSpeciesSymptomByTime = {
      timeRange: '',
      signs: [],
      isCritical: false,
    };
    setDraft(prev => ({ ...prev, symptomsByTime: [...prev.symptomsByTime, next] }));
  };

  const updateSymptom = (index: number, patch: Partial<SnakeSpeciesSymptomByTime>) => {
    setDraft(prev => ({
      ...prev,
      symptomsByTime: prev.symptomsByTime.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };

  const removeSymptom = (index: number) => {
    setDraft(prev => ({ ...prev, symptomsByTime: prev.symptomsByTime.filter((_, i) => i !== index) }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!draft.mediaId.trim() && !(draft.imageUrl?.trim())) {
      setSubmitError('Vui lòng upload ảnh hoặc giữ ảnh hiện tại trước khi lưu loài rắn.');
      return;
    }

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

  const uploadMedia = async (file: File) => {
    if (!file) {
      return;
    }

    setMediaUploadError(null);
    setIsUploadSuccess(false);
    setIsUploadingMedia(true);

    try {
      const mediaId = await onUploadMedia(file);
      let mediaUrl = draft.imageUrl ?? null;

      try {
        const mediaDetail = await libraryMediaApi.getById(mediaId);
        mediaUrl = mediaDetail.mediaUrl ?? mediaUrl;
      } catch {
        mediaUrl = mediaUrl ?? null;
      }

      setDraft(prev => ({ ...prev, mediaId, imageUrl: mediaUrl }));
      setIsUploadSuccess(true);
    } catch (error) {
      if (error instanceof Error) {
        setMediaUploadError(error.message || 'Upload ảnh thất bại. Vui lòng thử lại.');
      } else {
        setMediaUploadError('Upload ảnh thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedImageFile(file);
    setMediaUploadError(null);
    setIsUploadSuccess(false);

    if (file) {
      void uploadMedia(file);
    }
  };

  return (
    <div className="fixed inset-0 z-2000 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {mode === 'create' ? 'Thêm loài rắn mới' : 'Cập nhật loài rắn'}
            </h3>
            <p className="text-sm text-slate-500">Nhập dữ liệu theo cấu trúc chuẩn của hệ thống.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-6 p-6">
          {submitError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {submitError}
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-700">Tên thường gọi</p>
              <input
                required
                value={draft.commonName}
                onChange={e => setDraft(prev => ({ ...prev, commonName: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-700">Tên khoa học</p>
              <input
                required
                value={draft.scientificName}
                onChange={e => setDraft(prev => ({ ...prev, scientificName: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-700">Ảnh loài rắn</p>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Chọn ảnh
                  </button>
                  <div className="min-h-10 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    {selectedImageFile?.name ?? (draft.imageUrl ? 'Ảnh hiện tại' : 'Chưa chọn ảnh')}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSnakeMediaPickerOpen(true)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Lấy từ thư viện
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedImageFile) {
                        void uploadMedia(selectedImageFile);
                      }
                    }}
                    disabled={isUploadingMedia || !selectedImageFile}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isUploadingMedia ? 'Đang upload...' : 'Upload lại'}
                  </button>
                  {(draft.mediaId || draft.imageUrl) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImageFile(null);
                        setIsUploadSuccess(false);
                        setMediaUploadError(null);
                        setDraft(prev => ({ ...prev, mediaId: '', imageUrl: null }));
                      }}
                      className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Bỏ ảnh
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500">Ảnh sẽ tự động upload ngay sau khi bạn chọn file.</p>
                {isUploadingMedia && (
                  <p className="text-xs font-semibold text-blue-600">Đang upload ảnh...</p>
                )}
                {!isUploadingMedia && isUploadSuccess && (
                  <p className="text-xs font-semibold text-emerald-600">Upload ảnh thành công.</p>
                )}
                {previewUrl && (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <p className="border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                      {selectedImageFile ? 'Preview ảnh mới' : 'Ảnh hiện tại'}
                    </p>
                    <div
                      className="h-44 w-full bg-contain bg-center bg-no-repeat"
                      style={{ backgroundImage: `url('${previewUrl}')` }}
                    />
                  </div>
                )}
                {mediaUploadError && (
                  <p className="text-xs text-rose-600">{mediaUploadError}</p>
                )}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-700">Mức rủi ro (1-10)</p>
              <input
                type="number"
                min={1}
                max={10}
                required
                value={draft.riskLevel}
                onChange={e => setDraft(prev => ({ ...prev, riskLevel: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              />
            </div>
            <div className="md:col-span-2">
              <p className="mb-2 text-xs font-semibold text-slate-700">Mô tả</p>
              <textarea
                required
                value={draft.description}
                onChange={e => setDraft(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              />
            </div>
            <div className="md:col-span-2">
              <p className="mb-2 text-xs font-semibold text-slate-700">Tóm tắt nhận diện</p>
              <textarea
                required
                value={draft.identificationSummary}
                onChange={e => setDraft(prev => ({ ...prev, identificationSummary: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-6">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={draft.isVenomous}
                  onChange={e => setDraft(prev => ({
                    ...prev,
                    isVenomous: e.target.checked,
                    primaryVenomType: e.target.checked ? prev.primaryVenomType ?? 'None' : 'None',
                    primaryVenomTypeId: e.target.checked ? prev.primaryVenomTypeId : null,
                    venomIds: e.target.checked ? prev.venomIds : [],
                    antivenomIds: e.target.checked ? prev.antivenomIds : [],
                  }))}
                />
                Có độc
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={e => setDraft(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                Đang hoạt động
              </label>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-2">
            <TagListInput
              label="Đặc điểm hình thái"
              values={draft.identification.physicalTraits}
              onChange={next => setDraft(prev => ({
                ...prev,
                identification: { ...prev.identification, physicalTraits: next },
              }))}
            />
            <TagListInput
              label="Hành vi"
              values={draft.identification.behaviors}
              onChange={next => setDraft(prev => ({
                ...prev,
                identification: { ...prev.identification, behaviors: next },
              }))}
            />
            <div className="lg:col-span-2">
              <p className="mb-2 text-xs font-semibold text-slate-700">Môi trường sống</p>
              <input
                value={draft.identification.habitat ?? ''}
                onChange={e => setDraft(prev => ({
                  ...prev,
                  identification: { ...prev.identification, habitat: e.target.value || null },
                }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">Triệu chứng theo mốc thời gian</h4>
              <button type="button" onClick={addSymptom} className="text-sm font-semibold text-teal-700 hover:underline">
                + Thêm mốc thời gian
              </button>
            </div>
            <div className="space-y-3">
              {draft.symptomsByTime.map((symptom, index) => (
                <div key={`symptom-${symptom.timeRange || index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500">
                      Mốc
                      {' '}
                      {index + 1}
                    </p>
                    <button type="button" onClick={() => removeSymptom(index)} className="text-rose-600 hover:text-rose-700">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <input
                    value={symptom.timeRange}
                    onChange={e => updateSymptom(index, { timeRange: e.target.value })}
                    placeholder="Ví dụ: 0 - 15 phút"
                    className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                  />
                  <TagListInput
                    label="Dấu hiệu"
                    values={symptom.signs}
                    onChange={next => updateSymptom(index, { signs: next })}
                  />
                  <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={symptom.isCritical}
                      onChange={e => updateSymptom(index, { isCritical: e.target.checked })}
                    />
                    Mốc nguy kịch
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3">
              <p className="mb-2 text-xs font-semibold text-slate-700">Chế độ ghi đè sơ cứu</p>
              <select
                value={draft.firstAidGuidelineOverride?.mode ?? 'Append'}
                onChange={e => setDraft(prev => ({
                  ...prev,
                  firstAidGuidelineOverride: {
                    ...(prev.firstAidGuidelineOverride ?? {
                      mode: 'Append',
                      content: { steps: [], dos: [], donts: [], notes: [] },
                    }),
                    mode: e.target.value,
                  },
                }))}
                className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              >
                <option value="Append">Append (Bổ sung)</option>
                <option value="Replace">Replace (Thay thế)</option>
              </select>
              <div className="mt-2 space-y-2 text-xs text-slate-500">
                <p>
                  Ghi đè áp dụng cho bộ sơ cứu của loại độc chính của loài rắn:
                  <strong>{` ${primaryVenomTypeLabel}`}</strong>
                </p>
                <ul className="list-disc pl-4">
                  <li>
                    <strong>Replace</strong>
                    : thay thế hoàn toàn guideline hiện có.
                  </li>
                  <li>
                    <strong>Append</strong>
                    : bổ sung thêm vào guideline hiện có.
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <LineItemEditor
                label="Các bước sơ cứu"
                values={draft.firstAidGuidelineOverride?.content.steps ?? []}
                onUploadMedia={onUploadMedia}
                onChange={next => setDraft(prev => ({
                  ...prev,
                  firstAidGuidelineOverride: {
                    ...(prev.firstAidGuidelineOverride ?? {
                      mode: 'Append',
                      content: { steps: [], dos: [], donts: [], notes: [] },
                    }),
                    content: {
                      ...(prev.firstAidGuidelineOverride?.content ?? {
                        steps: [],
                        dos: [],
                        donts: [],
                        notes: [],
                      }),
                      steps: next,
                    },
                  },
                }))}
              />
              <LineItemEditor
                label="Nên làm"
                values={draft.firstAidGuidelineOverride?.content.dos ?? []}
                onUploadMedia={onUploadMedia}
                onChange={next => setDraft(prev => ({
                  ...prev,
                  firstAidGuidelineOverride: {
                    ...(prev.firstAidGuidelineOverride ?? {
                      mode: 'Append',
                      content: { steps: [], dos: [], donts: [], notes: [] },
                    }),
                    content: {
                      ...(prev.firstAidGuidelineOverride?.content ?? {
                        steps: [],
                        dos: [],
                        donts: [],
                        notes: [],
                      }),
                      dos: next,
                    },
                  },
                }))}
              />
              <LineItemEditor
                label="Không nên làm"
                values={draft.firstAidGuidelineOverride?.content.donts ?? []}
                onUploadMedia={onUploadMedia}
                onChange={next => setDraft(prev => ({
                  ...prev,
                  firstAidGuidelineOverride: {
                    ...(prev.firstAidGuidelineOverride ?? {
                      mode: 'Append',
                      content: { steps: [], dos: [], donts: [], notes: [] },
                    }),
                    content: {
                      ...(prev.firstAidGuidelineOverride?.content ?? {
                        steps: [],
                        dos: [],
                        donts: [],
                        notes: [],
                      }),
                      donts: next,
                    },
                  },
                }))}
              />
              <TagListInput
                label="Ghi chú"
                values={draft.firstAidGuidelineOverride?.content.notes ?? []}
                onChange={next => setDraft(prev => ({
                  ...prev,
                  firstAidGuidelineOverride: {
                    ...(prev.firstAidGuidelineOverride ?? {
                      mode: 'Append',
                      content: { steps: [], dos: [], donts: [], notes: [] },
                    }),
                    content: {
                      ...(prev.firstAidGuidelineOverride?.content ?? {
                        steps: [],
                        dos: [],
                        donts: [],
                        notes: [],
                      }),
                      notes: next,
                    },
                  },
                }))}
              />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-2">
            <div>
              <TagListInput
                label="Tên gọi khác"
                values={draft.alternativeNames}
                onChange={next => setDraft(prev => ({ ...prev, alternativeNames: next }))}
              />
              {draft.isVenomous && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold text-slate-700">Loại độc liên kết</p>
                  <div className="space-y-2 rounded-xl border border-slate-300 bg-white p-3">
                    {venomTypeOptions.length === 0
                      ? (
                          <p className="text-sm text-slate-500">Không có dữ liệu loại độc.</p>
                        )
                      : venomTypeOptions.map(option => (
                          <label
                            key={option.id}
                            className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100"
                          >
                            <input
                              type="checkbox"
                              checked={draft.venomIds.includes(option.id)}
                              onChange={(e) => {
                                setDraft((prev) => {
                                  const nextVenomIds = e.target.checked
                                    ? [...prev.venomIds, option.id]
                                    : prev.venomIds.filter(id => id !== option.id);
                                  const nextPrimaryVenomTypeId = e.target.checked
                                    ? prev.primaryVenomTypeId ?? option.id
                                    : prev.primaryVenomTypeId === option.id
                                      ? nextVenomIds[0] ?? null
                                      : prev.primaryVenomTypeId;
                                  const nextPrimaryVenomType = nextPrimaryVenomTypeId == null
                                    ? 'None'
                                    : venomTypeOptions.find(v => v.id === nextPrimaryVenomTypeId)?.value ?? prev.primaryVenomType;
                                  return {
                                    ...prev,
                                    venomIds: nextVenomIds,
                                    primaryVenomTypeId: nextPrimaryVenomTypeId,
                                    primaryVenomType: nextPrimaryVenomType,
                                  };
                                });
                              }}
                              className="mt-1"
                            />
                            <span className="text-sm text-slate-700">{option.label}</span>
                          </label>
                        ))}
                  </div>
                  {draft.venomIds.length > 0 && (
                    <div className="mt-4 rounded-xl border border-slate-300 bg-white p-3">
                      <p className="mb-2 text-xs font-semibold text-slate-700">Chọn loại độc chính</p>
                      <div className="space-y-2">
                        {venomTypeOptions
                          .filter(option => draft.venomIds.includes(option.id))
                          .map((option) => {
                            const isPrimarySelected = draft.primaryVenomTypeId === option.id;
                            return (
                              <label
                                key={option.id}
                                htmlFor={`primary-venom-type-${option.id}`}
                                className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 ${isPrimarySelected ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-slate-50'} hover:bg-slate-100`}
                              >
                                <input
                                  id={`primary-venom-type-${option.id}`}
                                  type="radio"
                                  name="primaryVenomTypeId"
                                  value={option.id}
                                  checked={isPrimarySelected}
                                  onChange={() => setDraft(prev => ({
                                    ...prev,
                                    primaryVenomTypeId: option.id,
                                    primaryVenomType: option.value,
                                  }))}
                                  className="mt-1 h-4 w-4 text-teal-600"
                                />
                                <span className="text-sm text-slate-700">{option.label}</span>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {draft.isVenomous && (
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-700">Huyết thanh kháng nọc liên kết</p>
                <div className="space-y-2 rounded-xl border border-slate-300 bg-white p-3">
                  {antivenomOptions.length === 0
                    ? (
                        <p className="text-sm text-slate-500">Không có dữ liệu huyết thanh.</p>
                      )
                    : antivenomOptions.map(option => (
                        <label
                          key={option.id}
                          className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100"
                        >
                          <input
                            type="checkbox"
                            checked={draft.antivenomIds.includes(option.id)}
                            onChange={(e) => {
                              setDraft((prev) => {
                                const next = e.target.checked
                                  ? [...prev.antivenomIds, option.id]
                                  : prev.antivenomIds.filter(id => id !== option.id);
                                return { ...prev, antivenomIds: next };
                              });
                            }}
                            className="mt-1"
                          />
                          <span className="text-sm text-slate-700">{option.label}</span>
                        </label>
                      ))}
                </div>
              </div>
            )}
          </section>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Huỷ
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

      <LibraryMediaPickerModal
        isOpen={isSnakeMediaPickerOpen}
        title="Chọn ảnh loài rắn từ thư viện"
        mediaType="Image"
        onClose={() => setIsSnakeMediaPickerOpen(false)}
        onSelect={(media) => {
          setSelectedImageFile(null);
          setMediaUploadError(null);
          setIsUploadSuccess(true);
          setDraft(prev => ({
            ...prev,
            mediaId: media.id,
            imageUrl: media.mediaUrl,
          }));
          setIsSnakeMediaPickerOpen(false);
        }}
      />
    </div>
  );
}
