import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '../../common/decorators/authenticated-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/interfaces/current-user.interface';
import { GetCurrentUserUseCase } from './application/use-cases/get-current-user.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase
  ) {}

  @Get('me')
  @ResponseMessage('Current user synchronized from Keycloak')
  getCurrentUser(@AuthenticatedUser() user: CurrentUser) {
    return this.getCurrentUserUseCase.execute(user);
  }

  @Get()
  @Roles({ roles: ['admin'] })
  @ResponseMessage('Users fetched successfully')
  listUsers() {
    return this.listUsersUseCase.execute();
  }
}
