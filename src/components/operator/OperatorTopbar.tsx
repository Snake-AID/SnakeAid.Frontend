'use client';

import { Bell, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { clearAuthSession, getStoredUser } from '@/utils/auth-session';

interface OperatorTopbarProps {
  title?: string;
  subtitle?: string;
}

export default function OperatorTopbar({
  title = 'Dispatch Dashboard',
  subtitle = 'Operator Portal',
}: OperatorTopbarProps) {
  const router = useRouter();

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
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{subtitle}</p>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
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
