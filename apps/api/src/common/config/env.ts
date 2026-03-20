export interface AppEnv {
  nodeEnv: string;
  apiPort: number;
  databaseUrl: string;
  redisUrl: string;
  kafkaBrokers: string[];
  kafkaClientId: string;
  kafkaGroupId: string;
  kafkaChatTopic: string;
  keycloakUrl: string;
  keycloakRealm: string;
  keycloakClientIds: string[];
  keycloakClientSecret: string;
  corsOrigins: string[];
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
  keycloakUrl: get('KEYCLOAK_URL'),
  keycloakRealm: get('KEYCLOAK_REALM'),
  keycloakClientIds: get('KEYCLOAK_CLIENT_ID')
    .split(',')
    .map((value) => value.trim()),
  keycloakClientSecret: get('KEYCLOAK_CLIENT_SECRET'),
  corsOrigins: [
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
    'http://localhost:3000'
  ]
});
