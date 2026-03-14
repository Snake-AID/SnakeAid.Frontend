'use client';

import type { UserRole } from '@/types/auth.type';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { getRoleHomePath, getStoredRole, isAuthenticated } from '@/utils/auth-session';

interface RoleRouteGuardProps {
  allowedRole: UserRole;
  children: React.ReactNode;
}

export default function RoleRouteGuard({ allowedRole, children }: RoleRouteGuardProps) {
  const router = useRouter();

  const canRender = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    if (!isAuthenticated()) {
      return false;
    }

    const currentRole = getStoredRole();
    return currentRole === allowedRole;
  }, [allowedRole]);

  useEffect(() => {
    const authenticated = isAuthenticated();
    const currentRole = getStoredRole();

    if (!authenticated || !currentRole) {
      router.replace('/login');
    } else if (currentRole !== allowedRole) {
      router.replace(getRoleHomePath(currentRole));
    }
  }, [allowedRole, router]);

  if (!canRender) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">Đang xác thực phiên đăng nhập...</p>
      </div>
    );
  }

  return <>{children}</>;
}
