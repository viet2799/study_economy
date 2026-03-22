import { Module } from '@nestjs/common';

import { GetCurrentUserUseCase } from './application/use-cases/get-current-user.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { UsersController } from './users.controller';
import { USER_REPOSITORY } from './users.constants';

@Module({
  controllers: [UsersController],
  providers: [
    GetCurrentUserUseCase,
    ListUsersUseCase,
    PrismaUserRepository,
    {
      provide: USER_REPOSITORY,
      useExisting: PrismaUserRepository
    }
  ],
  exports: [USER_REPOSITORY]
})
export class UsersModule {}
