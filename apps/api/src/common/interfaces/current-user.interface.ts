export interface CurrentUser {
  sub: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  resourceAccess: Record<string, string[]>;
}
