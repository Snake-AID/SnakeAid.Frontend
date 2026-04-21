'use client';

import type {
  CreateLibraryMediaPayload,
  LibraryMediaItem,
  LibraryMediaType,
} from '@/types/library-media.type';
import { ImageIcon, Plus, RefreshCcw, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { libraryMediaApi } from '@/apis/library-media.api';
import { useToast } from '@/components/ToastProvider';

const mediaTypeOptions: LibraryMediaType[] = ['Image', 'Video', 'Document', 'Audio'];

const formatFileSize = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) {
    return 'N/A';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

export default function LibraryMediaAdminPage() {
  const { showToast } = useToast();

  const [items, setItems] = useState<LibraryMediaItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(16);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>('Image');

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMediaType, setUploadMediaType] = useState<LibraryMediaType>('Image');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!uploadFile) {
      setUploadPreviewUrl(null);
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(uploadFile);
    setUploadPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [uploadFile]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => {
      window.clearTimeout(handle);
    };
  }, [search]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [totalCount, pageSize],
  );

  const loadMedia = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await libraryMediaApi.list({
        pageNumber: page,
        pageSize,
        fileName: debouncedSearch || undefined,
        mediaType: mediaTypeFilter || undefined,
      });

      setItems(result.items);
      setTotalCount(result.totalCount);
    } catch (err) {
      console.error('Failed to load library media', err);
      setItems([]);
      setTotalCount(0);
      setError('Không thể tải thư viện media. Vui lòng thử lại.');
      showToast('Không thể tải thư viện media.', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
      return;
    }

    void loadMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
      return;
    }

    void loadMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaTypeFilter]);

  const submitUpload = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!uploadFile) {
      showToast('Vui lòng chọn file trước khi upload.', { type: 'warning' });
      return;
    }

    setIsUploading(true);

    try {
      const payload: CreateLibraryMediaPayload = {
        file: uploadFile,
        mediaType: uploadMediaType,
      };

      await libraryMediaApi.create(payload);
      showToast('Upload media thành công.', { type: 'success' });
      setUploadFile(null);
      setUploadPreviewUrl(null);
      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }
      setIsUploadOpen(false);
      await loadMedia();
    } catch (err) {
      console.error('Failed to upload media', err);
      showToast('Upload media thất bại.', { type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteMedia = async (item: LibraryMediaItem) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(`Xóa media ${item.fileName ?? item.id}?`);
    if (!confirmed) {
      return;
    }

    try {
      await libraryMediaApi.remove(item.id);
      showToast('Đã xóa media.', { type: 'success' });
      await loadMedia();
    } catch (err) {
      console.error('Failed to delete media', err);
      showToast('Xóa media thất bại.', { type: 'error' });
    }
  };

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-425 flex-col gap-5">
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Quản lý thư viện media</h2>
              <p className="mt-1 text-sm text-slate-500">
                Quản lý ảnh/video/tài liệu đã upload để tái sử dụng cho các màn hình admin.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800"
              >
                <Plus className="size-4" />
                Upload media
              </button>
              <button
                type="button"
                onClick={() => void loadMedia()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <RefreshCcw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
            </div>
          </div>
        </header>

        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-base font-bold text-slate-900">Bộ lọc thư viện</h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_10rem]">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm theo tên file"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              />
              <select
                value={mediaTypeFilter}
                onChange={e => setMediaTypeFilter(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              >
                <option value="">Tất cả loại</option>
                {mediaTypeOptions.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Danh sách media</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {totalCount}
                {' '}
                mục
              </span>
            </div>

            {error && (
              <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="flex h-44 items-center justify-center text-sm text-slate-500">Đang tải media...</div>
            )}

            {!isLoading && items.length === 0 && (
              <div className="flex h-44 flex-col items-center justify-center text-sm text-slate-500">
                <ImageIcon className="mb-2 size-8 text-slate-300" />
                Chưa có media phù hợp bộ lọc.
              </div>
            )}

            {!isLoading && items.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {items.map(item => (
                  <article key={item.id} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    {item.mediaType.toLowerCase() === 'image'
                      ? (
                          <img
                            src={item.mediaUrl}
                            alt={item.fileName ?? item.id}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        )
                      : (
                          <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 text-slate-500">
                            <ImageIcon className="mb-2 size-10" />
                            <p className="text-sm font-semibold">{item.mediaType}</p>
                          </div>
                        )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/20 to-transparent" />

                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <p className="truncate text-sm font-semibold text-white" title={item.fileName ?? item.id}>{item.fileName ?? item.id}</p>
                      <p className="mt-0.5 text-[11px] text-white/80">{formatFileSize(item.fileSizeBytes)}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold text-white">{item.mediaType}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void deleteMedia(item)}
                      className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg border border-rose-200/70 bg-white/90 px-2 py-1 text-[11px] font-semibold text-rose-700 backdrop-blur hover:bg-rose-50"
                    >
                      <Trash2 className="size-3" />
                      Xóa
                    </button>
                  </article>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>Hiển thị</span>
                <select
                  value={String(pageSize)}
                  onChange={(e) => {
                    setPage(1);
                    setPageSize(Number(e.target.value));
                  }}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none focus:border-teal-600"
                >
                  <option value="8">8</option>
                  <option value="12">12</option>
                  <option value="16">16</option>
                  <option value="24">24</option>
                </select>
                <span>mục/trang</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Trang trước
                </button>
                <span className="text-xs font-semibold text-slate-700">
                  Trang
                  {' '}
                  {page}
                  /
                  {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Trang sau
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {isUploadOpen && (
        <div className="fixed inset-0 z-3000 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Upload media mới</h4>
                <p className="text-xs text-slate-500">Chọn file và tải lên thư viện media tập trung.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsUploadOpen(false);
                  setUploadFile(null);
                  setUploadPreviewUrl(null);
                  if (uploadInputRef.current) {
                    uploadInputRef.current.value = '';
                  }
                }}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="size-4" />
              </button>
            </div>

            <form className="space-y-3" onSubmit={submitUpload}>
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Chọn file
                </button>
                <div className="min-h-10 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {uploadFile?.name ?? 'Chưa chọn file'}
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-slate-700">Loại media</p>
                <select
                  value={uploadMediaType}
                  onChange={e => setUploadMediaType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                >
                  {mediaTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {uploadPreviewUrl && uploadMediaType.toLowerCase() === 'image' && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <p className="border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Ảnh đã chọn để upload</p>
                  <div className="flex h-56 items-center justify-center p-2">
                    <img src={uploadPreviewUrl} alt="Upload preview" className="h-full w-full rounded-lg object-contain" />
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadOpen(false);
                    setUploadFile(null);
                    setUploadPreviewUrl(null);
                    if (uploadInputRef.current) {
                      uploadInputRef.current.value = '';
                    }
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Plus className="size-4" />
                  {isUploading ? 'Đang upload...' : 'Upload media'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
