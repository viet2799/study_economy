import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pino, { DestinationStream, Logger as PinoLogger } from 'pino';

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly logger: PinoLogger;

  constructor(private readonly configService: ConfigService) {
    this.logger = pino(
      {
        level: this.configService.get<string>('logLevel', 'info'),
        base: undefined,
        timestamp: pino.stdTimeFunctions.isoTime
      },
      this.createDestination()
    );
  }

  log(message: string, context?: string): void {
    this.logger.info({ context }, message);
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error({ context, trace }, message);
  }

  warn(message: string, context?: string): void {
    this.logger.warn({ context }, message);
  }

  debug(message: string, context?: string): void {
    this.logger.debug({ context }, message);
  }

  verbose(message: string, context?: string): void {
    this.logger.trace({ context }, message);
  }

  get instance(): PinoLogger {
    return this.logger;
  }

  private createDestination(): DestinationStream {
    const logFilePath = this.configService.get<string>('logFilePath');
    return logFilePath ? pino.destination(logFilePath) : pino.destination(1);
  }
}
