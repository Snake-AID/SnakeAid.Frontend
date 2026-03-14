'use client';

import { Activity, Bell, ClipboardList, Map, MessageSquare, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', href: '/operator/dashboard', icon: Activity, enabled: true },
  { id: 'queue', label: 'Incident Queue', href: '/operator/queue', icon: ClipboardList, enabled: true },
  { id: 'dispatch', label: 'Dispatch Board', href: '/operator/dispatch-board', icon: Map, enabled: true },
  { id: 'communications', label: 'Communications', href: '/operator/communications', icon: MessageSquare, enabled: true },
  { id: 'alerts', label: 'Escalations', href: '/operator/escalations', icon: Bell, enabled: true },
  { id: 'profile', label: 'Profile', href: '/operator/profile', icon: User, enabled: true },
];

export default function OperatorSidebar() {
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/^\/[a-z]{2}(?=\/)/, '');

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-teal-800/30 bg-linear-to-b from-teal-900 to-teal-800 text-white lg:block">
      <div className="border-b border-teal-700/40 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-200">SnakeAid</p>
        <h2 className="mt-1 text-xl font-bold">Operator Portal</h2>
      </div>

      <nav className="space-y-1 p-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.enabled && (normalizedPath === item.href || normalizedPath.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
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
  );
}
