export interface LoginResponse {
  token: string;
  refreshToken?: string;
}

export interface SignupResponse extends LoginResponse {
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface RefreshResponse {
  token: string;
  refreshToken: string;
}

export interface CurrentUserResponse {
  id: string | null;
  email: string | null;
  name: string;
  avatarUrl: string | null;
  role: string;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
}
