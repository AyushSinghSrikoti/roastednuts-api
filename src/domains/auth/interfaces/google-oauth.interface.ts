export interface GoogleCallbackInput {
  code?: string;
  state?: string;
  oauthError?: string;
  cookieHeader?: string;
}

export interface GoogleAuthorizationRequest {
  state: string;
  authorizationUrl: string;
  stateMaxAge: number;
  secureCookie: boolean;
}

export interface GoogleOAuthStatePayload {
  type?: string;
}

export interface GoogleTokenResponse {
  access_token?: string;
  error_description?: string;
}

export interface GoogleUserInfoResponse {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export interface GoogleLoginResult {
  response: SignupResponse;
  isNewUser: boolean;
}
import type { SignupResponse } from '@/domains/auth/types';
