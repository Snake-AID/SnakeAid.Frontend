import type { UserInfo, UserRole } from '@/types/auth.type';
import { storage } from '@/utils';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_INFO_KEY = 'user_info';

const LEGACY_ADMIN_AUTH_KEY = 'admin_authenticated';
const LEGACY_ADMIN_EMAIL_KEY = 'admin_email';

type AuthBootstrapStatus = 'idle' | 'checking';

interface AuthSessionSnapshot {
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
}

const AUTH_SESSION_SERVER_SNAPSHOT: AuthSessionSnapshot = {
  isBootstrapping: true,
  isAuthenticated: false,
  role: null,
};

const listeners = new Set<() => void>();
let bootstrapStatus: AuthBootstrapStatus = 'idle';
let bootstrapPromise: Promise<boolean> | null = null;
let authSessionSnapshotCache: AuthSessionSnapshot = AUTH_SESSION_SERVER_SNAPSHOT;

const emitAuthSessionChange = () => {
  listeners.forEach(listener => listener());
};

export const subscribeAuthSession = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const normalizeRole = (role?: string | null): UserRole | null => {
  if (!role) {
    return null;
  }

  const normalized = role.trim().toLowerCase();
  if (normalized === 'admin') {
    return 'Admin';
  }
  if (normalized === 'operator') {
    return 'Operator';
  }

  return null;
};

export const getStoredUser = (): UserInfo | null => storage.get<UserInfo>(USER_INFO_KEY);

export const getStoredRole = (): UserRole | null => normalizeRole(getStoredUser()?.role ?? null);

export const isAuthenticated = (): boolean => {
  const accessToken = storage.get<string>(ACCESS_TOKEN_KEY);
  const user = getStoredUser();
  return Boolean(accessToken && user);
};

export const getAuthSessionSnapshot = (): AuthSessionSnapshot => {
  const nextSnapshot: AuthSessionSnapshot = {
    isBootstrapping: bootstrapStatus === 'checking',
    isAuthenticated: isAuthenticated(),
    role: getStoredRole(),
  };

  const isSameSnapshot = authSessionSnapshotCache.isBootstrapping === nextSnapshot.isBootstrapping
    && authSessionSnapshotCache.isAuthenticated === nextSnapshot.isAuthenticated
    && authSessionSnapshotCache.role === nextSnapshot.role;

  if (isSameSnapshot) {
    return authSessionSnapshotCache;
  }

  authSessionSnapshotCache = nextSnapshot;
  return authSessionSnapshotCache;
};

export const getAuthSessionServerSnapshot = (): AuthSessionSnapshot => AUTH_SESSION_SERVER_SNAPSHOT;

const getRefreshContext = () => {
  const refreshToken = storage.get<string>(REFRESH_TOKEN_KEY);
  const user = getStoredUser();

  if (!refreshToken || !user?.id) {
    return null;
  }

  return {
    userId: user.id,
    refreshToken,
  };
};

export const clearAuthSession = () => {
  storage.remove(ACCESS_TOKEN_KEY);
  storage.remove(REFRESH_TOKEN_KEY);
  storage.remove(USER_INFO_KEY);

  localStorage.removeItem(LEGACY_ADMIN_AUTH_KEY);
  localStorage.removeItem(LEGACY_ADMIN_EMAIL_KEY);

  emitAuthSessionChange();
};

export const getRoleHomePath = (role: UserRole): string => {
  if (role === 'Admin') {
    return '/admin/dashboard';
  }

  return '/operator/dashboard';
};

export const syncLegacyAdminKeys = (user: UserInfo) => {
  const normalizedRole = normalizeRole(user.role);

  if (normalizedRole === 'Admin') {
    localStorage.setItem(LEGACY_ADMIN_AUTH_KEY, 'true');
    localStorage.setItem(LEGACY_ADMIN_EMAIL_KEY, user.email);
  } else {
    localStorage.removeItem(LEGACY_ADMIN_AUTH_KEY);
    localStorage.removeItem(LEGACY_ADMIN_EMAIL_KEY);
  }

  emitAuthSessionChange();
};

export const isRoleAllowed = (actualRole: string | null | undefined, expectedRole: UserRole) => {
  const normalized = normalizeRole(actualRole ?? null);
  return normalized === expectedRole;
};

export const bootstrapAuthSession = async (): Promise<boolean> => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (isAuthenticated()) {
    return true;
  }

  const refreshContext = getRefreshContext();
  if (!refreshContext) {
    return false;
  }

  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapStatus = 'checking';
  emitAuthSessionChange();

  bootstrapPromise = (async () => {
    try {
      const { authApi } = await import('@/apis/auth.api');
      const response = await authApi.refreshToken(refreshContext);
      syncLegacyAdminKeys(response.user);
      return true;
    } catch {
      clearAuthSession();
      return false;
    } finally {
      bootstrapStatus = 'idle';
      bootstrapPromise = null;
      emitAuthSessionChange();
    }
  })();

  return bootstrapPromise;
};
