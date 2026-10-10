export interface AuthenticatedPrincipal {
  sub?: string;
  sid?: string;
  email?: string;
  role: string;
  type: 'access' | 'admin';
}
