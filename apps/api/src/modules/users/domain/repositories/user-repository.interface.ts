import { BaseRepository } from '../../../../common/repositories/base.repository';
import { CurrentUser } from '../../../../common/interfaces/current-user.interface';
import { UserEntity } from '../entities/user.entity';

export interface UserRepository
  extends BaseRepository<
    UserEntity,
    { id: string } | { keycloakId: string },
    Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>,
    Partial<Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>>
  > {
  findByKeycloakId(keycloakId: string): Promise<UserEntity | null>;
  syncFromIdentity(identity: CurrentUser): Promise<UserEntity>;
}
