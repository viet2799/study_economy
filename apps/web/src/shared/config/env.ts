import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:3001'),
  NEXT_PUBLIC_AUTH_MODE: z.enum(['keycloak', 'mock']).default('mock'),
  NEXT_PUBLIC_USE_MSW: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  NEXT_PUBLIC_KEYCLOAK_URL: z.string().url().optional(),
  NEXT_PUBLIC_KEYCLOAK_REALM: z.string().min(1).optional(),
  NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional()
});

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_AUTH_MODE: process.env.NEXT_PUBLIC_AUTH_MODE,
  NEXT_PUBLIC_USE_MSW: process.env.NEXT_PUBLIC_USE_MSW,
  NEXT_PUBLIC_KEYCLOAK_URL: process.env.NEXT_PUBLIC_KEYCLOAK_URL,
  NEXT_PUBLIC_KEYCLOAK_REALM: process.env.NEXT_PUBLIC_KEYCLOAK_REALM,
  NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN
});
