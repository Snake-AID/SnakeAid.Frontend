'use client';

import type {
  AdminRoleFilter,
  AdminUserDetailResponse,
  AdminUserSummaryResponse,
} from '@/types/admin-management.type';
import type { UsersAnalytics } from '@/types/analytics.type';
import type { PaginationMeta } from '@/types/api-response';
import { Ban, Eye, Loader2, SearchX, ShieldCheck, ShieldX, TrendingUp, UserCheck, UserPlus, Users, UserX } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { adminUserApi } from '@/apis/admin-user.api';
import { analyticsApi } from '@/apis/analytics.api';
import { ApiClientError } from '@/apis/client';
import { useToast } from '@/components/ToastProvider';

const DEFAULT_PAGINATION: PaginationMeta = {
  total_pages: 1,
  total_items: 0,
  current_page: 1,
  page_size: 10,
};

const ROLE_LABEL_MAP: Record<string, string> = {
  0: 'Người dùng',
  1: 'Quản trị viên',
  2: 'Chuyên gia',
  3: 'Cứu hộ',
  4: 'Điều phối viên',
  User: 'Người dùng',
  Admin: 'Quản trị viên',
  Expert: 'Chuyên gia',
  Rescuer: 'Cứu hộ',
  Operator: 'Điều phối viên',
};

const REPUTATION_STATUS_MAP: Record<string, string> = {
  0: 'Rất tốt',
  1: 'Tốt',
  2: 'Trung bình',
  3: 'Kém',
  4: 'Đang bị khóa',
  Excellent: 'Rất tốt',
  Good: 'Tốt',
  Average: 'Trung bình',
  Poor: 'Kém',
  Suspended: 'Đang bị khóa',
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

  return validationEntries
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join(' | ');
};

const getRoleLabel = (role: number | string) => ROLE_LABEL_MAP[String(role)] ?? String(role);

const getReputationLabel = (status: number | string) => REPUTATION_STATUS_MAP[String(status)] ?? String(status);

