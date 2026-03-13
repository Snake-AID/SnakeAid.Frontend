'use client';

import { ArrowLeft, Construction } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface UnderDevelopmentPageProps {
  title: string;
  description: string;
  activeMenu: string;
};

export default function UnderDevelopmentPage({ title, description, activeMenu }: UnderDevelopmentPageProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    // Check authentication status
    // This is a valid use case for setting state in useEffect for authentication check
    /* eslint-disable react-hooks-extra/no-direct-set-state-in-use-effect */
    const checkAuth = () => {
      const authenticated = localStorage.getItem('admin_authenticated');
      const email = localStorage.getItem('admin_email');

      if (authenticated === 'true' && email) {
        setIsAuthenticated(true);
        setAdminEmail(email);
        setIsLoading(false);
      } else {
        router.push('/admin/login');
      }
    };

    checkAuth();
    /* eslint-enable react-hooks-extra/no-direct-set-state-in-use-effect */
  }, [router, setIsAuthenticated, setAdminEmail, setIsLoading]);

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_email');
    router.push('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <Construction className="mx-auto mb-4 size-16 animate-pulse text-amber-500" />
          <p className="font-medium text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AdminSidebar activeMenu={activeMenu} adminEmail={adminEmail} onLogout={handleLogout} />

      <main className="flex h-full flex-1 flex-col items-center justify-center overflow-hidden bg-gray-50/50">
        <div className="text-center">
          <div className="mb-8 inline-flex size-32 items-center justify-center rounded-full bg-amber-100">
            <Construction className="size-16 text-amber-600" strokeWidth={1.5} />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-gray-800">{title}</h1>
          <p className="mb-8 text-lg text-gray-600">{description}</p>
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-8 py-6 text-amber-800">
            <p className="text-sm font-semibold">🚧 Trang này đang trong quá trình phát triển</p>
            <p className="mt-2 text-sm">Chức năng sẽ được cập nhật trong phiên bản tiếp theo</p>
          </div>

          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition-all hover:bg-green-700 hover:shadow-lg"
          >
            <ArrowLeft className="size-5" />
            <span>Quay về Dashboard</span>
          </button>
        </div>
      </main>
    </div>
  );
}
