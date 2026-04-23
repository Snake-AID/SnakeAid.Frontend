import type { SnakeSpeciesSummary } from '@/types/snake-species.type';
import JSZip from 'jszip';
import { Download, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { aiRecognitionApi } from '@/apis/ai-recognition.api';
import { snakeSpeciesApi } from '@/apis/snake-species.api';
import { useToast } from '@/components/ToastProvider';

interface DatasetExportModalProps {
  onClose: () => void;
}

export default function DatasetExportModal({ onClose }: DatasetExportModalProps) {
  const { showToast } = useToast();
  const [speciesList, setSpeciesList] = useState<SnakeSpeciesSummary[]>([]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<number | ''>('');
  const [isLoadingSpecies, setIsLoadingSpecies] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        const data = await snakeSpeciesApi.getAll();
        // Sort alphabetically
        data.sort((a, b) => a.commonName.localeCompare(b.commonName));
        setSpeciesList(data);
      } catch {
        showToast('Không thể tải danh sách loài rắn.', { type: 'error' });
      } finally {
        setIsLoadingSpecies(false);
      }
    };
    void fetchSpecies();
  }, [showToast]);

  const handleExport = async () => {
    if (!selectedSpeciesId) {
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // 1. Fetch images from AI recognition endpoint.
      // We only care about images that are ExpertVerified, so we can pass status="ExpertVerified"
      // to reduce payload. We fetch a large number to get all dataset.
      const response = await aiRecognitionApi.getAdminList({
        page: 1,
        pageSize: 5000,
        status: 'ExpertVerified',
      });

      const allItems = response.items || [];

      // 2. Filter locally to make sure it ONLY downloads images with the matching expertCorrectedSpecies
      const matchingItems = allItems.filter(item => item.expertCorrectedSpecies?.id === selectedSpeciesId);

      if (matchingItems.length === 0) {
        showToast('Không tìm thấy hình ảnh nào được chuyên gia xác định là loài này.', { type: 'warning' });
        setIsExporting(false);
        return;
      }

      // 3. Create ZIP using JSZip
      const zip = new JSZip();
      let downloadedCount = 0;

      // Build professional filename using scientific name (ASCII-safe) + date
      const selectedSpecies = speciesList.find(s => s.id === selectedSpeciesId);
      const scientificName = selectedSpecies?.scientificName || 'Unknown_sp';
      // Slugify: replace spaces with underscores, strip non-alphanumeric except underscores
      const safeScientificName = scientificName
        .trim()
        .replace(/\s+/g, '_')
        .replace(/\W/g, '')
        .toLowerCase();
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

      for (const item of matchingItems) {
        try {
          if (!item.mediaUrl) {
            continue;
          }

          const imageRes = await fetch(item.mediaUrl);
          if (!imageRes.ok) {
            throw new Error('Failed to fetch image');
          }
          const blob = await imageRes.blob();

          // Get original extension from content type or URL
          let ext = 'jpg';
          if (item.contentType?.includes('png')) {
            ext = 'png';
          } else if (item.contentType?.includes('jpeg')) {
            ext = 'jpg';
          } else if (item.mediaUrl.toLowerCase().endsWith('.png')) {
            ext = 'png';
          } else if (item.mediaUrl.toLowerCase().endsWith('.jpeg') || item.mediaUrl.toLowerCase().endsWith('.jpg')) {
            ext = 'jpg';
          }

          const fileName = `${safeScientificName}_${String(downloadedCount + 1).padStart(4, '0')}.${ext}`;
          zip.file(fileName, blob);

          downloadedCount++;
          setExportProgress(Math.round((downloadedCount / matchingItems.length) * 100));
        } catch {
          console.warn(`Could not download image: ${item.mediaUrl}`);
        }
      }

      if (downloadedCount === 0) {
        showToast('Không thể tải về bất kỳ hình ảnh nào do lỗi mạng.', { type: 'error' });
        setIsExporting(false);
        return;
      }

      // 4. Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `SnakeAID_Dataset_${safeScientificName}_n${matchingItems.length}_${dateStr}.zip`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      showToast(`Tải xuống thành công ${downloadedCount} hình ảnh.`, { type: 'success' });
      onClose();
    } catch (error) {
      console.error(error);
      showToast('Đã xảy ra lỗi trong quá trình tổng hợp dữ liệu.', { type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-900">Xuất Dataset Nhận Diện</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="mb-4 text-sm text-slate-600">
            Tính năng này sẽ tổng hợp và tải về một file ZIP chứa tất cả các hình ảnh đã được chuyên gia xác định thuộc về loài rắn bạn chọn.
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="speciesSelect" className="mb-1 block text-sm font-semibold text-slate-700">Chọn loài rắn cần tải</label>
              {isLoadingSpecies
                ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="size-4 animate-spin" />
                      {' '}
                      Đang tải danh sách loài...
                    </div>
                  )
                : (
                    <select
                      id="speciesSelect"
                      value={selectedSpeciesId}
                      onChange={e => setSelectedSpeciesId(Number(e.target.value))}
                      disabled={isExporting}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-600 disabled:opacity-50 bg-slate-50"
                    >
                      <option value="">-- Chọn một loài rắn --</option>
                      {speciesList.map(species => (
                        <option key={species.id} value={species.id}>
                          {species.commonName}
                          {' '}
                          {species.scientificName ? `(${species.scientificName})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
            </div>

            {isExporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Đang tổng hợp dữ liệu...</span>
                  <span>
                    {exportProgress}
                    %
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!selectedSpeciesId || isExporting}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600"
          >
            {isExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Tải về
          </button>
        </div>
      </div>
    </div>
  );
}
