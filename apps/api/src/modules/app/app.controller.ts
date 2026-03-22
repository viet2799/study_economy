import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@ApiTags('App')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ResponseMessage('API root loaded')
  root() {
    return {
      name: 'studybase-api',
      description:
        'NestJS base with clean boundaries, Prisma, Redis, Kafka and Keycloak'
    };
  }
}
