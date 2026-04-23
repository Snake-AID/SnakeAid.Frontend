'use client';

import type { PaginationMeta } from '@/types/api-response';
import type { ExpertCertificateResponse } from '@/types/expert-certificate.type';
import { Ban, CheckCircle, Eye, Loader2, Plus, SearchX, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminExpertCertificateApi } from '@/apis/admin-expert-certificate.api';
import { api, ApiClientError } from '@/apis/client';
import { useToast } from '@/components/ToastProvider';

interface ExpertProfile {
  accountId: string;
  name: string;
  avatarUrl: string | null;
  biography: string;
  scheduledConsultationFee: number;
  emergencyConsultationFee: number;
  rating: number;
  ratingCount: number;
  isVerified: boolean;
  isOnline: boolean;
  totalConsultations: number;
  averageResponseTimeMinutes: number | null;
  successRate: number | null;
  specializations: unknown[];
}

const DEFAULT_PAGINATION: PaginationMeta = {
  total_pages: 1,
  total_items: 0,
  current_page: 1,
  page_size: 10,
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('vi-VN', { hour12: false });
};

const getValidationMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof ApiClientError)) {
    return fallback;
  }
  const validationEntries = Object.entries(error.error?.validationErrors ?? {});
  if (!validationEntries.length) {
    return fallback;
  }
  return validationEntries.map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`).join(' | ');
};

const getInitials = (name: string | null | undefined) => {
  if (!name) {
    return 'NA';
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'NA';
  }
  return parts.slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('');
};

const renderAvatar = (avatarUrl: string | null | undefined, fullName: string | null | undefined) => {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={fullName ?? 'Avatar'}
        className="size-12 rounded-full border border-slate-200 object-cover"
      />
    );
  }
  return (
    <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-bold text-slate-600">
      {getInitials(fullName)}
    </div>
  );
};

const buildPageItems = (current: number, total: number): Array<number | '...'> => {
  if (total <= 1) {
    return [1];
  }
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, total, current - 2, current - 1, current, current + 1, current + 2]);
  const normalized = Array.from(pages).filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: Array<number | '...'> = [];
  normalized.forEach((page, index) => {
    const prev = normalized[index - 1];
    if (prev !== undefined && page - prev > 1) {
      result.push('...');
    }
    result.push(page);
  });
  return result;
};

const ExpertNameCell = ({ expertId }: { expertId: string }) => {
  const [name, setName] = useState<string>('...');

  useEffect(() => {
    let isMounted = true;
    api.get<{ name: string }>(`/experts/${expertId}`)
      .then((data) => {
        if (isMounted) {
          setName(data.name || 'Không rõ');
        }
      })
      .catch(() => {
        if (isMounted) {
          setName('Lỗi tải');
        }
      });
    return () => {
      isMounted = false;
    };
  }, [expertId]);

  return <span>{name}</span>;
};

export default function CertificatesTab() {
  const { showToast } = useToast();

  const [certs, setCerts] = useState<ExpertCertificateResponse[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedCert, setSelectedCert] = useState<ExpertCertificateResponse | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [expertDetail, setExpertDetail] = useState<ExpertProfile | null>(null);
  const [expertDetailLoading, setExpertDetailLoading] = useState(false);
  const [expertDetailError, setExpertDetailError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (detailModalOpen && selectedCert?.expertId) {
      setExpertDetailLoading(true);
      setExpertDetailError(null);
      setExpertDetail(null);

      api.get<ExpertProfile>(`/experts/${selectedCert.expertId}`)
        .then((data) => {
          if (isMounted) {
            setExpertDetail(data);
          }
        })
        .catch(() => {
          if (isMounted) {
            setExpertDetailError('Không thể tải thông tin chuyên gia.');
          }
        })
        .finally(() => {
          if (isMounted) {
            setExpertDetailLoading(false);
          }
        });
    } else {
      setExpertDetail(null);
      setExpertDetailError(null);
    }

    return () => {
      isMounted = false;
    };
  }, [detailModalOpen, selectedCert]);

  const [reviewDialog, setReviewDialog] = useState<{
    cert: ExpertCertificateResponse;
    status: 'Verified' | 'Rejected';
    reason: string;
    submitting: boolean;
  } | null>(null);

  const [deleteDialog, setDeleteDialog] = useState<{
    cert: ExpertCertificateResponse;
    submitting: boolean;
  } | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    expertId: '',
    certificateName: '',
    issuingOrganization: '',
    issueDate: '',
    expiryDate: '',
    verificationStatus: 'Pending' as 'Pending' | 'Verified' | 'Rejected',
    rejectionReason: '',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const loadCerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminExpertCertificateApi.getList({
        pageNumber: page,
        pageSize,
        verificationStatus: statusFilter === 'all' ? undefined : statusFilter,
      });
      setCerts(response.items);
      setMeta(response.meta);
    } catch (err) {
      const msg = getValidationMessage(err, 'Không thể tải danh sách chứng chỉ.');
      setError(msg);
      showToast(msg, { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, showToast]);

  useEffect(() => {
    void loadCerts();
  }, [loadCerts]);

  const handleOpenReview = (cert: ExpertCertificateResponse, status: 'Verified' | 'Rejected') => {
    setReviewDialog({
      cert,
      status,
      reason: '',
      submitting: false,
    });
  };

  const handleConfirmReview = async () => {
    if (!reviewDialog) {
      return;
    }
    const { cert, status, reason } = reviewDialog;

    if (status === 'Rejected' && !reason.trim()) {
      showToast('Vui lòng nhập lý do từ chối.', { type: 'error' });
      return;
    }

    setReviewDialog(prev => prev ? { ...prev, submitting: true } : prev);
    try {
      await adminExpertCertificateApi.update(cert.id, {
        certificateName: cert.certificateName,
        issuingOrganization: cert.issuingOrganization,
        issueDate: cert.issueDate,
        expiryDate: cert.expiryDate,
        reportMediaIds: cert.media.map(m => m.id),
        verificationStatus: status,
        rejectionReason: status === 'Rejected' ? reason.trim() : null,
      });
      showToast(`Đã ${status === 'Verified' ? 'duyệt' : 'từ chối'} chứng chỉ thành công.`, { type: 'success' });
      setReviewDialog(null);
      if (detailModalOpen && selectedCert?.id === cert.id) {
        setDetailModalOpen(false);
      }
      void loadCerts();
    } catch (err) {
      const msg = getValidationMessage(err, 'Cập nhật trạng thái chứng chỉ thất bại.');
      showToast(msg, { type: 'error' });
      setReviewDialog(prev => prev ? { ...prev, submitting: false } : prev);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog) {
      return;
    }
    setDeleteDialog(prev => prev ? { ...prev, submitting: true } : prev);
    try {
      await adminExpertCertificateApi.delete(deleteDialog.cert.id);
      showToast('Đã xóa chứng chỉ thành công.', { type: 'success' });
      setDeleteDialog(null);
      if (detailModalOpen && selectedCert?.id === deleteDialog.cert.id) {
        setDetailModalOpen(false);
      }
      void loadCerts();
    } catch (err) {
      const msg = getValidationMessage(err, 'Xóa chứng chỉ thất bại.');
      showToast(msg, { type: 'error' });
      setDeleteDialog(prev => prev ? { ...prev, submitting: false } : prev);
    }
  };

  const handleCreate = async () => {
    if (!createForm.expertId.trim() || !createForm.certificateName.trim() || !createForm.issuingOrganization.trim() || !createForm.issueDate) {
      showToast('Vui lòng điền đầy đủ các trường bắt buộc.', { type: 'error' });
      return;
    }
    if (createForm.verificationStatus === 'Rejected' && !createForm.rejectionReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối.', { type: 'error' });
      return;
    }
    setCreateSubmitting(true);
    try {
      await adminExpertCertificateApi.create({
        expertId: createForm.expertId.trim(),
        certificateName: createForm.certificateName.trim(),
        issuingOrganization: createForm.issuingOrganization.trim(),
        issueDate: new Date(createForm.issueDate).toISOString(),
        expiryDate: createForm.expiryDate ? new Date(createForm.expiryDate).toISOString() : null,
        reportMediaIds: [],
        verificationStatus: createForm.verificationStatus,
        rejectionReason: createForm.verificationStatus === 'Rejected' ? createForm.rejectionReason.trim() : null,
      });
      showToast('Đã tạo chứng chỉ thành công.', { type: 'success' });
      setCreateOpen(false);
      setCreateForm({ expertId: '', certificateName: '', issuingOrganization: '', issueDate: '', expiryDate: '', verificationStatus: 'Pending', rejectionReason: '' });
      void loadCerts();
    } catch (err) {
      const msg = getValidationMessage(err, 'Tạo chứng chỉ thất bại.');
      showToast(msg, { type: 'error' });
    } finally {
      setCreateSubmitting(false);
    }
  };

  const canPrev = page > 1;
  const canNext = page < meta.total_pages;
  const pageItems = useMemo(() => buildPageItems(meta.current_page, meta.total_pages), [meta.current_page, meta.total_pages]);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-800">Danh sách chứng chỉ chuyên gia</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="size-3.5" />
            Tạo chứng chỉ
          </button>
        </div>
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-700">Trạng thái</p>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
            >
              <option value="all">Tất cả</option>
              <option value="Pending">Chờ duyệt</option>
              <option value="Verified">Đã duyệt</option>
              <option value="Rejected">Đã từ chối</option>
            </select>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-700">Số dòng / trang</p>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
            >
              {[10, 20, 50].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="border-b border-slate-200 px-3 py-2">Tên chứng chỉ</th>
                <th className="border-b border-slate-200 px-3 py-2">Chuyên gia</th>
                <th className="border-b border-slate-200 px-3 py-2">Tổ chức cấp</th>
                <th className="border-b border-slate-200 px-3 py-2">Ngày cấp / Ngày hết hạn</th>
                <th className="border-b border-slate-200 px-3 py-2">Trạng thái</th>
                <th className="border-b border-slate-200 px-3 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Đang tải...
                    </span>
                  </td>
                </tr>
              )}
              {!loading && certs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <SearchX className="size-4" />
                      Không có dữ liệu
                    </span>
                  </td>
                </tr>
              )}
              {!loading && certs.map(cert => (
                <tr key={cert.id} className="odd:bg-slate-50/50">
                  <td className="border-b border-slate-100 px-3 py-2 font-medium text-slate-800">{cert.certificateName}</td>
                  <td className="border-b border-slate-100 px-3 py-2">
                    <ExpertNameCell expertId={cert.expertId} />
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2">{cert.issuingOrganization}</td>
                  <td className="border-b border-slate-100 px-3 py-2">
                    {formatDateTime(cert.issueDate)}
                    {' '}
                    -
                    {cert.expiryDate ? formatDateTime(cert.expiryDate) : 'Không có'}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      cert.verificationStatus === 'Verified'
                        ? 'bg-emerald-100 text-emerald-700'
                        : cert.verificationStatus === 'Rejected'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}
                    >
                      {cert.verificationStatus === 'Pending' ? 'Chờ duyệt' : cert.verificationStatus === 'Verified' ? 'Đã duyệt' : 'Đã từ chối'}
                    </span>
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCert(cert);
                          setDetailModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Eye className="size-3.5" />
                        {' '}
                        Chi tiết
                      </button>
                      <button
                        onClick={() => setDeleteDialog({ cert, submitting: false })}
                        className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="size-3.5" />
                        {' '}
                        Xóa
                      </button>
                      {cert.verificationStatus === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleOpenReview(cert, 'Verified')}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            <CheckCircle className="size-3.5" />
                            {' '}
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleOpenReview(cert, 'Rejected')}
                            className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                          >
                            <Ban className="size-3.5" />
                            {' '}
                            Từ chối
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <p>
            Trang
            {' '}
            {meta.current_page}
            {' '}
            /
            {' '}
            {meta.total_pages}
            {' '}
            • Tổng
            {' '}
            {meta.total_items}
            {' '}
            chứng chỉ
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => canPrev && setPage(p => p - 1)}
              disabled={!canPrev}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
            >
              Trước
            </button>
            {pageItems.map(pi => (
              pi === '...'
                ? (
                    <span

                      key={`ellipsis-before-${pageItems.indexOf(pi, pageItems.indexOf(pi))}`}
                      className="px-1 text-slate-400"
                    >
                      ...
                    </span>
                  )
                : (
                    <button
                      key={pi}
                      onClick={() => setPage(pi)}
                      className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold ${pi === meta.current_page ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                    >
                      {pi}
                    </button>
                  )
            ))}
            <button
              onClick={() => canNext && setPage(p => p + 1)}
              disabled={!canNext}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      </section>

      {/* Review Dialog */}
      {reviewDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">
              {reviewDialog.status === 'Verified' ? 'Xác nhận duyệt chứng chỉ' : 'Xác nhận từ chối chứng chỉ'}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Bạn đang
              {' '}
              {reviewDialog.status === 'Verified' ? 'duyệt' : 'từ chối'}
              {' '}
              chứng chỉ:
              {' '}
              <span className="font-semibold">{reviewDialog.cert.certificateName}</span>
            </p>

            {reviewDialog.status === 'Rejected' && (
              <div className="mt-4">
                <label htmlFor="reject-reason" className="mb-1 block text-xs font-semibold text-slate-700">
                  Lý do từ chối
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="reject-reason"
                  rows={3}
                  value={reviewDialog.reason}
                  onChange={e => setReviewDialog(prev => prev ? { ...prev, reason: e.target.value } : prev)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                  placeholder="Nhập lý do từ chối..."
                />
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setReviewDialog(null)}
                disabled={reviewDialog.submitting}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmReview}
                disabled={reviewDialog.submitting}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                  reviewDialog.status === 'Verified'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {reviewDialog.submitting && <Loader2 className="size-3.5 animate-spin" />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModalOpen && selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">Chi tiết chứng chỉ</h3>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Tên chứng chỉ</p>
                  <p className="text-sm font-medium">{selectedCert.certificateName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Tổ chức cấp</p>
                  <p className="text-sm font-medium">{selectedCert.issuingOrganization}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Ngày cấp</p>
                  <p className="text-sm font-medium">{formatDateTime(selectedCert.issueDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Ngày hết hạn</p>
                  <p className="text-sm font-medium">{selectedCert.expiryDate ? formatDateTime(selectedCert.expiryDate) : 'Không có'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Trạng thái</p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                    selectedCert.verificationStatus === 'Verified'
                      ? 'bg-emerald-100 text-emerald-700'
                      : selectedCert.verificationStatus === 'Rejected'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}
                  >
                    {selectedCert.verificationStatus === 'Pending' ? 'Chờ duyệt' : selectedCert.verificationStatus === 'Verified' ? 'Đã duyệt' : 'Đã từ chối'}
                  </span>
                </div>
                {selectedCert.verificationStatus === 'Rejected' && selectedCert.rejectionReason && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-rose-500 font-semibold mb-1">Lý do từ chối</p>
                    <p className="text-sm text-rose-700 bg-rose-50 p-2 rounded border border-rose-100">{selectedCert.rejectionReason}</p>
                  </div>
                )}
              </div>

              <div className="mb-6 rounded-xl border border-cyan-200 bg-cyan-50/70 p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Thông tin chuyên gia</p>
                {expertDetailLoading && (
                  <div className="text-sm text-slate-600 flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Đang tải...
                  </div>
                )}
                {expertDetailError && (
                  <div className="text-sm text-rose-600 bg-rose-50 p-2 rounded border border-rose-100">{expertDetailError}</div>
                )}
                {expertDetail && (
                  <>
                    <div className="mb-3 flex items-center gap-3 rounded-lg border border-cyan-100 bg-white px-3 py-2">
                      {renderAvatar(expertDetail.avatarUrl, expertDetail.name)}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{expertDetail.name || '-'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm text-slate-700">
                      <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                        <span className="font-semibold">Mã tài khoản:</span>
                        {' '}
                        {expertDetail.accountId || '-'}
                      </p>
                      <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                        <span className="font-semibold">Trực tuyến:</span>
                        {' '}
                        {expertDetail.isOnline ? 'Có' : 'Không'}
                      </p>
                      <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                        <span className="font-semibold">Đã xác thực:</span>
                        {' '}
                        {expertDetail.isVerified ? 'Có' : 'Không'}
                      </p>
                      <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                        <span className="font-semibold">Đánh giá:</span>
                        {' '}
                        {expertDetail.rating || 0}
                        {' '}
                        (
                        {expertDetail.ratingCount || 0}
                        {' '}
                        lượt)
                      </p>
                      <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                        <span className="font-semibold">Phí tư vấn lịch trình:</span>
                        {' '}
                        {expertDetail.scheduledConsultationFee ? `${expertDetail.scheduledConsultationFee.toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                      </p>
                      <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                        <span className="font-semibold">Phí tư vấn khẩn cấp:</span>
                        {' '}
                        {expertDetail.emergencyConsultationFee ? `${expertDetail.emergencyConsultationFee.toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                      </p>
                      <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                        <span className="font-semibold">Tổng số ca tư vấn:</span>
                        {' '}
                        {expertDetail.totalConsultations}
                      </p>
                      <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
                        <span className="font-semibold">Tỉ lệ thành công:</span>
                        {' '}
                        {expertDetail.successRate ? `${expertDetail.successRate}%` : '-'}
                      </p>
                      <p className="rounded-lg border border-cyan-100 bg-white px-3 py-2 md:col-span-2">
                        <span className="font-semibold">Tiểu sử:</span>
                        {' '}
                        {expertDetail.biography || '-'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900 mb-3 border-b pb-2">Hình ảnh chứng chỉ</p>
                {selectedCert.media && selectedCert.media.length > 0
                  ? (
                      <div className="grid grid-cols-1 gap-4">
                        {selectedCert.media.map(m => (
                          <div key={m.id} className="border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                            <div className="bg-slate-100 p-2 flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-700 truncate" title={m.fileName}>{m.fileName}</span>
                              <a href={m.mediaUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline shrink-0">Mở toàn màn hình</a>
                            </div>
                            <img src={m.mediaUrl} alt={m.fileName} className="w-full object-contain max-h-125 bg-slate-50" />
                          </div>
                        ))}
                      </div>
                    )
                  : selectedCert.certificateUrl
                    ? (
                        <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                          <div className="bg-slate-100 p-2 flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700">URL Legacy</span>
                            <a href={selectedCert.certificateUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Mở toàn màn hình</a>
                          </div>
                          <img src={selectedCert.certificateUrl} alt="Certificate" className="w-full object-contain  bg-slate-50" />
                        </div>
                      )
                    : (
                        <p className="text-sm text-slate-500 italic">Không có hình ảnh đính kèm.</p>
                      )}
              </div>
            </div>

            {selectedCert.verificationStatus === 'Pending' && (
              <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={() => handleOpenReview(selectedCert, 'Rejected')}
                  className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                >
                  <Ban className="size-4" />
                  {' '}
                  Từ chối
                </button>
                <button
                  onClick={() => handleOpenReview(selectedCert, 'Verified')}
                  className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <CheckCircle className="size-4" />
                  {' '}
                  Duyệt chứng chỉ
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Delete Dialog */}
      {deleteDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Xác nhận xóa chứng chỉ</h3>
            <p className="mt-1 text-sm text-slate-600">
              Bạn có chắc muốn xóa chứng chỉ
              {' '}
              <span className="font-semibold">{deleteDialog.cert.certificateName}</span>
              ? Hành động này không thể hoàn tác.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteDialog(null)}
                disabled={deleteDialog.submitting}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteDialog.submitting}
                className="inline-flex items-center gap-2 rounded-md border border-rose-600 bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 hover:bg-rose-700"
              >
                {deleteDialog.submitting && <Loader2 className="size-3.5 animate-spin" />}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Certificate Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">Tạo chứng chỉ chuyên gia</h3>
              <button
                onClick={() => setCreateOpen(false)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="create-expertId" className="mb-1 block text-xs font-semibold text-slate-700">
                    ID Chuyên gia
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="create-expertId"
                    value={createForm.expertId}
                    onChange={e => setCreateForm(prev => ({ ...prev, expertId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                    placeholder="UUID của tài khoản chuyên gia"
                  />
                </div>
                <div>
                  <label htmlFor="create-certName" className="mb-1 block text-xs font-semibold text-slate-700">
                    Tên chứng chỉ
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="create-certName"
                    value={createForm.certificateName}
                    onChange={e => setCreateForm(prev => ({ ...prev, certificateName: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                    placeholder="Tên chứng chỉ..."
                  />
                </div>
                <div>
                  <label htmlFor="create-org" className="mb-1 block text-xs font-semibold text-slate-700">
                    Tổ chức cấp
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="create-org"
                    value={createForm.issuingOrganization}
                    onChange={e => setCreateForm(prev => ({ ...prev, issuingOrganization: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                    placeholder="Tổ chức cấp chứng chỉ..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="create-issueDate" className="mb-1 block text-xs font-semibold text-slate-700">
                      Ngày cấp
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="create-issueDate"
                      type="date"
                      value={createForm.issueDate}
                      onChange={e => setCreateForm(prev => ({ ...prev, issueDate: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="create-expiryDate" className="mb-1 block text-xs font-semibold text-slate-700">Ngày hết hạn</label>
                    <input
                      id="create-expiryDate"
                      type="date"
                      value={createForm.expiryDate}
                      onChange={e => setCreateForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="create-status" className="mb-1 block text-xs font-semibold text-slate-700">Trạng thái xác minh</label>
                  <select
                    id="create-status"
                    value={createForm.verificationStatus}
                    onChange={e => setCreateForm(prev => ({ ...prev, verificationStatus: e.target.value as 'Pending' | 'Verified' | 'Rejected' }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                  >
                    <option value="Pending">Chờ duyệt</option>
                    <option value="Verified">Đã duyệt</option>
                    <option value="Rejected">Từ chối</option>
                  </select>
                </div>
                {createForm.verificationStatus === 'Rejected' && (
                  <div>
                    <label htmlFor="create-reason" className="mb-1 block text-xs font-semibold text-slate-700">
                      Lý do từ chối
                      <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="create-reason"
                      rows={3}
                      value={createForm.rejectionReason}
                      onChange={e => setCreateForm(prev => ({ ...prev, rejectionReason: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                      placeholder="Nhập lý do từ chối..."
                    />
                  </div>
                )}
                <p className="text-xs text-slate-400">Lưu ý: Ảnh chứng chỉ cần tải lên riêng qua API media trước khi gắn vào chứng chỉ.</p>
              </div>
            </div>
            <div className="border-t border-slate-200 bg-slate-50 p-4 flex justify-end gap-2">
              <button
                onClick={() => setCreateOpen(false)}
                disabled={createSubmitting}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={createSubmitting}
                className="inline-flex items-center gap-2 rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 hover:bg-blue-700"
              >
                {createSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                Tạo chứng chỉ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
