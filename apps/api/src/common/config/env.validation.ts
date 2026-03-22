import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  validateSync
} from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsIn(['development', 'test', 'production'])
  NODE_ENV: string = 'development';

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  API_PORT!: number;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  REDIS_URL!: string;

  @IsString()
  KAFKA_BROKERS!: string;

  @IsOptional()
  @IsString()
  KAFKA_CLIENT_ID: string = 'studybase-api';

  @IsOptional()
  @IsString()
  KAFKA_GROUP_ID: string = 'studybase-group';

  @IsOptional()
  @IsString()
  KAFKA_CHAT_TOPIC: string = 'chat.messages';

  @IsUrl()
  KEYCLOAK_AUTH_SERVER_URL!: string;

  @IsString()
  KEYCLOAK_REALM!: string;

  @IsString()
  KEYCLOAK_CLIENT_ID!: string;

  @IsString()
  KEYCLOAK_SECRET!: string;

  @IsOptional()
  @IsString()
  KEYCLOAK_REALM_PUBLIC_KEY?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  SWAGGER_ENABLED: boolean = true;

  @IsOptional()
  @IsIn(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
  LOG_LEVEL: string = 'info';

  @IsOptional()
  @IsString()
  LOG_FILE_PATH?: string;
}

export const validateEnv = (
  config: Record<string, unknown>
): Record<string, unknown> => {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return config;
};
