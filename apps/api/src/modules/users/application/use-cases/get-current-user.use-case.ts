import { Inject, Injectable } from '@nestjs/common';

import { CurrentUser } from '../../../../common/interfaces/current-user.interface';
import { USER_REPOSITORY } from '../../users.constants';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user-repository.interface';

@Injectable()
export class GetCurrentUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository
  ) {}

  execute(currentUser: CurrentUser): Promise<UserEntity> {
    return this.userRepository.syncFromIdentity(currentUser);
  }
}
