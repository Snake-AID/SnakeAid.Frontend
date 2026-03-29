import type { AuthResponse, LoginRequest, RefreshTokenRequest, UserInfo } from '@/types/auth.type';
import { api } from './client';

// Helper functions for token management
const saveTokens = (authResponse: AuthResponse) => {
  // eslint-disable-next-line ts/no-require-imports
  const { storage } = require('@/utils'); // Import here to avoid circular dependency
  storage.set('access_token', authResponse.accessToken);
  storage.set('refresh_token', authResponse.refreshToken);
  storage.set('user_info', authResponse.user);
};

const clearTokens = () => {
  // eslint-disable-next-line ts/no-require-imports
  const { storage } = require('@/utils');
  storage.remove('access_token');
  storage.remove('refresh_token');
  storage.remove('user_info');
};

// Auth API endpoints
export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/login/v2', data);
      // Auto-save tokens after successful login
      saveTokens(response);
      return response;
    } catch (err) {
      // err may be ApiClientError or other thrown value.  Convert to a
      // lightweight object that UI can interpret.
      // * UI should catch and inspect `error.type` or `error.statusCode`.
      // * Field-level validation errors are returned as `error.fields`.
      if (err && typeof err === 'object' && 'statusCode' in err) {
        const status = (err as any).statusCode;
        if (status === 400 && (err as any).error?.validationErrors) {
          const validationError = new Error('validation');
          Object.assign(validationError, {
            type: 'validation' as const,
            fields: (err as any).error.validationErrors,
          });
          throw validationError;
        }
        if (status === 401) {
          const backendMessage = String((err as any).message ?? '').toLowerCase();

          if (backendMessage.includes('invalid role')) {
            const roleError = new Error('Role bạn chọn không thể đăng nhập bằng tài khoản này.');
            Object.assign(roleError, { type: 'role_mismatch' as const });
            throw roleError;
          }

          if (backendMessage.includes('invalid email or password')) {
            const credError = new Error('Email hoặc mật khẩu không đúng.');
            Object.assign(credError, { type: 'credentials' as const });
            throw credError;
          }

          const fallbackError = new Error('Bạn không có quyền đăng nhập bằng tài khoản này.');
          Object.assign(fallbackError, { type: 'unauthorized' as const });
          throw fallbackError;
        }
      }
      throw err;
    }
  },

  refreshToken: async (data: RefreshTokenRequest): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/refresh', data);
      // Auto-save tokens after successful refresh
      saveTokens(response);
      return response;
    } catch (err) {
      // if fail on refresh, mean refresh token is nhót. Clear tokens
      clearTokens();
      throw err;
    }
  },

  logout: async (): Promise<string> => {
    try {
      const response = await api.post<string>('/auth/logout');
      // Clear tokens after logout
      clearTokens();
      return response;
    } catch (err) {
      // even if logout fails, we still clear tokens locally
      clearTokens();
      throw err;
    }
  },

  getCurrentUser: (): Promise<UserInfo> =>
    api.get<UserInfo>('/auth/me'),
};
