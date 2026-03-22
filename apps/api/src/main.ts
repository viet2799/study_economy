import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AppLoggerService } from './common/logger/app-logger.service';
import { PrismaService } from './modules/prisma/prisma.service';
import { AppModule } from './modules/app/app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const prismaService = app.get(PrismaService);
  const logger = app.get(AppLoggerService);

  app.enableCors({
    origin: configService.getOrThrow<string[]>('corsOrigins'),
    credentials: true
  });
  app.useLogger(logger);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  );
  app.useGlobalFilters(
    new HttpExceptionFilter(app.get(HttpAdapterHost), configService)
  );
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));

  if (configService.get<boolean>('swaggerEnabled')) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Studybase API')
        .setDescription('Base API with Keycloak, Prisma, Redis and Kafka')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build()
    );

    SwaggerModule.setup('docs', app, document);
  }

  await prismaService.enableShutdownHooks(app);

  await app.listen(configService.getOrThrow<number>('apiPort'));
}

void bootstrap();
