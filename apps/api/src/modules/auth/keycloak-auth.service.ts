import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

import { CurrentUser } from '../../common/interfaces/current-user.interface';

interface KeycloakPayload extends JWTPayload {
  preferred_username?: string;
  email?: string;
  scope?: string;
  azp?: string;
  realm_access?: {
    roles?: string[];
  };
}

@Injectable()
export class KeycloakAuthService {
  private readonly issuer: string;
  private readonly clientIds: string[];
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly configService: ConfigService) {
    const keycloakUrl = this.configService.getOrThrow<string>('keycloakUrl');
    const realm = this.configService.getOrThrow<string>('keycloakRealm');

    this.issuer = `${keycloakUrl}/realms/${realm}`;
    this.clientIds = this.configService.getOrThrow<string[]>('keycloakClientIds');
    this.jwks = createRemoteJWKSet(
      new URL(`${this.issuer}/protocol/openid-connect/certs`)
    );
  }

  async verifyToken(token: string): Promise<CurrentUser> {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer
      });

      const keycloakPayload = payload as KeycloakPayload;
      if (!this.isAllowedAudience(keycloakPayload)) {
        throw new UnauthorizedException('Token audience is not allowed');
      }

      return this.mapUser(keycloakPayload);
    } catch {
      throw new UnauthorizedException('Invalid Keycloak token');
    }
  }

  private isAllowedAudience(payload: KeycloakPayload): boolean {
    const audiences = Array.isArray(payload.aud)
      ? payload.aud
      : typeof payload.aud === 'string'
        ? [payload.aud]
        : [];

    if (payload.azp && this.clientIds.includes(payload.azp)) {
      return true;
    }

    return audiences.some((audience) => this.clientIds.includes(audience));
  }

  private mapUser(payload: KeycloakPayload): CurrentUser {
    return {
      sub: String(payload.sub),
      preferred_username: payload.preferred_username,
      email: payload.email,
      scope: payload.scope,
      realm_access:
        payload.realm_access &&
        Array.isArray(payload.realm_access.roles)
          ? {
              roles: payload.realm_access.roles
            }
          : undefined
    };
  }
}
