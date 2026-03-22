import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  KeycloakConnectModule,
  PolicyEnforcementMode,
  TokenValidation
} from 'nest-keycloak-connect';

import { AuthController } from './auth.controller';
import { KeycloakAuthService } from './keycloak-auth.service';

@Module({
  imports: [
    KeycloakConnectModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        authServerUrl: configService.getOrThrow<string>('keycloakAuthServerUrl'),
        realm: configService.getOrThrow<string>('keycloakRealm'),
        clientId: configService.getOrThrow<string>('keycloakClientId'),
        secret: configService.getOrThrow<string>('keycloakSecret'),
        realmPublicKey: configService.get<string>('keycloakRealmPublicKey'),
        policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
        tokenValidation: TokenValidation.OFFLINE
      })
    })
  ],
  controllers: [AuthController],
  providers: [KeycloakAuthService],
  exports: [KeycloakConnectModule, KeycloakAuthService]
})
export class AuthModule {}
