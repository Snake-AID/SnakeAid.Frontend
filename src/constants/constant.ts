export const APP_CONFIG = {
  name: 'Snake Aid Center',
  description: 'Healthcare system for snakebite victims',
  version: '1.0.0',
  author: 'Snake Aid Team',
  email: 'support@snakeaidcenter.com',
  phone: '+1 (555) 123-4567',
  address: '123 Snake Aid Street, City, State 12345',
} as const;

const publicApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const normalizedApiBaseUrl = publicApiBaseUrl?.replace(/\/+$/, '');

// API configuration
export const API_CONFIG = {
  baseURL: normalizedApiBaseUrl
    ? (normalizedApiBaseUrl.endsWith('/api')
        ? normalizedApiBaseUrl
        : `${normalizedApiBaseUrl}/api`)
    : '/api',
  timeout: 30000,
  retries: 3,
} as const;
