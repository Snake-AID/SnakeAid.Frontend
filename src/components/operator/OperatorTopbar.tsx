'use client';

import { Bell, LogOut, Menu } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { clearAuthSession, getStoredUser } from '@/utils/auth-session';

interface OperatorTopbarProps {
  title?: string;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const getOperatorTitleByPath = (pathname: string): string => {
  const normalizedPath = pathname.replace(/^\/[a-z]{2}(?=\/)/, '');

  if (normalizedPath.startsWith('/operator/queue')) {
    return 'Hàng chờ sự cố';
  }

  if (normalizedPath.startsWith('/operator/dispatch-board')) {
    return 'Bảng điều phối';
  }

  if (normalizedPath.startsWith('/operator/communications')) {
    return 'Chat';
  }

  if (normalizedPath.startsWith('/operator/escalations')) {
    return 'Tranh chấp';
  }

  if (normalizedPath.startsWith('/operator/profile')) {
    return 'Hồ sơ điều phối viên';
  }

  return 'Bảng điều phối';
};

export default function OperatorTopbar({ title, sidebarOpen, onToggleSidebar }: OperatorTopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const resolvedTitle = title ?? getOperatorTitleByPath(pathname);

  const operatorEmail = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    return getStoredUser()?.email ?? '';
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-360 items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-700"
              aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              <Menu className="size-5" />
            </button>
          )}
          <h1 className="text-3xl font-bold text-slate-900">{resolvedTitle}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-700">
            <Bell className="size-5" />
          </button>
          <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
            {operatorEmail || 'operator@snakeaid'}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
          >
            <LogOut className="size-4" />
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
