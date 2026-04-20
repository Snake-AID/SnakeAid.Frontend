'use client';

import type { FirstAidGuideline, FirstAidGuidelineOption } from '@/types/first-aid-guideline.type';
import type { VenomType } from '@/types/venom-type.type';
import { FlaskConical, RefreshCcw, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { firstAidGuidelineApi } from '@/apis/first-aid-guideline.api';
import { venomTypeApi } from '@/apis/venom-type.api';

const getFirstAidLabel = (guideline: FirstAidGuideline) => {
  const fallback = guideline.name?.trim() || `Guideline #${guideline.id}`;
  return `${guideline.id} - ${fallback}`;
};

export default function VenomTypesPage() {
  const [items, setItems] = useState<VenomType[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<VenomType | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [firstAidOptions, setFirstAidOptions] = useState<FirstAidGuidelineOption[]>([]);
  const [firstAidDetail, setFirstAidDetail] = useState<FirstAidGuideline | null>(null);

  const selectedSummary = useMemo(
    () => items.find(item => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const firstAidOptionMap = useMemo(
    () => firstAidOptions.reduce<Record<number, string>>((acc, option) => {
      acc[option.id] = option.label;
      return acc;
    }, {}),
    [firstAidOptions],
  );

  const loadFirstAidOptions = async (): Promise<FirstAidGuidelineOption[]> => {
    try {
      const data = await firstAidGuidelineApi.getAll();
      const options = data.map(item => ({
        id: item.id,
        label: getFirstAidLabel(item),
      }));
      setFirstAidOptions(options);
      return options;
    } catch (err) {
      console.error('Failed to load first aid guidelines', err);
      return [];
    }
  };

  const loadFirstAidDetail = async (id: number) => {
    try {
      const detail = await firstAidGuidelineApi.getById(id);
      setFirstAidDetail(detail);
    } catch (err) {
      console.error('Failed to load first aid guideline detail', err);
      setFirstAidDetail(null);
    }
  };

  const loadList = async (preferredId?: number | null, pinToTop = false) => {
    setIsListLoading(true);
    setListError(null);

    try {
      const data = await venomTypeApi.getAll();
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
      console.error('Failed to load venom types', err);
      setListError('Không thể tải danh sách loại độc rắn. Vui lòng thử lại.');
    } finally {
      setIsListLoading(false);
    }
  };

  const loadDetail = async (id: number) => {
    setIsDetailLoading(true);
    setDetailError(null);

    try {
      const detail = await venomTypeApi.getById(id);
      setSelectedDetail(detail);
      if (detail.firstAidGuidelineId == null || detail.firstAidGuidelineId <= 0) {
        setFirstAidDetail(null);
      }
    } catch (err) {
      console.error('Failed to load venom type detail', err);
      setSelectedDetail(null);
      setFirstAidDetail(null);
      setDetailError('Không thể tải chi tiết loại độc rắn. Vui lòng thử lại.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  useEffect(() => {
    void loadList();
    void loadFirstAidOptions();
  }, []);

  useEffect(() => {
    if (selectedId == null) {
      return;
    }

    void loadDetail(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (selectedDetail?.firstAidGuidelineId == null || selectedDetail.firstAidGuidelineId <= 0) {
      return;
    }

    void loadFirstAidDetail(selectedDetail.firstAidGuidelineId);
  }, [selectedDetail?.firstAidGuidelineId]);

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-360 flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Danh mục loại độc rắn</h2>
              <p className="mt-1 text-sm text-slate-500">
                Chế độ chỉ xem: dùng để tham chiếu dữ liệu loại độc cho các mục nghiệp vụ khác.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadList(selectedId)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <RefreshCcw className="size-4" />
                Làm mới
              </button>
            </div>
          </div>

        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Danh sách loại độc rắn</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {items.length}
                  {' '}
                  loại
                </span>
              </div>

              {isListLoading && (
                <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                  Đang tải dữ liệu...
                </div>
              )}

              {!isListLoading && listError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {listError}
                </div>
              )}

              {!isListLoading && !listError && (
                <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                  {items.map((item) => {
                    const isActive = item.id === selectedId;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          isActive
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            Mức
                            {' '}
                            {item.severityIndex}
                          </span>
                        </div>
                        <p className="mt-1 text-xs italic text-slate-500">{item.scientificName}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 xl:col-span-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {selectedId == null && (
                <div className="flex h-80 flex-col items-center justify-center text-center text-slate-500">
                  <ShieldCheck className="mb-3 size-10 text-slate-300" />
                  <p className="text-sm">Chọn một loại độc rắn để xem chi tiết.</p>
                </div>
              )}

              {selectedId != null && isDetailLoading && (
                <div className="flex h-80 items-center justify-center text-sm text-slate-500">
                  Đang tải chi tiết loại độc rắn...
                </div>
              )}

              {selectedId != null && !isDetailLoading && detailError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {detailError}
                </div>
              )}

              {selectedId != null && !isDetailLoading && !detailError && selectedDetail && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-xl bg-teal-100 p-3 text-teal-700">
                        <FlaskConical className="size-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">{selectedDetail.name}</h3>
                        <p className="mt-1 text-sm italic text-slate-500">{selectedDetail.scientificName}</p>
                      </div>
                    </div>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      Chỉ xem
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      Mức độ nghiêm trọng
                      {' '}
                      {selectedDetail.severityIndex}
                      /10
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${selectedDetail.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {selectedDetail.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      FirstAid Guideline
                      {' '}
                      {firstAidOptionMap[selectedDetail.firstAidGuidelineId] ?? `#${selectedDetail.firstAidGuidelineId}`}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="mb-2 text-sm font-bold text-slate-800">Mô tả</h4>
                    <p className="text-sm leading-6 text-slate-700">{selectedDetail.description}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="mb-2 text-sm font-bold text-slate-800">FirstAid guideline liên kết</h4>
                    <p className="text-sm text-slate-700">
                      {firstAidOptionMap[selectedDetail.firstAidGuidelineId] ?? `Guideline #${selectedDetail.firstAidGuidelineId}`}
                    </p>
                    {firstAidDetail?.summary && (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {firstAidDetail.summary}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedId != null && !isDetailLoading && !detailError && !selectedDetail && selectedSummary && (
                <div className="flex h-72 items-center justify-center text-sm text-slate-500">
                  Không tìm thấy dữ liệu chi tiết cho
                  {' '}
                  {selectedSummary.name}
                  .
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

    </main>
  );
}
