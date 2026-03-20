import { Controller, Get } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  root() {
    return {
      name: 'studybase-api',
      description: 'NestJS base with Prisma, Redis, Kafka, Socket.IO and Keycloak'
    };
  }
}
