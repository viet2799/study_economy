export interface AppEnv {
  nodeEnv: string;
  apiPort: number;
  databaseUrl: string;
  redisUrl: string;
  kafkaBrokers: string[];
  kafkaClientId: string;
  kafkaGroupId: string;
  kafkaChatTopic: string;
  keycloakAuthServerUrl: string;
  keycloakRealm: string;
  keycloakClientId: string;
  keycloakSecret: string;
  keycloakRealmPublicKey?: string;
  corsOrigins: string[];
  swaggerEnabled: boolean;
  logLevel: string;
  logFilePath?: string;
}

const get = (name: string, fallback?: string): string => {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
};

export const appEnv = (): AppEnv => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  apiPort: Number(process.env.API_PORT ?? 3001),
  databaseUrl: get('DATABASE_URL'),
  redisUrl: get('REDIS_URL'),
  kafkaBrokers: get('KAFKA_BROKERS').split(',').map((value) => value.trim()),
  kafkaClientId: get('KAFKA_CLIENT_ID', 'studybase-api'),
  kafkaGroupId: get('KAFKA_GROUP_ID', 'studybase-group'),
  kafkaChatTopic: get('KAFKA_CHAT_TOPIC', 'chat.messages'),
  keycloakAuthServerUrl: get('KEYCLOAK_AUTH_SERVER_URL'),
  keycloakRealm: get('KEYCLOAK_REALM'),
  keycloakClientId: get('KEYCLOAK_CLIENT_ID'),
  keycloakSecret: get('KEYCLOAK_SECRET'),
  keycloakRealmPublicKey: process.env.KEYCLOAK_REALM_PUBLIC_KEY,
  corsOrigins: [
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
    'http://localhost:3000'
  ],
  swaggerEnabled: process.env.SWAGGER_ENABLED !== 'false',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  logFilePath: process.env.LOG_FILE_PATH
});
