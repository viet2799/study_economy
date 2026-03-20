import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { KeycloakAuthService } from './keycloak-auth.service';

@Module({
  controllers: [AuthController],
  providers: [KeycloakAuthService],
  exports: [KeycloakAuthService]
})
export class AuthModule {}
