'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';
import RoleRouteGuard from '@/components/auth/RoleRouteGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  useEffect(() => {
    const initSidebar = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
        setIsSidebarVisible(false);
      }
    };
    initSidebar();
  }, []);

  const openSidebar = () => {
    setIsSidebarVisible(true);
    requestAnimationFrame(() => setIsSidebarOpen(true));
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    window.setTimeout(() => setIsSidebarVisible(false), 200);
  };

  const toggleSidebar = () => {
    if (isSidebarOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  };

  return (
    <RoleRouteGuard allowedRole="Admin">
      <div className={`flex min-h-screen bg-slate-50 transition-[padding-left] duration-200 ${isSidebarOpen ? 'lg:pl-72' : ''}`}>
        {isSidebarVisible && <AdminSidebar open={isSidebarOpen} onClose={closeSidebar} />}
        <div className="min-w-0 flex-1">
          <AdminTopbar onToggleSidebar={toggleSidebar} sidebarOpen={isSidebarOpen} />
          {children}
        </div>
      </div>
    </RoleRouteGuard>
  );
}
