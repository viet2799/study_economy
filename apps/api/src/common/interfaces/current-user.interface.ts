export interface CurrentUser {
  sub: string;
  preferred_username?: string;
  email?: string;
  scope?: string;
  realm_access?: {
    roles: string[];
  };
}
