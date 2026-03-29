// Types based on backend models
export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
  phoneNumber?: string;
  type?: string;
  biography?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: UserRole;
}

export type UserRole = 'Admin' | 'Operator';

export interface RefreshTokenRequest {
  userId: string;
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
}
