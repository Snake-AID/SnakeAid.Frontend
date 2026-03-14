'use client';

import {
  AlertTriangle,
  Ambulance,
  HelpCircle,
  Map,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';

// Mock data
const mockStats = {
  totalUsers: 1234,
  userGrowth: '+12%',
  todayRescues: 15,
  activeRescues: 8,
  monthlyRevenue: '125.5M',
  revenueGrowth: '+5%',
  systemAlerts: 3,
};

const mockIncidents = [
  {
    id: 1,
    name: 'Rắn hổ mang',
    location: 'Q.7, TP.HCM',
    time: '5p trước',
    status: 'searching',
    statusLabel: 'Đang tìm kiếm',
    iconBg: 'bg-red-100 group-hover:bg-red-200',
    iconColor: 'text-red-600',
    IconComponent: AlertTriangle,
  },
  {
    id: 2,
    name: 'Rắn lục',
    location: 'Q.1, TP.HCM',
    time: '15p trước',
    status: 'moving',
    statusLabel: 'Đang di chuyển',
    iconBg: 'bg-orange-100 group-hover:bg-orange-200',
    iconColor: 'text-orange-600',
    IconComponent: Truck,
  },
  {
    id: 3,
    name: 'Rắn lạ (Chưa rõ)',
    location: 'Đồng Nai',
    time: '30p trước',
    status: 'pending',
    statusLabel: 'Chờ xác nhận',
    iconBg: 'bg-gray-100 group-hover:bg-gray-200',
    iconColor: 'text-gray-600',
    IconComponent: HelpCircle,
  },
];

const mockChartData = [
  { day: 'T2', value: 8, height: '40%' },
  { day: 'T3', value: 12, height: '60%' },
  { day: 'T4', value: 6, height: '30%' },
  { day: 'T5', value: 17, height: '85%', active: true },
  { day: 'T6', value: 11, height: '55%' },
  { day: 'T7', value: 14, height: '70%' },
  { day: 'CN', value: 15, height: '75%' },
];

const mockSnakeTypes = [
  { type: 'Có độc', percent: 35, color: 'bg-red-500' },
  { type: 'Không độc', percent: 50, color: 'bg-green-500' },
  { type: 'Không xác định', percent: 15, color: 'bg-slate-400' },
];

export default function AdminDashboard() {
  return (
    <main className="h-[calc(100vh-81px)] overflow-y-auto bg-gray-50/50 p-6 lg:p-8">
      <div className="mx-auto flex max-w-400 flex-col gap-8">
        <div>
          <h2 className="text-3xl leading-tight font-bold text-gray-800">Dashboard tổng quan</h2>
          <p className="mt-1 text-sm text-gray-500">Chào mừng trở lại, Admin</p>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {/* Total Users */}
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                <Users className="size-6" />
              </div>
              <span className="flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-600">
                <TrendingUp className="mr-1 size-3" />
                {mockStats.userGrowth}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Tổng người dùng</p>
              <h3 className="mt-1 text-3xl font-bold text-gray-800">
                {mockStats.totalUsers.toLocaleString()}
              </h3>
            </div>
          </div>

          {/* Today Rescues */}
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="rounded-full bg-orange-50 p-3 text-orange-600">
                <Ambulance className="size-6" />
              </div>
              <span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-bold text-orange-600">
                {mockStats.activeRescues}
                {' '}
                đang xử lý
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Ca cứu hộ hôm nay</p>
              <h3 className="mt-1 text-3xl font-bold text-gray-800">
                {mockStats.todayRescues}
              </h3>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="rounded-full bg-green-50 p-3 text-green-600">
                <Wallet className="size-6" />
              </div>
              <span className="flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-600">
                <TrendingUp className="mr-1 size-3" />
                {mockStats.revenueGrowth}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Doanh thu tháng</p>
              <h3 className="mt-1 text-3xl font-bold text-gray-800">
                {mockStats.monthlyRevenue}
                {' '}
                <span className="text-base font-normal text-gray-400">VNĐ</span>
              </h3>
            </div>
          </div>

          {/* System Alerts */}
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="rounded-full bg-red-50 p-3 text-red-600">
                <AlertTriangle className="size-6" />
              </div>
              <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-600">
                Nguy cấp
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Cảnh báo hệ thống</p>
              <h3 className="mt-1 text-3xl font-bold text-gray-800">
                {mockStats.systemAlerts}
              </h3>
            </div>
          </div>
        </div>

        {/* Map and Recent Incidents */}
        <div className="grid grid-cols-12 gap-6">
          {/* Map */}
          <div className="col-span-12 flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:col-span-7 xl:col-span-8">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
                <Map className="size-5 text-green-600" />
                Bản đồ hoạt động
              </h3>
              <div className="flex gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
                  <span className="size-2 animate-pulse rounded-full bg-red-500"></span>
                  {' '}
                  Đang
                  hoạt động
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-2 py-1 text-xs font-medium text-orange-600">
                  <span className="size-2 rounded-full bg-orange-500"></span>
                  {' '}
                  Chờ xử lý
                </span>
              </div>
            </div>
            <div className="relative min-h-100 flex-1 bg-linear-to-br from-blue-50 to-blue-100">
              {/* Simple Vietnam map representation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-96 w-64 opacity-20">
                  <svg viewBox="0 0 100 200" className="h-full w-full fill-blue-300">
                    <path d="M50,10 Q45,30 50,50 L48,80 Q45,100 50,120 L52,150 Q55,170 50,190 L40,185 Q35,170 38,150 L36,120 Q33,100 38,80 L40,50 Q35,30 40,10 Z" />
                  </svg>
                </div>
              </div>

              {/* Location markers */}
              <div className="group absolute top-[75%] left-[45%] flex cursor-pointer flex-col items-center">
                <div className="relative flex size-8 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex size-4 rounded-full border-2 border-white bg-red-600"></span>
                </div>
                <div className="mt-1 rounded bg-white px-2 py-1 text-xs font-bold text-gray-700 opacity-0 shadow transition-opacity group-hover:opacity-100">
                  TP.HCM (5)
                </div>
              </div>

              <div className="group absolute top-[25%] left-[40%] flex cursor-pointer flex-col items-center">
                <div className="relative flex size-8 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex size-4 rounded-full border-2 border-white bg-red-600"></span>
                </div>
                <div className="mt-1 rounded bg-white px-2 py-1 text-xs font-bold text-gray-700 opacity-0 shadow transition-opacity group-hover:opacity-100">
                  Hà Nội (2)
                </div>
              </div>

              <div className="group absolute top-[72%] left-[48%] flex cursor-pointer flex-col items-center">
                <div className="relative flex size-6 items-center justify-center">
                  <span className="relative inline-flex size-3 rounded-full border-2 border-white bg-orange-500"></span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Incidents */}
          <div className="col-span-12 flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm lg:col-span-5 xl:col-span-4">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <h3 className="text-lg font-bold text-gray-800">Sự cố mới nhất</h3>
              <button className="text-sm font-semibold text-[#007BFF] hover:text-[#0056b3]">
                Xem tất cả
              </button>
            </div>
            <div className="flex flex-col gap-4 p-4">
              {mockIncidents.map((incident) => {
                const IconComp = incident.IconComponent;
                return (
                  <div
                    key={incident.id}
                    className="group flex cursor-pointer items-start gap-4 rounded-xl p-3 transition-colors hover:bg-gray-50"
                  >
                    <div
                      className={`size-12 rounded-full ${incident.iconBg} flex items-center justify-center ${incident.iconColor} shrink-0 transition-colors`}
                    >
                      <IconComp className="size-5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <h4 className="truncate font-bold text-gray-800">{incident.name}</h4>
                        <span className="text-xs font-medium text-gray-500">
                          {incident.time}
                        </span>
                      </div>
                      <p className="mb-2 truncate text-sm text-gray-500">{incident.location}</p>
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                          incident.status === 'searching'
                            ? 'bg-blue-100 text-blue-700'
                            : incident.status === 'moving'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {incident.statusLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart and Pie Chart */}
        <div className="grid grid-cols-1 gap-6 pb-6 lg:grid-cols-3">
          {/* Bar Chart */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">
                Thống kê ca cứu hộ (7 ngày)
              </h3>
              <button className="rounded-full bg-gray-50 p-2 text-gray-500 hover:bg-gray-100">
                <span>⋯</span>
              </button>
            </div>
            <div className="flex h-48 items-end justify-between gap-2 px-2 sm:gap-4">
              {mockChartData.map(data => (
                <div key={data.day} className="relative w-full">
                  <div
                    className={`w-full ${
                      data.active
                        ? 'bg-[#007BFF] shadow-lg shadow-blue-200'
                        : 'bg-blue-50 hover:bg-blue-100'
                    } group relative cursor-pointer rounded-t-lg transition-all`}
                    style={{ height: data.height }}
                  >
                    <div
                      className={`absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-gray-800 px-2 py-1 text-xs text-white ${
                        data.active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      } transition-opacity`}
                    >
                      {data.value}
                    </div>
                  </div>
                  <p
                    className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs ${
                      data.active ? 'font-bold text-gray-800' : 'text-gray-500'
                    }`}
                  >
                    {data.day}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 w-full self-start text-lg font-bold text-gray-800">
              Tỷ lệ loại rắn
            </h3>
            <div className="relative mb-4 size-48 rounded-full bg-linear-to-br from-red-500 via-green-500 to-slate-400">
              <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
                <span className="text-3xl font-bold text-gray-800">120</span>
                <span className="text-xs tracking-wide text-gray-500 uppercase">Tổng mẫu</span>
              </div>
            </div>
            <div className="mt-2 flex w-full flex-col gap-2">
              {mockSnakeTypes.map(snake => (
                <div key={snake.type} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`size-3 rounded-full ${snake.color}`}></span>
                    <span className="text-gray-600">{snake.type}</span>
                  </div>
                  <span className="font-bold text-gray-800">
                    {snake.percent}
                    %
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
