'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

import { createApiClient } from './client';
import { useAuth } from '../../features/auth/hooks/use-auth';

const ApiClientContext = createContext<ReturnType<typeof createApiClient> | null>(null);

export function ApiClientProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [client] = useState(() =>
    createApiClient({
      auth: auth.mode === 'keycloak' ? auth.session : undefined
    })
  );

  return (
    <ApiClientContext.Provider value={client}>{children}</ApiClientContext.Provider>
  );
}

export function useApiClient() {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error('useApiClient must be used within ApiClientProvider');
  }

  return client;
}
