import { Inject, Injectable } from '@nestjs/common';

import { USER_REPOSITORY } from '../../users.constants';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user-repository.interface';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository
  ) {}

  execute(): Promise<UserEntity[]> {
    return this.userRepository.findAll();
  }
}
