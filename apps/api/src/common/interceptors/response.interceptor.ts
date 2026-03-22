import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';

import { RESPONSE_MESSAGE_KEY } from '../constants/app.constants';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, unknown> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>
  ): Observable<unknown> {
    const response = context.switchToHttp().getResponse();
    const request = context.switchToHttp().getRequest();
    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass()
      ]) ?? 'Request processed successfully';

    return next.handle().pipe(
      map((data) => ({
        data,
        message,
        status: 'success',
        statusCode: response.statusCode,
        path: request.url,
        timestamp: new Date().toISOString()
      }))
    );
  }
}
