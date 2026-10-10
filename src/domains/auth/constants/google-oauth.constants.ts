export const GOOGLE_OAUTH = {
  STATE_COOKIE_NAME: 'google_oauth_state',
  STATE_COOKIE_PATH: '/api/auth/google/callback',
  STATE_TYPE: 'google_oauth_state',
  RESPONSE_TYPE: 'code',
  SCOPE: 'openid email profile',
  PROMPT: 'select_account',
  GRANT_TYPE: 'authorization_code',
  FORM_CONTENT_TYPE: 'application/x-www-form-urlencoded',
} as const;
