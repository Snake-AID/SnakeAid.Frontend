'use client';

import {
  Building2,
  CalendarDays,
  FlaskConical,
  LayoutDashboard,
  Shield,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminSidebarProps {
  activeMenu?: string;
}

export default function AdminSidebar({
  activeMenu,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/^\/[a-z]{2}(?=\/)/, '');

  const menuItems = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      label: 'Bảng điều khiển',
      href: '/admin/dashboard',
      enabled: true,
    },
    {
      id: 'workshifts',
      icon: CalendarDays,
      label: 'Quản lý lịch làm việc',
      href: '/admin/workshifts',
      enabled: true,
    },
    {
      id: 'users',
      icon: Users,
      label: 'Quản lý người dùng',
      href: '/admin/users',
      enabled: true,
    },
    {
      id: 'snakes',
      icon: Shield,
      label: 'Quản lý loài rắn',
      href: '/admin/snakes',
      enabled: true,
    },
    {
      id: 'antivenoms',
      icon: FlaskConical,
      label: 'Quản lý huyết thanh',
      href: '/admin/antivenoms',
      enabled: true,
    },
    {
      id: 'treatment-facilities',
      icon: Building2,
      label: 'Quản lý cơ sở điều trị',
      href: '/admin/treatment-facilities',
      enabled: true,
    },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-blue-500/25 bg-[#213f6b] text-white lg:block">
      <div className="border-b border-blue-300/25 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-100">SnakeAid</p>
        <h2 className="mt-1 text-xl font-bold">Cổng quản trị</h2>
      </div>

      <nav className="space-y-1 p-3">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isDashboardPath = normalizedPath === '/admin' || normalizedPath === '/admin/dashboard';
          const isActiveByPath = item.id === 'dashboard'
            ? isDashboardPath
            : normalizedPath === item.href || normalizedPath.startsWith(`${item.href}/`);
          const isActiveByProp = activeMenu ? activeMenu === item.id : false;
          const isActive = item.enabled && (isActiveByProp || isActiveByPath);

          if (!item.enabled) {
            return (
              <div
                key={item.id}
                className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2.5 text-blue-100/70"
              >
                <div className="flex items-center gap-2.5">
                  <IconComponent className="size-4.5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className="rounded-full border border-blue-200/30 px-2 py-0.5 text-[10px]">Sắp có</span>
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-blue-800'
                  : 'text-blue-100 hover:bg-blue-500/30 hover:text-white'
              }`}
            >
              <IconComponent className="size-4.5" strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
