'use client';

import type {
  AnalyticsPeriod,
  CasesAnalytics,
  CommissionAnalytics,
  ProfitAnalytics,
  RecentCatchingRequestItem,
  RecentIncidentItem,
  RevenueAnalytics,
  UsersAnalytics,
} from '@/types/analytics.type';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bug,
  Download,
  RefreshCcw,
  ShieldAlert,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import * as XLSX from 'xlsx';
import { analyticsApi } from '@/apis/analytics.api';
import { useToast } from '@/components/ToastProvider';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatVND(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return `${value.toLocaleString('vi-VN')}`;
}

function formatVNDFull(value: number): string {
  return `${value.toLocaleString('vi-VN')} ₫`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function dateToLocalString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultDates(period: AnalyticsPeriod): { from: string; to: string } {
  const now = new Date();

  if (period === 'day') {
    // Ngày hôm nay
    const today = dateToLocalString(now);
    return { from: today, to: today };
  }

  if (period === 'month') {
    // Ngày 1 của tháng này
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    // Ngày cuối cùng của tháng này
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      from: dateToLocalString(from),
      to: dateToLocalString(to),
    };
  }

  // period === 'year'
  // Ngày 1/1 của năm này
  const from = new Date(now.getFullYear(), 0, 1);
  // Ngày 31/12 của năm này
  const to = new Date(now.getFullYear(), 11, 31);
  return {
    from: dateToLocalString(from),
    to: dateToLocalString(to),
  };
}

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  day: 'Theo ngày',
  month: 'Theo tháng',
  year: 'Theo năm',
};

const INCIDENT_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  Pending: { label: 'Chờ xử lý', cls: 'bg-amber-100 text-amber-700' },
  Assigned: { label: 'Đã giao', cls: 'bg-blue-100 text-blue-700' },
  InProgress: { label: 'Đang xử lý', cls: 'bg-indigo-100 text-indigo-700' },
  Finished: { label: 'Hoàn thành', cls: 'bg-emerald-100 text-emerald-700' },
  Cancelled: { label: 'Đã hủy', cls: 'bg-slate-100 text-slate-600' },
  Completed: { label: 'Đã hoàn thành', cls: 'bg-emerald-100 text-emerald-700' },
};

const CATCHING_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  Pending: { label: 'Chờ xử lý', cls: 'bg-amber-100 text-amber-700' },
  Accepted: { label: 'Đã nhận', cls: 'bg-blue-100 text-blue-700' },
  InProgress: { label: 'Đang bắt', cls: 'bg-indigo-100 text-indigo-700' },
  Completed: { label: 'Hoàn thành', cls: 'bg-emerald-100 text-emerald-700' },
  Cancelled: { label: 'Đã hủy', cls: 'bg-slate-100 text-slate-600' },
};

// ─── Excel export ─────────────────────────────────────────────────────────────

