export interface UserEntity {
  id: string;
  keycloakId: string;
  email: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}
