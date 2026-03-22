import { type ZodTypeAny, ZodError } from 'zod';

import { clientEnv } from '../config/env';
import { apiEnvelopeSchema } from '../schemas/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly path: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type AuthSession = {
  getAccessToken: () => Promise<string | null>;
  refreshAccessToken: () => Promise<boolean>;
  login: () => Promise<void>;
};

type CreateApiClientOptions = {
  auth?: AuthSession;
  baseUrl?: string;
};

async function parseBody(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function decodeResponse<T>(
  response: Response,
  schema: ZodTypeAny,
  path: string
): Promise<T> {
  const payload = await parseBody(response);
  const envelopeResult = apiEnvelopeSchema(schema).safeParse(payload);

  if (!envelopeResult.success) {
    throw new ApiError(
      'API contract validation failed',
      response.status,
      path,
      envelopeResult.error.flatten()
    );
  }

  return envelopeResult.data.data as T;
}

async function request<T>(
  baseUrl: string,
  path: string,
  schema: ZodTypeAny,
  init: RequestInit,
  auth?: AuthSession
): Promise<T> {
  const execute = async (retryOnUnauthorized: boolean) => {
    const accessToken = auth ? await auth.getAccessToken() : null;
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      }
    });

    if (response.status === 401 && auth && retryOnUnauthorized) {
      const refreshed = await auth.refreshAccessToken();
      if (refreshed) {
        return execute(false);
      }
      await auth.login();
    }

    if (!response.ok) {
      const details = await parseBody(response);
      throw new ApiError(
        `Request failed with status ${response.status}`,
        response.status,
        path,
        details
      );
    }

    return decodeResponse<T>(response, schema, path);
  };

  return execute(true);
}

export function createApiClient(options: CreateApiClientOptions = {}) {
  const baseUrl = options.baseUrl ?? clientEnv.NEXT_PUBLIC_API_BASE_URL;

  return {
    get: <T>(path: string, schema: ZodTypeAny) =>
      request<T>(baseUrl, path, schema, { method: 'GET' }, options.auth),
    post: <T>(path: string, schema: ZodTypeAny, body?: unknown) =>
      request<T>(
        baseUrl,
        path,
        schema,
        {
          method: 'POST',
          body: body === undefined ? undefined : JSON.stringify(body)
        },
        options.auth
      ),
    patch: <T>(path: string, schema: ZodTypeAny, body?: unknown) =>
      request<T>(
        baseUrl,
        path,
        schema,
        {
          method: 'PATCH',
          body: body === undefined ? undefined : JSON.stringify(body)
        },
        options.auth
      ),
    delete: <T>(path: string, schema: ZodTypeAny, body?: unknown) =>
      request<T>(
        baseUrl,
        path,
        schema,
        {
          method: 'DELETE',
          body: body === undefined ? undefined : JSON.stringify(body)
        },
        options.auth
      )
  };
}

export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}
