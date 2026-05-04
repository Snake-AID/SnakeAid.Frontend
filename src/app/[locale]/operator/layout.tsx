'use client';

'use client';

import { useEffect, useState } from 'react';
import RoleRouteGuard from '@/components/auth/RoleRouteGuard';
import OperatorSidebar from '@/components/operator/OperatorSidebar';
import OperatorTopbar from '@/components/operator/OperatorTopbar';

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  useEffect(() => {
    const initLayout = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
        setIsSidebarVisible(false);
      }
    };
    initLayout();
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
    <RoleRouteGuard allowedRole="Operator">
      <div className={`flex min-h-screen bg-slate-50 transition-[padding-left] duration-200 ${isSidebarOpen ? 'lg:pl-72' : ''}`}>
        {isSidebarVisible && <OperatorSidebar open={isSidebarOpen} onClose={closeSidebar} />}
        <div className="min-w-0 flex-1">
          <OperatorTopbar onToggleSidebar={toggleSidebar} sidebarOpen={isSidebarOpen} />
          {children}
        </div>
      </div>
    </RoleRouteGuard>
  );
}
