'use client';

import {
  Building2,
  DollarSign,
  LayoutDashboard,
  Settings,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdminSidebarProps {
  activeMenu?: string;
  adminEmail?: string;
  onLogout?: () => void;
};

export default function AdminSidebar({
  activeMenu = 'dashboard',
  adminEmail = '',
  onLogout,
}: AdminSidebarProps) {
  const router = useRouter();

  const menuItems = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      href: '/admin',
    },
    { id: 'users', icon: Users, label: 'Quản lý người dùng', href: '/admin/users' },
    { id: 'approvals', icon: UserCheck, label: 'Phê duyệt tài khoản', href: '/admin/approvals' },
    { id: 'snakes', icon: Shield, label: 'Cơ sở dữ liệu loài rắn', href: '/admin/snakes' },
    {
      id: 'hospitals',
      icon: Building2,
      label: 'Quản lý bệnh viện',
      href: '/admin/hospitals',
    },
    { id: 'finance', icon: DollarSign, label: 'Tài chính', href: '/admin/finance' },
    {
      id: 'reports',
      icon: TrendingUp,
      label: 'Báo cáo & Phân tích',
      href: '/admin/reports',
    },
    { id: 'settings', icon: Settings, label: 'Cài đặt hệ thống', href: '/admin/settings' },
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <aside className="relative z-20 flex h-full w-64 shrink-0 flex-col justify-between bg-linear-to-b from-green-700 via-green-800 to-green-900 shadow-2xl transition-all duration-300">
      <div className="flex h-full flex-col">
        {/* Logo Section */}
        <div className="border-b border-green-600/30 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg">
              <img
                src="/assets/images/logo/SnakeAidLogo.png"
                alt="SnakeAid Logo"
                className="size-full object-contain p-1"
                onError={(e) => {
                  // Fallback to emoji if image not found
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML
                    = '<span class="text-2xl">🏥</span>';
                }}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide text-white">SnakeAid</h1>
              <p className="text-xs font-medium uppercase tracking-wider text-green-200">
                Admin Portal
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-4">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigation(item.href)}
                className={`group flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all ${
                  activeMenu === item.id
                    ? 'bg-white text-green-700 shadow-lg'
                    : 'text-green-50 hover:bg-green-600/30 hover:text-white'
                }`}
              >
                <IconComponent className="size-5" strokeWidth={2} />
                <span
                  className={`text-sm ${activeMenu === item.id ? 'font-bold' : 'font-medium'}`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-green-600/30 bg-green-900/50 p-4">
          <div className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-green-600/30">
            <div className="flex size-11 items-center justify-center rounded-full border-2 border-green-400/40 bg-linear-to-br from-green-400 to-green-600 font-bold text-white shadow-md transition-all group-hover:border-white group-hover:shadow-lg">
              {adminEmail ? adminEmail.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">Admin User</p>
              <p className="truncate text-xs text-green-200">{adminEmail || 'admin'}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="ml-auto rounded-full p-1.5 text-green-300 transition-colors hover:bg-red-500/20 hover:text-red-300"
              title="Đăng xuất"
            >
              <svg
                className="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
