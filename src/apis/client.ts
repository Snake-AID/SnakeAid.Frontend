import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiResponse } from '@/types/api-response';
import type { UserInfo } from '@/types/auth.type';
import axios from 'axios';
import { API_CONFIG } from '@/constants/constant';
import { storage } from '@/utils';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_INFO_KEY = 'user_info';

const isAuthEndpoint = (url?: string) => {
  if (!url) {
    return false;
  }

  return [
    '/auth/login',
    '/auth/login/v2',
    '/auth/refresh',
    '/auth/logout',
  ].some(endpoint => url.includes(endpoint));
};

// Token refresh state management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

export class ApiClientError extends Error {
  statusCode: number;
  error: ApiResponse<unknown>['error'];

  constructor(message: string, statusCode: number, error: ApiResponse<unknown>['error']) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.error = error;
  }
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach stored JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = storage.get<string>(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error instanceof Error ? error : new Error(String(error))),
);

// Response interceptor — normalise errors to ApiResponse shape
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    if (!response.data.is_success) {
      return Promise.reject(new ApiClientError(
        response.data.message ?? 'Request failed',
        response.data.status_code,
        response.data.error ?? null,
      ));
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url as string | undefined;
    const requestIsAuthEndpoint = isAuthEndpoint(requestUrl);

    if (error.response) {
      const { status, data }: { status: number; data: ApiResponse<unknown> } = error.response;

      // Handle 401 Unauthorized - attempt token refresh
      if (status === 401 && !requestIsAuthEndpoint && !originalRequest._retry) {
        if (isRefreshing) {
          // If refresh is already in progress, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            return apiClient(originalRequest);
          }).catch((err) => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = storage.get<string>(REFRESH_TOKEN_KEY);
        const userId = storage.get<UserInfo>(USER_INFO_KEY)?.id;

        if (refreshToken && userId) {
          try {
            // Import authApi dynamically to avoid circular dependency
            const { authApi } = await import('./auth.api');
            const refreshResponse = await authApi.refreshToken({
              userId,
              refreshToken,
            });

            // Update stored tokens
            storage.set(TOKEN_KEY, refreshResponse.accessToken);
            storage.set(REFRESH_TOKEN_KEY, refreshResponse.refreshToken);
            storage.set(USER_INFO_KEY, refreshResponse.user);

            // Update Authorization header for original request
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.accessToken}`;

            // Process queued requests
            processQueue(null, refreshResponse.accessToken);

            // Retry original request
            return apiClient(originalRequest);
          } catch (refreshError) {
            // Refresh failed - clear tokens and redirect to login
            processQueue(refreshError, null);
            storage.remove(TOKEN_KEY);
            storage.remove(REFRESH_TOKEN_KEY);
            storage.remove(USER_INFO_KEY);
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        } else {
          // No refresh token available for protected request - redirect to login
          storage.remove(TOKEN_KEY);
          storage.remove(REFRESH_TOKEN_KEY);
          storage.remove(USER_INFO_KEY);
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }

      return Promise.reject(new ApiClientError(
        data?.message ?? 'Something went wrong',
        status,
        data?.error ?? null,
      ));
    }

    if (error.request) {
      return Promise.reject(new ApiClientError(
        'Network error. Please check your connection.',
        0,
        null,
      ));
    }

    return Promise.reject(new ApiClientError(
      error instanceof Error ? error.message : 'Request failed',
      0,
      null,
    ));
  },
);

// Generic API methods
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.get<ApiResponse<T>>(url, config).then(res => res.data.data as T),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.post<ApiResponse<T>>(url, data, config).then(res => res.data.data as T),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.put<ApiResponse<T>>(url, data, config).then(res => res.data.data as T),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.patch<ApiResponse<T>>(url, data, config).then(res => res.data.data as T),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.delete<ApiResponse<T>>(url, config).then(res => res.data.data as T),

  getPaginated: <T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<{
    items: T[];
    meta: { total_pages: number; total_items: number; current_page: number; page_size: number };
  }> =>
    apiClient
      .get<ApiResponse<{
      items: T[];
      meta: { total_pages: number; total_items: number; current_page: number; page_size: number };
    }>>(url, config)
      .then(res => res.data.data as {
        items: T[];
        meta: { total_pages: number; total_items: number; current_page: number; page_size: number };
      }),

  getFullResponse: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.get<ApiResponse<T>>(url, config).then(res => res.data),

  postFullResponse: <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> =>
    apiClient.post<ApiResponse<T>>(url, data, config).then(res => res.data),
};

export default apiClient;
