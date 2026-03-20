import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { appEnv } from '../../common/config/env';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { HealthModule } from '../health/health.module';
import { KafkaModule } from '../kafka/kafka.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appEnv]
    }),
    PrismaModule,
    RedisModule,
    KafkaModule,
    AuthModule,
    HealthModule,
    ChatModule
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: KeycloakAuthGuard
    }
  ]
})
export class AppModule {}
