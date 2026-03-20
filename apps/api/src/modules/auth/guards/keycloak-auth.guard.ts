import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { CURRENT_USER_KEY, IS_PUBLIC_KEY } from '../../../common/constants/app.constants';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { KeycloakAuthService } from '../keycloak-auth.service';

@Injectable()
export class KeycloakAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly keycloakAuthService: KeycloakAuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const user = await this.keycloakAuthService.verifyToken(token);
    request.currentUser = user;
    request[CURRENT_USER_KEY] = user;

    return true;
  }
}
