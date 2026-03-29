'use client';

import { Bell, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { clearAuthSession, getStoredUser } from '@/utils/auth-session';

export default function AdminTopbar() {
  const router = useRouter();

  const adminEmail = useMemo(() => {
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
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Cổng quản trị</p>
          <h1 className="text-2xl font-bold text-slate-900">Bảng điều khiển</h1>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-700">
            <Bell className="size-5" />
          </button>
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            {adminEmail || 'admin@snakeaid'}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg bg-[#305b9c] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1f395f]"
          >
            <LogOut className="size-4" />
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
