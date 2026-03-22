import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '../../common/decorators/authenticated-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { CurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  @Public()
  @Get('ping')
  @ResponseMessage('Auth module is healthy')
  ping(): { ok: boolean } {
    return { ok: true };
  }

  @ApiBearerAuth()
  @Get('me')
  @ResponseMessage('Token decoded successfully')
  me(@AuthenticatedUser() user: CurrentUser): CurrentUser {
    return user;
  }
}
