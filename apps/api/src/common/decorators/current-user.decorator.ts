import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { CURRENT_USER_KEY } from '../constants/app.constants';
import { CurrentUser } from '../interfaces/current-user.interface';

export const CurrentUserDecorator = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUser | undefined => {
    const request = context.switchToHttp().getRequest();
    return request[CURRENT_USER_KEY];
  }
);
