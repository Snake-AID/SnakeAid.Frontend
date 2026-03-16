'use client';

import { Activity, Bell, ChevronLeft, ClipboardList, Map, MessageSquare, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { id: 'dashboard', label: 'Tổng quan', href: '/operator/dashboard', icon: Activity, enabled: true },
  { id: 'queue', label: 'Hàng chờ sự cố', href: '/operator/queue', icon: ClipboardList, enabled: true },
  { id: 'dispatch', label: 'Bảng điều phối', href: '/operator/dispatch-board', icon: Map, enabled: true },
  { id: 'communications', label: 'Chat', href: '/operator/communications', icon: MessageSquare, enabled: true },
  { id: 'alerts', label: 'Tranh chấp', href: '/operator/escalations', icon: Bell, enabled: true },
  { id: 'profile', label: 'Hồ sơ', href: '/operator/profile', icon: User, enabled: true },
];

interface OperatorSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function OperatorSidebar({ open, onClose }: OperatorSidebarProps) {
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/^\/[a-z]{2}(?=\/)/, '');

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
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-linear-to-b from-teal-900 to-teal-800 text-white shadow-lg transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-200">SnakeAid</p>
            <h2 className="text-lg font-bold">Cổng điều phối</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-teal-900/60 p-2 text-teal-100 hover:bg-teal-900/80"
            aria-label="Đóng menu"
          >
            <ChevronLeft className="size-4" />
          </button>
        </div>

        <nav className="space-y-1 px-3 py-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.enabled && (normalizedPath === item.href || normalizedPath.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-teal-900'
                    : 'text-teal-100 hover:bg-teal-700/40 hover:text-white'
                }`}
              >
                <Icon className="size-4.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
