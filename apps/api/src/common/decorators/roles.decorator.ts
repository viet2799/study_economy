import { SetMetadata } from '@nestjs/common';

import { ROLES_KEY } from '../constants/app.constants';

export interface RolesOptions {
  roles: string[];
}

export const Roles = (options: RolesOptions) =>
  SetMetadata(ROLES_KEY, options.roles);
