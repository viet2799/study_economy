import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createRemoteJWKSet,
  importSPKI,
  jwtVerify,
  JWTPayload,
  KeyLike
} from 'jose';

import { CurrentUser } from '../../common/interfaces/current-user.interface';

interface KeycloakPayload extends JWTPayload {
  email?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  realm_access?: {
    roles?: string[];
  };
  resource_access?: Record<string, { roles?: string[] }>;
}

@Injectable()
export class KeycloakAuthService {
  private readonly issuer: string;
  private readonly clientId: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly publicKeyPromise?: Promise<KeyLike>;

  constructor(private readonly configService: ConfigService) {
    const authServerUrl = this.configService.getOrThrow<string>(
      'keycloakAuthServerUrl'
    );
    const realm = this.configService.getOrThrow<string>('keycloakRealm');
    const realmPublicKey = this.configService.get<string>('keycloakRealmPublicKey');

    this.issuer = `${authServerUrl}/realms/${realm}`;
    this.clientId = this.configService.getOrThrow<string>('keycloakClientId');
    this.jwks = createRemoteJWKSet(
      new URL(`${this.issuer}/protocol/openid-connect/certs`)
    );
    this.publicKeyPromise = realmPublicKey
      ? importSPKI(this.toPem(realmPublicKey), 'RS256')
      : undefined;
  }

  async verifyToken(token: string): Promise<CurrentUser> {
    try {
      const { payload } = this.publicKeyPromise
        ? await jwtVerify(token, await this.publicKeyPromise, {
            issuer: this.issuer
          })
        : await jwtVerify(token, this.jwks, {
            issuer: this.issuer
          });

      return this.mapUser(payload as KeycloakPayload);
    } catch {
      throw new UnauthorizedException('Invalid Keycloak token');
    }
  }

  private mapUser(payload: KeycloakPayload): CurrentUser {
    const resourceAccess = Object.entries(payload.resource_access ?? {}).reduce<
      Record<string, string[]>
    >((accumulator, [resource, access]) => {
      accumulator[resource] = access.roles ?? [];
      return accumulator;
    }, {});
    const realmRoles = payload.realm_access?.roles ?? [];
    const clientRoles = resourceAccess[this.clientId] ?? [];

    return {
      sub: String(payload.sub),
      username: payload.preferred_username,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      roles: Array.from(new Set([...realmRoles, ...clientRoles])),
      resourceAccess
    };
  }

  private toPem(publicKey: string): string {
    const normalizedKey = publicKey
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/\s+/g, '');
    const wrapped = normalizedKey.match(/.{1,64}/g)?.join('\n') ?? normalizedKey;

    return `-----BEGIN PUBLIC KEY-----\n${wrapped}\n-----END PUBLIC KEY-----`;
  }
}
