'use client';

import {
  AlertTriangle,
  BookOpen,
  BookOpenText,
  Bot,
  Building2,
  CalendarDays,
  ChevronLeft,
  ClipboardList,
  FlaskConical,
  HandCoins,
  Images,
  LayoutDashboard,
  MessageSquare,
  Shield,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminSidebarProps {
  activeMenu?: string;
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({
  activeMenu,
  open,
  onClose,
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
      id: 'incidents',
      icon: AlertTriangle,
      label: 'Quản lý sự cố',
      href: '/admin/incidents',
      enabled: true,
    },
    {
      id: 'snake-catching-requests',
      icon: ClipboardList,
      label: 'Quản lý yêu cầu bắt rắn',
      href: '/admin/snake-catching-requests',
      enabled: true,
    },
    {
      id: 'consultations',
      icon: MessageSquare,
      label: 'Quản lý phiên tư vấn',
      href: '/admin/consultations',
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
    {
      id: 'transactions',
      icon: HandCoins,
      label: 'Quản lý giao dịch',
      href: '/admin/transactions',
      enabled: true,
    },
    {
      id: 'settings',
      icon: SlidersHorizontal,
      label: 'Quản lý cấu hình động',
      href: '/admin/settings',
      enabled: true,
    },
    {
      id: 'ai-recognition',
      icon: Bot,
      label: 'Quản lý ảnh báo cáo rắn',
      href: '/admin/ai-recognition',
      enabled: true,
    },
    {
      id: 'library-media',
      icon: Images,
      label: 'Quản lý thư viện ảnh',
      href: '/admin/library-media',
      enabled: true,
    },
    {
      id: 'lessons',
      icon: BookOpenText,
      label: 'Quản lý bài học',
      href: '/admin/lessons',
      enabled: true,
    },
    {
      id: 'blogs',
      icon: BookOpen,
      label: 'Quản lý bài viết',
      href: '/admin/blogs',
      enabled: true,
    },
  ];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-blue-500/25 bg-[#213f6b] text-white shadow-lg transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-blue-300/25 px-5 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-100">SnakeAid</p>
            <h2 className="mt-1 text-xl font-bold">Cổng quản trị</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-blue-900/40 p-2 text-blue-100 hover:bg-blue-900/60"
            aria-label="Đóng menu"
          >
            <ChevronLeft className="size-4" />
          </button>
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
    </>
  );
}
