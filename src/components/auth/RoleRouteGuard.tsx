'use client';

import type { UserRole } from '@/types/auth.type';
import { useRouter } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import {
  bootstrapAuthSession,
  getAuthSessionServerSnapshot,
  getAuthSessionSnapshot,
  getRoleHomePath,
  subscribeAuthSession,
} from '@/utils/auth-session';

interface RoleRouteGuardProps {
  allowedRole: UserRole;
  children: React.ReactNode;
}

export default function RoleRouteGuard({ allowedRole, children }: RoleRouteGuardProps) {
  const router = useRouter();
  const session = useSyncExternalStore(
    subscribeAuthSession,
    getAuthSessionSnapshot,
    getAuthSessionServerSnapshot,
  );

  useEffect(() => {
    if (session.isBootstrapping) {
      return;
    }

    if (!session.isAuthenticated || !session.role) {
      router.replace('/login');
      return;
    }

    if (session.role !== allowedRole) {
      router.replace(getRoleHomePath(session.role));
    }
  }, [allowedRole, router, session.isAuthenticated, session.isBootstrapping, session.role]);

  useEffect(() => {
    void bootstrapAuthSession();
  }, []);

  const canRender = session.isAuthenticated && session.role === allowedRole;

  if (!canRender) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">Đang xác thực phiên đăng nhập...</p>
      </div>
    );
  }

  return <>{children}</>;
}
