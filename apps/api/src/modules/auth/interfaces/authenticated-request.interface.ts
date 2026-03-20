import { Request } from 'express';

import { CurrentUser } from '../../../common/interfaces/current-user.interface';

export interface AuthenticatedRequest extends Request {
  currentUser?: CurrentUser;
}