function exportToExcel(
  revenueData: RevenueAnalytics | null,
  profitData: ProfitAnalytics | null,
  commissionData: CommissionAnalytics | null,
  usersData: UsersAnalytics | null,
  casesData: CasesAnalytics | null,
) {
  const wb = XLSX.utils.book_new();

  if (revenueData) {
    const rows = [
      ['Kỳ', 'Tổng doanh thu (₫)', 'Tư vấn (₫)', 'Bắt rắn (₫)', 'Cứu hộ (₫)'],
      ...revenueData.timeline.map(r => [r.label, r.total, r.consultation, r.catching, r.snakebite]),
      [],
      ['Tổng cộng', revenueData.total, revenueData.byFlow.consultation, revenueData.byFlow.catching, revenueData.byFlow.snakebite],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Doanh thu');
  }

  if (profitData) {
    const rows = [
      ['Kỳ', 'Tổng lợi nhuận (₫)', 'Tư vấn (₫)', 'Bắt rắn (₫)', 'Cứu hộ (₫)'],
      ...profitData.timeline.map(r => [r.label, r.totalProfit, r.consultation, r.catching, r.snakebite]),
      [],
      ['Tổng cộng', profitData.totalProfit, profitData.byFlow.consultation, profitData.byFlow.catching, profitData.byFlow.snakebite],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Lợi nhuận');
  }

  if (commissionData) {
    const rows = [
      ['Kỳ', 'Doanh thu tư vấn (₫)', 'Chi trả Expert (₫)', 'Hoàn tiền (₫)', 'Hoa hồng (₫)'],
      ...commissionData.timeline.map(r => [r.label, r.revenue, r.expertPayout, r.refund, r.commission]),
      [],
      ['Tổng hoa hồng', '', '', '', commissionData.totalCommission],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Hoa hồng');
  }

  if (usersData) {
    const rows = [
      ['Kỳ', 'Tổng người dùng'],
      ...usersData.timeline.map(r => [r.label, r.totalUsers]),
      [],
      ['Tổng tích lũy', usersData.totalUsers],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Người dùng');
  }

  if (casesData) {
    const rows = [
      ['Kỳ', 'Tổng ca', 'Ca rắn cắn', 'Ca bắt rắn'],
      ...casesData.timeline.map(r => [r.label, r.totalCases, r.snakebiteCases, r.snakeCatchingCases]),
      [],
      ['Tổng cộng', casesData.totalCases, casesData.snakebiteCases, casesData.snakeCatchingCases],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Tổng ca');
  }

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `SnakeAid_Dashboard_${today}.xlsx`);
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  loading,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: number;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-3 ${iconBg}`}>
          <Icon className={`size-5 ${iconColor}`} />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {trend >= 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
            {Math.abs(trend)}
            %
          </span>
        )}
      </div>
      {loading
        ? (
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              <div className="h-8 w-16 animate-pulse rounded bg-slate-100" />
            </div>
          )
        : (
            <div>
              <p className="text-sm font-medium text-gray-500">{title}</p>
              <h3 className="mt-1 text-3xl font-bold text-gray-800">{value}</h3>
              {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
            </div>
          )}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm ${className}`}>
      <div className="border-b border-gray-100 px-6 py-4">
        <h3 className="text-base font-bold text-gray-800">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
      </div>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}

function VNDTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) {
    return null;
  }
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg">
      <p className="mb-2 text-xs font-bold text-slate-600">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500">
            {p.name}
            :
          </span>
          <span className="font-semibold text-slate-800">{formatVNDFull(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function CountTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) {
    return null;
  }
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg">
      <p className="mb-2 text-xs font-bold text-slate-600">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500">
            {p.name}
            :
          </span>
          <span className="font-semibold text-slate-800">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function PeriodSelector({ value, onChange }: { value: AnalyticsPeriod; onChange: (p: AnalyticsPeriod) => void }) {
  const periods: AnalyticsPeriod[] = ['day', 'month', 'year'];
  return (
    <div className="flex overflow-hidden rounded-lg border border-slate-200">
      {periods.map((p, i) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`px-3 py-1.5 text-xs font-semibold transition ${
            value === p ? 'bg-blue-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          } ${i > 0 ? 'border-l border-slate-200' : ''}`}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { showToast } = useToast();
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [users, setUsers] = useState<UsersAnalytics | null>(null);
  const [cases, setCases] = useState<CasesAnalytics | null>(null);
  const [revenue, setRevenue] = useState<RevenueAnalytics | null>(null);
  const [commission, setCommission] = useState<CommissionAnalytics | null>(null);
  const [profit, setProfit] = useState<ProfitAnalytics | null>(null);
  const [incidents, setIncidents] = useState<RecentIncidentItem[]>([]);
  const [catchingRequests, setCatchingRequests] = useState<RecentCatchingRequestItem[]>([]);

  const [dateFrom, setDateFrom] = useState(() => getDefaultDates('month').from);
  const [dateTo, setDateTo] = useState(() => getDefaultDates('month').to);

  const handlePeriodChange = (p: AnalyticsPeriod) => {
    const defaults = getDefaultDates(p);
    setDateFrom(defaults.from);
    setDateTo(defaults.to);
    setPeriod(p);
  };

  const loadAll = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    const params = { period, from: dateFrom, to: dateTo };

    const results = await Promise.allSettled([
      analyticsApi.getUsers(params),
      analyticsApi.getCases(params),
      analyticsApi.getRevenue(params),
      analyticsApi.getCommission(params),
      analyticsApi.getProfit(params),
      analyticsApi.getRecentIncidents(),
      analyticsApi.getRecentCatchingRequests(),
    ]);

    const [usersRes, casesRes, revenueRes, commissionRes, profitRes, incidentsRes, catchingRes] = results;

    if (usersRes.status === 'fulfilled') {
      setUsers(usersRes.value);
    }
    if (casesRes.status === 'fulfilled') {
      setCases(casesRes.value);
    }
    if (revenueRes.status === 'fulfilled') {
      setRevenue(revenueRes.value);
    }
    if (commissionRes.status === 'fulfilled') {
      setCommission(commissionRes.value);
    }
    if (profitRes.status === 'fulfilled') {
      setProfit(profitRes.value);
    }
    if (incidentsRes.status === 'fulfilled') {
      const d = incidentsRes.value;
      setIncidents((Array.isArray(d) ? d : ((d as { items: RecentIncidentItem[] }).items ?? [])).slice(0, 8));
    }
    if (catchingRes.status === 'fulfilled') {
      setCatchingRequests((Array.isArray(catchingRes.value) ? catchingRes.value : []).slice(0, 8));
    }

    const failCount = results.filter(r => r.status === 'rejected').length;
    if (failCount > 0 && failCount < results.length) {
      showToast(`${failCount} nguồn dữ liệu không tải được.`, { type: 'warning' });
    } else if (failCount === results.length) {
      showToast('Không thể tải dữ liệu dashboard.', { type: 'error' });
    }

    setIsLoading(false);
    setIsRefreshing(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, dateFrom, dateTo]);

  useEffect(() => {
    void loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, dateFrom, dateTo]);

  const handleExport = () => {
    exportToExcel(revenue, profit, commission, users, cases);
    showToast('Đã xuất file báo cáo Excel!', { type: 'success' });
  };

  const userTrend = useMemo(() => {
    if (!users?.timeline || users.timeline.length < 2) {
      return undefined;
    }
    const mid = Math.floor(users.timeline.length / 2);
    const first = users.timeline.slice(0, mid).reduce((s, p) => s + p.totalUsers, 0);
    const second = users.timeline.slice(mid).reduce((s, p) => s + p.totalUsers, 0);
    if (!first) {
      return undefined;
    }
    return Math.round(((second - first) / first) * 100);
  }, [users]);

  const caseTrend = useMemo(() => {
    if (!cases?.timeline || cases.timeline.length < 2) {
      return undefined;
    }
    const mid = Math.floor(cases.timeline.length / 2);
    const first = cases.timeline.slice(0, mid).reduce((s, p) => s + p.totalCases, 0);
    const second = cases.timeline.slice(mid).reduce((s, p) => s + p.totalCases, 0);
    if (!first) {
      return undefined;
    }
    return Math.round(((second - first) / first) * 100);
  }, [cases]);

  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-gray-50/50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-400 flex-col gap-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Bảng điều khiển</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Dữ liệu từ
              {' '}
              {formatDate(dateFrom)}
              {' '}
              đến
              {' '}
              {formatDate(dateTo)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PeriodSelector value={period} onChange={handlePeriodChange} />
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={dateFrom}
                max={dateTo}
                onChange={e => setDateFrom(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-xs text-slate-400">—</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => setDateTo(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              type="button"
              onClick={() => void loadAll(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCcw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={!revenue && !users}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Download className="size-3.5" />
              Xuất Excel
            </button>
          </div>
        </div>

        {/* ── KPI cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Tổng người dùng"
            value={users?.totalUsers.toLocaleString() ?? '—'}
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            trend={userTrend}
            loading={isLoading}
          />
          <StatCard
            title="Tổng ca xử lý"
            value={cases?.totalCases.toLocaleString() ?? '—'}
            subtitle={cases ? `${cases.snakebiteCases} rắn cắn · ${cases.snakeCatchingCases} bắt rắn` : undefined}
            icon={Activity}
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
            trend={caseTrend}
            loading={isLoading}
          />
          <StatCard
            title="Doanh thu"
            value={revenue ? formatVND(revenue.total) : '—'}
            subtitle="tổng kỳ được chọn"
            icon={Wallet}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            loading={isLoading}
          />
          <StatCard
            title="Lợi nhuận"
            value={profit ? formatVND(profit.totalProfit) : '—'}
            subtitle={commission ? `Hoa hồng: ${formatVND(commission.totalCommission)}` : 'tổng kỳ được chọn'}
            icon={TrendingUp}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            loading={isLoading}
          />
        </div>

        {/* ── Revenue + Cases charts ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Doanh thu theo kỳ" subtitle="Tư vấn · Bắt rắn · Cứu hộ">
            {isLoading || !revenue
              ? <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
              : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={revenue.timeline} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v: number) => formatVND(v)} tick={{ fontSize: 11 }} width={60} />
                      <Tooltip content={<VNDTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="consultation" name="Tư vấn" stroke="#6366f1" fill="url(#gc)" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="catching" name="Bắt rắn" stroke="#f97316" fill="url(#gk)" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="snakebite" name="Cứu hộ" stroke="#ef4444" fill="url(#gs)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
          </ChartCard>

          <ChartCard title="Tổng ca xử lý theo kỳ" subtitle="Ca rắn cắn &amp; bắt rắn">
            {isLoading || !cases
              ? <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
              : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={cases.timeline} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip content={<CountTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="snakebiteCases" name="Rắn cắn" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="snakeCatchingCases" name="Bắt rắn" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
          </ChartCard>
        </div>

        {/* ── Profit + Commission charts ──────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Lợi nhuận theo kỳ" subtitle="Phân theo luồng nghiệp vụ">
            {isLoading || !profit
              ? <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
              : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={profit.timeline} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v: number) => formatVND(v)} tick={{ fontSize: 11 }} width={60} />
                      <Tooltip content={<VNDTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="consultation" name="Tư vấn" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="catching" name="Bắt rắn" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="snakebite" name="Cứu hộ" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
          </ChartCard>

          <ChartCard title="Hoa hồng chuyên gia" subtitle="Doanh thu tư vấn − Chi Expert − Hoa hồng">
            {isLoading || !commission
              ? <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
              : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={commission.timeline} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v: number) => formatVND(v)} tick={{ fontSize: 11 }} width={60} />
                      <Tooltip content={<VNDTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="revenue" name="Doanh thu TV" stroke="#6366f1" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="expertPayout" name="Chi Expert" stroke="#f97316" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                      <Line type="monotone" dataKey="commission" name="Hoa hồng" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
          </ChartCard>
        </div>

        {/* ── Users timeline ──────────────────────────────────────────────── */}
        <ChartCard title="Người dùng đăng ký" subtitle="Số lượng tích lũy theo kỳ">
          {isLoading || !users
            ? <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
            : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={users.timeline} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<CountTooltip />} />
                    <Area type="monotone" dataKey="totalUsers" name="Người dùng" stroke="#3b82f6" fill="url(#gu)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
        </ChartCard>

        {/* ── Recent activities ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 pb-6 lg:grid-cols-2">

          {/* Recent Incidents */}
          <div className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-rose-600" />
                <h3 className="text-sm font-bold text-gray-800">Ca rắn cắn gần đây</h3>
              </div>
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                {incidents.length}
                {' '}
                ca
              </span>
            </div>
            <div>
              {isLoading
                ? (
                    <div className="space-y-3 p-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
                      ))}
                    </div>
                  )
                : incidents.length === 0
                  ? (
                      <div className="flex items-center justify-center py-10 text-sm text-slate-400">
                        Không có dữ liệu
                      </div>
                    )
                  : incidents.map((incident) => {
                      const s = INCIDENT_STATUS_MAP[incident.status] ?? { label: incident.status, cls: 'bg-slate-100 text-slate-600' };
                      return (
                        <div key={incident.id} className="flex items-start gap-3 border-b border-slate-50 px-5 py-3 last:border-b-0">
                          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-50">
                            <AlertTriangle className="size-3.5 text-rose-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-800" title={incident.address}>{incident.address}</p>
                            <p className="mt-0.5 text-xs text-slate-400">{formatTime(incident.createdAt)}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.cls}`}>{s.label}</span>
                        </div>
                      );
                    })}
            </div>
          </div>

          {/* Recent Catching Requests */}
          <div className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Bug className="size-4 text-orange-600" />
                <h3 className="text-sm font-bold text-gray-800">Yêu cầu bắt rắn gần đây</h3>
              </div>
              <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">
                {catchingRequests.length}
                {' '}
                yêu cầu
              </span>
            </div>
            <div>
              {isLoading
                ? (
                    <div className="space-y-3 p-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
                      ))}
                    </div>
                  )
                : catchingRequests.length === 0
                  ? (
                      <div className="flex items-center justify-center py-10 text-sm text-slate-400">
                        Không có dữ liệu
                      </div>
                    )
                  : catchingRequests.map((req) => {
                      const s = CATCHING_STATUS_MAP[req.status] ?? { label: req.status, cls: 'bg-slate-100 text-slate-600' };
                      const snakeName = req.details[0]?.snakeSpeciesName ?? 'Chưa xác định';
                      return (
                        <div key={req.id} className="flex items-start gap-3 border-b border-slate-50 px-5 py-3 last:border-b-0">
                          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-orange-50">
                            <Bug className="size-3.5 text-orange-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-800">{snakeName}</p>
                            <p className="mt-0.5 truncate text-xs text-slate-400">
                              {req.user?.account.fullName ?? 'N/A'}
                              {' · '}
                              {formatTime(req.requestDate)}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.cls}`}>{s.label}</span>
                        </div>
                      );
                    })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
