'use client';

import type {
  FirstAidLineItem,
  SnakeSpeciesSymptomByTime,
  SnakeSpeciesUpsertPayload,
} from '@/types/snake-species.type';
import { Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

export type SnakeSpeciesFormMode = 'create' | 'update';

interface SnakeSpeciesUpsertModalProps {
  isOpen: boolean;
  mode: SnakeSpeciesFormMode;
  initialValue: SnakeSpeciesUpsertPayload;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (value: SnakeSpeciesUpsertPayload) => Promise<void>;
}

interface TagListInputProps {
  label: string;
  values: string[];
  placeholder?: string;
  onChange: (next: string[]) => void;
}

interface NumberTagListInputProps {
  label: string;
  values: number[];
  placeholder?: string;
  onChange: (next: number[]) => void;
}

interface LineItemEditorProps {
  label: string;
  values: FirstAidLineItem[];
  onChange: (next: FirstAidLineItem[]) => void;
}

const venomOptions = ['Neurotoxic', 'Hemotoxic', 'Cytotoxic', 'Myotoxic', 'None'];

const venomOptionLabel: Record<string, string> = {
  Neurotoxic: 'Neurotoxic (Độc thần kinh)',
  Hemotoxic: 'Hemotoxic (Độc máu)',
  Cytotoxic: 'Cytotoxic (Độc tế bào)',
  Myotoxic: 'Myotoxic (Độc cơ)',
  None: 'None (Không độc)',
};

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

function NumberTagListInput({ label, values, placeholder, onChange }: NumberTagListInputProps) {
  const [draft, setDraft] = useState('');

  const addId = () => {
    const parsed = Number(draft.trim());
    if (!Number.isInteger(parsed)) {
      return;
    }

    if (values.includes(parsed)) {
      setDraft('');
      return;
    }

    onChange([...values, parsed]);
    setDraft('');
  };

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-slate-700">{label}</p>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addId();
            }
          }}
          placeholder={placeholder ?? 'Ví dụ: 1, 2, 3'}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
        />
        <button
          type="button"
          onClick={addId}
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

function LineItemEditor({ label, values, onChange }: LineItemEditorProps) {
  const addItem = () => {
    onChange([...values, { text: '', mediaUrl: null }]);
  };

  const updateItem = (index: number, patch: Partial<FirstAidLineItem>) => {
    onChange(values.map((item, i) => (i === index ? { ...item, ...patch } : item)));
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
          <div key={`${item.text}-${item.mediaUrl ?? ''}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">
                Mục
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
              onChange={e => updateItem(index, { mediaUrl: e.target.value || null })}
              placeholder="URL media (tuỳ chọn)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
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
  isSubmitting,
  onClose,
  onSubmit,
}: SnakeSpeciesUpsertModalProps) {
  const [draft, setDraft] = useState<SnakeSpeciesUpsertPayload>(initialValue);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
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
              <p className="mb-2 text-xs font-semibold text-slate-700">Đường dẫn (slug)</p>
              <input
                required
                value={draft.slug}
                onChange={e => setDraft(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-700">URL ảnh</p>
              <input
                required
                value={draft.imageUrl}
                onChange={e => setDraft(prev => ({ ...prev, imageUrl: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-700">Loại độc tố chính</p>
              <select
                value={draft.primaryVenomType ?? 'None'}
                onChange={e => setDraft(prev => ({ ...prev, primaryVenomType: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              >
                {venomOptions.map(option => (
                  <option key={option} value={option}>{venomOptionLabel[option] ?? option}</option>
                ))}
              </select>
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
                  onChange={e => setDraft(prev => ({ ...prev, isVenomous: e.target.checked }))}
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
                <div key={`${symptom.timeRange}-${symptom.signs.join('|')}-${String(symptom.isCritical)}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500">
                      Mốc
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
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <LineItemEditor
                label="Các bước sơ cứu"
                values={draft.firstAidGuidelineOverride?.content.steps ?? []}
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
            <TagListInput
              label="Tên gọi khác"
              values={draft.alternativeNames}
              onChange={next => setDraft(prev => ({ ...prev, alternativeNames: next }))}
            />
            <NumberTagListInput
              label="Danh sách ID độc tố"
              values={draft.venomIds}
              onChange={next => setDraft(prev => ({ ...prev, venomIds: next }))}
            />
            <NumberTagListInput
              label="Danh sách ID huyết thanh kháng nọc"
              values={draft.antivenomIds}
              onChange={next => setDraft(prev => ({ ...prev, antivenomIds: next }))}
            />
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
    </div>
  );
}
