import type { UserInfo, UserRole } from '@/types/auth.type';
import { storage } from '@/utils';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_INFO_KEY = 'user_info';

const LEGACY_ADMIN_AUTH_KEY = 'admin_authenticated';
const LEGACY_ADMIN_EMAIL_KEY = 'admin_email';

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

export const clearAuthSession = () => {
  storage.remove(ACCESS_TOKEN_KEY);
  storage.remove(REFRESH_TOKEN_KEY);
  storage.remove(USER_INFO_KEY);

  localStorage.removeItem(LEGACY_ADMIN_AUTH_KEY);
  localStorage.removeItem(LEGACY_ADMIN_EMAIL_KEY);
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
};

export const isRoleAllowed = (actualRole: string | null | undefined, expectedRole: UserRole) => {
  const normalized = normalizeRole(actualRole ?? null);
  return normalized === expectedRole;
};
