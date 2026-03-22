import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly configService: ConfigService
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest();
    const { httpAdapter } = this.httpAdapterHost;

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;
    const isProduction = this.configService.get<string>('nodeEnv') === 'production';
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as { message?: string | string[] } | null)?.message ??
          'Internal server error';
    const error =
      typeof exceptionResponse === 'object' &&
      exceptionResponse &&
      'error' in exceptionResponse
        ? String((exceptionResponse as { error?: string }).error)
        : HttpStatus[status];

    httpAdapter.reply(
      host.switchToHttp().getResponse(),
      {
        statusCode: status,
        status: 'error',
        message,
        error,
        path: request.url,
        timestamp: new Date().toISOString(),
        ...(isProduction ? {} : { details: exceptionResponse })
      },
      status
    );
  }
}
