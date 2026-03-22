import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { CurrentUser } from '../../../../common/interfaces/current-user.interface';
import { BasePrismaRepository } from '../../../../common/repositories/base-prisma.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user-repository.interface';

type UserWhereUniqueInput = Prisma.UserWhereUniqueInput;
type UserCreateInput = Prisma.UserCreateInput;
type UserUpdateInput = Prisma.UserUpdateInput;

@Injectable()
export class PrismaUserRepository
  extends BasePrismaRepository<
    User,
    UserEntity,
    UserWhereUniqueInput,
    UserCreateInput,
    UserUpdateInput
  >
  implements UserRepository
{
  constructor(private readonly prismaService: PrismaService) {
    super(prismaService.user, (record) => ({
      id: record.id,
      keycloakId: record.keycloakId,
      email: record.email,
      username: record.username,
      firstName: record.firstName,
      lastName: record.lastName,
      roles: Array.isArray(record.roles) ? record.roles.map(String) : [],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }));
  }

  async findByKeycloakId(keycloakId: string): Promise<UserEntity | null> {
    const record = await this.prismaService.user.findUnique({
      where: { keycloakId }
    });

    return record
      ? {
          id: record.id,
          keycloakId: record.keycloakId,
          email: record.email,
          username: record.username,
          firstName: record.firstName,
          lastName: record.lastName,
          roles: Array.isArray(record.roles) ? record.roles.map(String) : [],
          createdAt: record.createdAt,
          updatedAt: record.updatedAt
        }
      : null;
  }

  async syncFromIdentity(identity: CurrentUser): Promise<UserEntity> {
    const record = await this.prismaService.user.upsert({
      where: { keycloakId: identity.sub },
      create: {
        keycloakId: identity.sub,
        email: identity.email ?? null,
        username: identity.username ?? null,
        firstName: identity.firstName ?? null,
        lastName: identity.lastName ?? null,
        roles: identity.roles
      },
      update: {
        email: identity.email ?? null,
        username: identity.username ?? null,
        firstName: identity.firstName ?? null,
        lastName: identity.lastName ?? null,
        roles: identity.roles
      }
    });

    return {
      id: record.id,
      keycloakId: record.keycloakId,
      email: record.email,
      username: record.username,
      firstName: record.firstName,
      lastName: record.lastName,
      roles: Array.isArray(record.roles) ? record.roles.map(String) : [],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
}
