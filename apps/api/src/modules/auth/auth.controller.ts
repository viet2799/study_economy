import { Controller, Get } from '@nestjs/common';

import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/interfaces/current-user.interface';

@Controller('auth')
export class AuthController {
  @Public()
  @Get('ping')
  ping(): { ok: boolean } {
    return { ok: true };
  }

  @Get('me')
  me(@CurrentUserDecorator() user: CurrentUser): CurrentUser {
    return user;
  }
}
