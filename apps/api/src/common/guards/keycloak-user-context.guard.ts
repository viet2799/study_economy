import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { decodeJwt, JWTPayload } from 'jose';

import { CURRENT_USER_KEY, IS_PUBLIC_KEY } from '../constants/app.constants';
import { CurrentUser } from '../interfaces/current-user.interface';

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
export class KeycloakUserContextGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    const request = context.switchToHttp().getRequest();

    if (isPublic && !request.headers.authorization) {
      return true;
    }

    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return true;
    }

    const payload = decodeJwt(token) as KeycloakPayload;
    const currentUser = this.mapPayload(payload);
    request.user = currentUser;
    request[CURRENT_USER_KEY] = currentUser;

    return true;
  }

  private mapPayload(payload: KeycloakPayload): CurrentUser {
    const clientId = this.configService.getOrThrow<string>('keycloakClientId');
    const resourceAccess = Object.entries(payload.resource_access ?? {}).reduce<
      Record<string, string[]>
    >((accumulator, [resource, access]) => {
      accumulator[resource] = access.roles ?? [];
      return accumulator;
    }, {});
    const realmRoles = payload.realm_access?.roles ?? [];
    const clientRoles = resourceAccess[clientId] ?? [];

    return {
      sub: String(payload.sub),
      username: payload.preferred_username,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      firstName: payload.given_name,
      lastName: payload.family_name,
      roles: Array.from(new Set([...realmRoles, ...clientRoles])),
      resourceAccess
    };
  }
}