const getDefaultAvatarUrl = (name?: string | null) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=E2E8F0&color=1E293B`;

const buildPageItems = (current: number, total: number): Array<number | '...'> => {
  if (total <= 1) {
    return [1];
  }

  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total, current - 2, current - 1, current, current + 1, current + 2]);
  const normalized = Array.from(pages)
    .filter(page => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const result: Array<number | '...'> = [];
  normalized.forEach((page, index) => {
    const previous = normalized[index - 1];
    if (previous !== undefined && page - previous > 1) {
      result.push('...');
    }
    result.push(page);
  });

  return result;
};

// ─── Stats helpers ───────────────────────────────────────────────────────────

function UserStatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`size-5 ${iconColor}`} />
      </div>
      {loading
        ? (
            <div className="space-y-2">
              <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
              <div className="h-6 w-12 animate-pulse rounded bg-slate-100" />
            </div>
          )
        : (
            <div>
              <p className="text-xs font-medium text-slate-500">{title}</p>
              <p className="mt-0.5 text-2xl font-bold text-slate-800">{value}</p>
            </div>
          )}
    </div>
  );
}

function GrowthTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) {
    return null;
  }
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg">
      <p className="mb-1 text-xs font-bold text-slate-600">{label}</p>
      <p className="text-xs text-slate-500">
        Người dùng:
        {' '}
        <span className="font-semibold text-blue-700">{payload[0]?.value.toLocaleString()}</span>
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { showToast } = useToast();

  // ── User stats state ────────────────────────────────────────────────────────
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [bannedCount, setBannedCount] = useState<number | null>(null);
  const [usersGrowth, setUsersGrowth] = useState<UsersAnalytics | null>(null);

  const [users, setUsers] = useState<AdminUserSummaryResponse[]>([]);
  const [usersMeta, setUsersMeta] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<AdminRoleFilter | ''>('');
  const [isActiveFilter, setIsActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(10);

  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<{ type: 'user'; id: string } | null>(null);
  const [banDialog, setBanDialog] = useState<{
    userId: string;
    userName: string;
    reason: string;
    submitting: boolean;
  } | null>(null);

  // ── Load stats once on mount ────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    const now = new Date();
    const yearStart = `${now.getFullYear()}-01-01`;
    const today = now.toISOString().slice(0, 10);

    const [totalRes, activeRes, bannedRes, growthRes] = await Promise.allSettled([
      adminUserApi.getList({ pageSize: 1 }),
      adminUserApi.getList({ pageSize: 1, isActive: true }),
      adminUserApi.getList({ pageSize: 1, isActive: false }),
      analyticsApi.getUsers({ period: 'month', from: yearStart, to: today }),
    ]);

    if (totalRes.status === 'fulfilled') {
      setTotalCount(totalRes.value.meta.total_items);
    }
    if (activeRes.status === 'fulfilled') {
      setActiveCount(activeRes.value.meta.total_items);
    }
    if (bannedRes.status === 'fulfilled') {
      setBannedCount(bannedRes.value.meta.total_items);
    }
    if (growthRes.status === 'fulfilled') {
      setUsersGrowth(growthRes.value);
    }

    setStatsLoading(false);
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  // Người dùng mới tháng này = last timeline point
  const newThisMonth = useMemo(() => {
    if (!usersGrowth?.timeline.length) {
      return null;
    }
    const now = new Date();
    const thisMonthLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const point = usersGrowth.timeline.find(p => p.label === thisMonthLabel)
      ?? usersGrowth.timeline.at(-1);
    return point?.totalUsers ?? null;
  }, [usersGrowth]);

  const usersCanPrev = usersPage > 1;
  const usersCanNext = usersPage < usersMeta.total_pages;
  const userPageItems = useMemo(() => buildPageItems(usersMeta.current_page, usersMeta.total_pages), [usersMeta.current_page, usersMeta.total_pages]);
  const normalizedUserSearch = useMemo(() => userSearch.trim(), [userSearch]);

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      setUsersLoading(true);
      setUsersError(null);

      try {
        const response = await adminUserApi.getList({
          role: roleFilter || undefined,
          isActive: isActiveFilter === 'all' ? undefined : isActiveFilter === 'true',
          searchTerm: normalizedUserSearch || undefined,
          page: usersPage,
          pageSize: usersPageSize,
        });

        if (cancelled) {
          return;
        }

        setUsers(response.items);
        setUsersMeta(response.meta);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error('Failed to load admin users', error);
        setUsers([]);
        const message = getValidationMessage(error, 'Không thể tải danh sách người dùng.');
        setUsersError(message);
        showToast(message, { type: 'error' });
      } finally {
        if (!cancelled) {
          setUsersLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [isActiveFilter, normalizedUserSearch, roleFilter, usersPage, usersPageSize]);

  const openUserDetail = async (userId: string) => {
    setDetailModal({ type: 'user', id: userId });
    setDetailLoading(true);
    setDetailError(null);
    setSelectedUserDetail(null);

    try {
      const detail = await adminUserApi.getDetail(userId);
      setSelectedUserDetail(detail);
    } catch (error) {
      console.error('Failed to load user detail', error);
      const message = getValidationMessage(error, 'Không thể tải chi tiết người dùng.');
      setDetailError(message);
      showToast(message, { type: 'error' });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setDetailModal(null);
    setDetailError(null);
    setSelectedUserDetail(null);
  };

  const refreshUsers = async () => {
    const latest = await adminUserApi.getList({
      role: roleFilter || undefined,
      isActive: isActiveFilter === 'all' ? undefined : isActiveFilter === 'true',
      searchTerm: normalizedUserSearch || undefined,
      page: usersPage,
      pageSize: usersPageSize,
    });

    setUsers(latest.items);
    setUsersMeta(latest.meta);
  };

  const getUserDisplayName = (userId: string) => {
    if (selectedUserDetail?.id === userId) {
      return selectedUserDetail.fullName || selectedUserDetail.userName;
    }

    const listedUser = users.find(item => item.id === userId);
    return listedUser?.fullName || listedUser?.userName || 'người dùng';
  };

  const openBanDialog = (userId: string, userName: string) => {
    setBanDialog({ userId, userName, reason: '', submitting: false });
  };

  const closeBanDialog = () => {
    if (banDialog?.submitting) {
      return;
    }

    setBanDialog(null);
  };

  const confirmBanUser = async () => {
    if (!banDialog) {
      return;
    }

    const reason = banDialog.reason.trim();
    if (!reason) {
      showToast('Vui lòng nhập lý do khóa tài khoản.', { type: 'error' });
      return;
    }

    setBanDialog(prev => (prev ? { ...prev, submitting: true } : prev));

    try {
      await adminUserApi.banUser(banDialog.userId, { reason });
      showToast(`Đã khóa tài khoản ${banDialog.userName}.`, { type: 'success' });

      await refreshUsers();

      if (detailModal?.type === 'user' && detailModal.id === banDialog.userId) {
        const detail = await adminUserApi.getDetail(banDialog.userId);
        setSelectedUserDetail(detail);
      }

      setBanDialog(null);
    } catch (error) {
      const message = getValidationMessage(error, 'Khóa tài khoản thất bại.');
      showToast(message, { type: 'error' });
      setBanDialog(prev => (prev ? { ...prev, submitting: false } : prev));
    }
  };

  const handleUnbanUser = async (userId: string) => {
    const displayName = getUserDisplayName(userId);

    try {
      await adminUserApi.unbanUser(userId);
      showToast(`Đã mở khóa tài khoản ${displayName}.`, { type: 'success' });

      await refreshUsers();

      if (detailModal?.type === 'user' && detailModal.id === userId) {
        const detail = await adminUserApi.getDetail(userId);
        setSelectedUserDetail(detail);
      }
    } catch (error) {
      const message = getValidationMessage(error, 'Mở khóa tài khoản thất bại.');
      showToast(message, { type: 'error' });
    }
  };

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-360 flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <h2 className="text-3xl font-bold text-slate-900">Quản lý người dùng</h2>
          <p className="mt-1 text-sm text-slate-500">
            Quản trị tài khoản người dùng theo API quản trị.
          </p>
        </header>

        {/* ── Stats section ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Stat cards (col-span-1) */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:grid-rows-4">
            <UserStatCard
              title="Tổng người dùng"
              value={totalCount?.toLocaleString() ?? '—'}
              icon={Users}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              loading={statsLoading}
            />
            <UserStatCard
              title="Đang hoạt động"
              value={activeCount?.toLocaleString() ?? '—'}
              icon={UserCheck}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              loading={statsLoading}
            />
            <UserStatCard
              title="Đang bị khóa"
              value={bannedCount?.toLocaleString() ?? '—'}
              icon={UserX}
              iconBg="bg-rose-50"
              iconColor="text-rose-600"
              loading={statsLoading}
            />
            <UserStatCard
              title="Mới trong tháng"
              value={newThisMonth?.toLocaleString() ?? '—'}
              icon={UserPlus}
              iconBg="bg-violet-50"
              iconColor="text-violet-600"
              loading={statsLoading}
            />
          </div>

          {/* Growth chart (col-span-2) */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Tăng trưởng người dùng</h3>
                <p className="mt-0.5 text-xs text-slate-400">Số lượng đăng ký theo tháng trong năm nay</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <TrendingUp className="size-3.5" />
                {usersGrowth?.totalUsers.toLocaleString() ?? '—'}
                {' '}
                tổng
              </div>
            </div>
            <div className="flex-1 p-5">
              {statsLoading || !usersGrowth
                ? <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
                : (
                    <ResponsiveContainer width="100%" height={196}>
                      <AreaChart data={usersGrowth.timeline} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="ugGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip content={<GrowthTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="totalUsers"
                          name="Người dùng"
                          stroke="#3b82f6"
                          fill="url(#ugGrad)"
                          strokeWidth={2}
                          dot={{ r: 3, fill: '#3b82f6' }}
                          activeDot={{ r: 5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-700">Tìm kiếm</p>
              <input
                value={userSearch}
                onChange={(event) => {
                  setUserSearch(event.target.value);
                  setUsersPage(1);
                }}
                placeholder="username, họ tên hoặc email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold text-slate-700">Vai trò</p>
              <select
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value as AdminRoleFilter | '');
                  setUsersPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              >
                <option value="">Tất cả vai trò</option>
                {[
                  { value: 'User', label: 'Người dùng' },
                  { value: 'Admin', label: 'Quản trị viên' },
                  { value: 'Expert', label: 'Chuyên gia' },
                  { value: 'Rescuer', label: 'Cứu hộ' },
                  { value: 'Operator', label: 'Điều phối viên' },
                ].map(roleOption => (
                  <option key={roleOption.value} value={roleOption.value}>{roleOption.label}</option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold text-slate-700">Trạng thái</p>
              <select
                value={isActiveFilter}
                onChange={(event) => {
                  setIsActiveFilter(event.target.value as 'all' | 'true' | 'false');
                  setUsersPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              >
                <option value="all">Tất cả</option>
                <option value="true">Đang hoạt động</option>
                <option value="false">Đang bị khóa</option>
              </select>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold text-slate-700">Số dòng / trang</p>
              <select
                value={usersPageSize}
                onChange={(event) => {
                  setUsersPageSize(Number(event.target.value));
                  setUsersPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              >
                {[10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          {usersError && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {usersError}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-2">Tên đăng nhập</th>
                  <th className="border-b border-slate-200 px-3 py-2">Họ tên</th>
                  <th className="border-b border-slate-200 px-3 py-2">Vai trò</th>
                  <th className="border-b border-slate-200 px-3 py-2">Thư điện tử</th>
                  <th className="border-b border-slate-200 px-3 py-2">Trạng thái</th>
                  <th className="border-b border-slate-200 px-3 py-2">Điểm uy tín</th>
                  <th className="border-b border-slate-200 px-3 py-2">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading && (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Đang tải...
                      </span>
                    </td>
                  </tr>
                )}

                {!usersLoading && users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <SearchX className="size-4" />
                        Không có dữ liệu
                      </span>
                    </td>
                  </tr>
                )}

                {!usersLoading && users.map(item => (
                  <tr key={item.id} className="odd:bg-slate-50/50">
                    <td className="border-b border-slate-100 px-3 py-2 font-medium text-slate-800">{item.userName}</td>
                    <td className="border-b border-slate-100 px-3 py-2">{item.fullName}</td>
                    <td className="border-b border-slate-100 px-3 py-2">{getRoleLabel(item.role)}</td>
                    <td className="border-b border-slate-100 px-3 py-2">{item.email || '-'}</td>
                    <td className="border-b border-slate-100 px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {item.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2">
                      {item.reputationPoints}
                      {' '}
                      (
                      {getReputationLabel(item.reputationStatus)}
                      )
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void openUserDetail(item.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="size-3.5" />
                          Chi tiết
                        </button>
                        {item.isActive
                          ? (
                              <button
                                type="button"
                                onClick={() => openBanDialog(item.id, item.fullName || item.userName)}
                                className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                              >
                                <Ban className="size-3.5" />
                                Khóa
                              </button>
                            )
                          : (
                              <button
                                type="button"
                                onClick={() => void handleUnbanUser(item.id)}
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                              >
                                <ShieldCheck className="size-3.5" />
                                Mở khóa
                              </button>
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
              {usersMeta.current_page}
              /
              {usersMeta.total_pages}
              {' '}
              • Tổng
              {' '}
              {usersMeta.total_items}
              {' '}
              người dùng
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => usersCanPrev && setUsersPage(prev => prev - 1)}
                disabled={!usersCanPrev}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
              >
                Trước
              </button>
              {userPageItems.map((pageItem, index) => (
                pageItem === '...'
                  // eslint-disable-next-line react/no-array-index-key
                  ? <span key={`ellipsis-${index}`} className="px-1 text-slate-400">...</span>
                  : (
                      <button
                        key={pageItem}
                        type="button"
                        onClick={() => setUsersPage(pageItem)}
                        className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold ${pageItem === usersMeta.current_page ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                      >
                        {pageItem}
                      </button>
                    )
              ))}
              <button
                type="button"
                onClick={() => usersCanNext && setUsersPage(prev => prev + 1)}
                disabled={!usersCanNext}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        </section>
      </div>

      {banDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Xác nhận khóa tài khoản</h3>
            <p className="mt-1 text-sm text-slate-600">
              Bạn đang khóa tài khoản:
              {' '}
              <span className="font-semibold">{banDialog.userName}</span>
            </p>

            <div className="mt-4">
              <label htmlFor="ban-reason" className="mb-1 block text-xs font-semibold text-slate-700">
                Lý do khóa
              </label>
              <textarea
                id="ban-reason"
                rows={4}
                value={banDialog.reason}
                onChange={(event) => {
                  const nextReason = event.target.value;
                  setBanDialog(prev => (prev ? { ...prev, reason: nextReason } : prev));
                }}
                placeholder="Nhập lý do khóa tài khoản..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeBanDialog}
                disabled={banDialog.submitting}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void confirmBanUser()}
                disabled={banDialog.submitting}
                className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-50"
              >
                {banDialog.submitting && <Loader2 className="size-3.5 animate-spin" />}
                Xác nhận khóa
              </button>
            </div>
          </div>
        </div>
      )}

      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">Chi tiết người dùng</h3>
              <button
                type="button"
                onClick={closeDetailModal}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-5 text-sm text-slate-700">
              {detailLoading && (
                <div className="flex h-40 items-center justify-center text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Đang tải chi tiết...
                  </span>
                </div>
              )}

              {detailError && !detailLoading && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {detailError}
                </div>
              )}

              {!detailLoading && !detailError && selectedUserDetail && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-xl border border-slate-200 p-4">
                    <img
                      src={selectedUserDetail.avatarUrl || getDefaultAvatarUrl(selectedUserDetail.fullName)}
                      alt={selectedUserDetail.fullName || selectedUserDetail.userName}
                      className="size-16 rounded-full border border-slate-200 object-cover"
                    />
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{selectedUserDetail.fullName}</p>
                      <p className="text-sm text-slate-500">{selectedUserDetail.userName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <p>
                      <span className="font-semibold">ID:</span>
                      {' '}
                      {selectedUserDetail.id}
                    </p>
                    <p>
                      <span className="font-semibold">Tên đăng nhập:</span>
                      {' '}
                      {selectedUserDetail.userName}
                    </p>
                    <p>
                      <span className="font-semibold">Họ tên:</span>
                      {' '}
                      {selectedUserDetail.fullName}
                    </p>
                    <p>
                      <span className="font-semibold">Vai trò:</span>
                      {' '}
                      {getRoleLabel(selectedUserDetail.role)}
                    </p>
                    <p>
                      <span className="font-semibold">Trạng thái:</span>
                      {' '}
                      {selectedUserDetail.isActive ? 'Hoạt động' : 'Bị khóa'}
                    </p>
                    <p>
                      <span className="font-semibold">Điểm uy tín:</span>
                      {' '}
                      {selectedUserDetail.reputationPoints}
                    </p>
                    <p>
                      <span className="font-semibold">Mức uy tín:</span>
                      {' '}
                      {getReputationLabel(selectedUserDetail.reputationStatus)}
                    </p>
                    <p>
                      <span className="font-semibold">Tạo lúc:</span>
                      {' '}
                      {formatDateTime(selectedUserDetail.createdAt)}
                    </p>
                    <p>
                      <span className="font-semibold">Cập nhật lúc:</span>
                      {' '}
                      {formatDateTime(selectedUserDetail.updatedAt)}
                    </p>
                    {selectedUserDetail.email && (
                      <p>
                        <span className="font-semibold">Thư điện tử:</span>
                        {' '}
                        {selectedUserDetail.email}
                      </p>
                    )}
                    {selectedUserDetail.phoneNumber && (
                      <p>
                        <span className="font-semibold">Số điện thoại:</span>
                        {' '}
                        {selectedUserDetail.phoneNumber}
                      </p>
                    )}
                    {selectedUserDetail.suspendedUntil && (
                      <p>
                        <span className="font-semibold">Khóa đến:</span>
                        {' '}
                        {formatDateTime(selectedUserDetail.suspendedUntil)}
                      </p>
                    )}
                    {selectedUserDetail.suspensionReason && (
                      <p>
                        <span className="font-semibold">Lý do khóa:</span>
                        {' '}
                        {selectedUserDetail.suspensionReason}
                      </p>
                    )}
                  </div>

                  {selectedUserDetail.memberProfile && (
                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Hồ sơ thành viên</p>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <p>
                          <span className="font-semibold">Đánh giá:</span>
                          {' '}
                          {selectedUserDetail.memberProfile.rating}
                        </p>
                        <p>
                          <span className="font-semibold">Số lượt đánh giá:</span>
                          {' '}
                          {selectedUserDetail.memberProfile.ratingCount}
                        </p>
                        <p>
                          <span className="font-semibold">Bệnh nền:</span>
                          {' '}
                          {selectedUserDetail.memberProfile.hasUnderlyingDisease ? 'Có' : 'Không'}
                        </p>
                        {selectedUserDetail.memberProfile.emergencyContacts.length > 0 && (
                          <p>
                            <span className="font-semibold">Liên hệ khẩn cấp:</span>
                            {' '}
                            {selectedUserDetail.memberProfile.emergencyContacts.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedUserDetail.expertProfile && (
                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Hồ sơ chuyên gia</p>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {selectedUserDetail.expertProfile.biography && (
                          <p>
                            <span className="font-semibold">Giới thiệu:</span>
                            {' '}
                            {selectedUserDetail.expertProfile.biography}
                          </p>
                        )}
                        <p>
                          <span className="font-semibold">Trực tuyến:</span>
                          {' '}
                          {selectedUserDetail.expertProfile.isOnline ? 'Có' : 'Không'}
                        </p>
                        <p>
                          <span className="font-semibold">Phí tư vấn:</span>
                          {' '}
                          {selectedUserDetail.expertProfile.consultationFee}
                        </p>
                        {selectedUserDetail.expertProfile.emergencyConsultationFee !== null && (
                          <p>
                            <span className="font-semibold">Phí tư vấn khẩn:</span>
                            {' '}
                            {selectedUserDetail.expertProfile.emergencyConsultationFee}
                          </p>
                        )}
                        <p>
                          <span className="font-semibold">Đánh giá:</span>
                          {' '}
                          {selectedUserDetail.expertProfile.rating}
                        </p>
                        <p>
                          <span className="font-semibold">Số lượt đánh giá:</span>
                          {' '}
                          {selectedUserDetail.expertProfile.ratingCount}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedUserDetail.rescuerProfile && (
                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Hồ sơ cứu hộ</p>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <p>
                          <span className="font-semibold">Trực tuyến:</span>
                          {' '}
                          {selectedUserDetail.rescuerProfile.isOnline ? 'Có' : 'Không'}
                        </p>
                        <p>
                          <span className="font-semibold">Sẵn sàng:</span>
                          {' '}
                          {selectedUserDetail.rescuerProfile.isAvailable ? 'Có' : 'Không'}
                        </p>
                        <p>
                          <span className="font-semibold">Loại cứu hộ:</span>
                          {' '}
                          {String(selectedUserDetail.rescuerProfile.type)}
                        </p>
                        <p>
                          <span className="font-semibold">Đánh giá:</span>
                          {' '}
                          {selectedUserDetail.rescuerProfile.rating}
                        </p>
                        <p>
                          <span className="font-semibold">Số lượt đánh giá:</span>
                          {' '}
                          {selectedUserDetail.rescuerProfile.ratingCount}
                        </p>
                        <p>
                          <span className="font-semibold">Tổng nhiệm vụ:</span>
                          {' '}
                          {selectedUserDetail.rescuerProfile.totalMissions}
                        </p>
                        <p>
                          <span className="font-semibold">Nhiệm vụ hoàn thành:</span>
                          {' '}
                          {selectedUserDetail.rescuerProfile.completedMissions}
                        </p>
                        {selectedUserDetail.rescuerProfile.lastLocationUpdate && (
                          <p>
                            <span className="font-semibold">Cập nhật vị trí gần nhất:</span>
                            {' '}
                            {formatDateTime(selectedUserDetail.rescuerProfile.lastLocationUpdate)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {selectedUserDetail.isActive
                      ? (
                          <button
                            type="button"
                            onClick={() => openBanDialog(selectedUserDetail.id, selectedUserDetail.fullName || selectedUserDetail.userName)}
                            className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                          >
                            <ShieldX className="size-3.5" />
                            Khóa tài khoản
                          </button>
                        )
                      : (
                          <button
                            type="button"
                            onClick={() => void handleUnbanUser(selectedUserDetail.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            <ShieldCheck className="size-3.5" />
                            Mở khóa tài khoản
                          </button>
                        )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
