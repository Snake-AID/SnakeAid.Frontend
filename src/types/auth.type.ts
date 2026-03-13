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
}

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
  role: string;
  isActive: boolean;
}
