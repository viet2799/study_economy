import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard, ResourceGuard } from 'nest-keycloak-connect';

import { appEnv } from '../../common/config/env';
import { validateEnv } from '../../common/config/env.validation';
import { KeycloakUserContextGuard } from '../../common/guards/keycloak-user-context.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { HealthModule } from '../health/health.module';
import { KafkaModule } from '../kafka/kafka.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { UsersModule } from '../users/users.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appEnv],
      validate: validateEnv
    }),
    PrismaModule,
    RedisModule,
    KafkaModule,
    AuthModule,
    HealthModule,
    ChatModule,
    UsersModule
  ],
  controllers: [AppController],
  providers: [
    AppLoggerService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: ResourceGuard
    },
    {
      provide: APP_GUARD,
      useClass: KeycloakUserContextGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ]
})
export class AppModule {}
