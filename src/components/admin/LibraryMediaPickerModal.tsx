'use client';

import type { LibraryMediaItem, LibraryMediaType } from '@/types/library-media.type';
import { ImageIcon, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { libraryMediaApi } from '@/apis/library-media.api';

interface LibraryMediaPickerModalProps {
  isOpen: boolean;
  title?: string;
  mediaType?: LibraryMediaType;
  onClose: () => void;
  onSelect: (item: LibraryMediaItem) => void;
}

export default function LibraryMediaPickerModal({
  isOpen,
  title,
  mediaType,
  onClose,
  onSelect,
}: LibraryMediaPickerModalProps) {
  const [items, setItems] = useState<LibraryMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [totalCount, setTotalCount] = useState(0);

  const loadItems = async () => {
    if (!isOpen) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await libraryMediaApi.list({
        pageNumber: page,
        pageSize,
        mediaType: mediaType ?? 'Image',
        fileName: debouncedSearch || undefined,
      });

      setItems(result.items);
      setTotalCount(result.totalCount);
    } catch (err) {
      console.error('Failed to load media library', err);
      setItems([]);
      setTotalCount(0);
      setError('Không thể tải thư viện ảnh. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, page, mediaType]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => {
      window.clearTimeout(handle);
    };
  }, [search]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (page !== 1) {
      setPage(1);
      return;
    }

    void loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  if (!isOpen) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="fixed inset-0 z-3000 flex items-center justify-center bg-slate-900/45 p-4">
      <div className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h4 className="text-lg font-bold text-slate-900">{title ?? 'Chọn ảnh từ thư viện media'}</h4>
            <p className="text-xs text-slate-500">Chọn một ảnh đã upload để gán mediaId.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
            title="Đóng"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm theo tên file"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-600"
              />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-4">
          {error && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="flex h-36 items-center justify-center text-sm text-slate-500">Đang tải thư viện media...</div>
          )}

          {!isLoading && !error && items.length === 0 && (
            <div className="flex h-36 flex-col items-center justify-center text-sm text-slate-500">
              <ImageIcon className="mb-2 size-7 text-slate-300" />
              Chưa có ảnh phù hợp bộ lọc hiện tại.
            </div>
          )}

          {!isLoading && items.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow"
                  title="Chọn ảnh này"
                >
                  <div className="h-full w-full bg-slate-100">
                    <img
                      src={item.mediaUrl}
                      alt={item.fileName || 'Không có tên file'}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="truncate text-sm font-semibold text-white">{item.fileName || 'Không có tên file'}</p>
                    <p className="mt-0.5 text-[11px] text-white/80">{item.mediaType}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <p className="text-xs text-slate-600">
            Tổng:
            {' '}
            <span className="font-semibold text-slate-900">{totalCount}</span>
            {' '}
            ảnh
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
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
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
