'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { clientEnv } from '../shared/config/env';
import { createAppQueryClient } from '../shared/api/query-client';
import { AuthProvider } from '../features/auth/hooks/use-auth';
import { ApiClientProvider } from '../shared/api/api-client-context';
import { ToastProvider } from '../shared/ui/toast';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createAppQueryClient());

  useEffect(() => {
    if (clientEnv.NEXT_PUBLIC_USE_MSW) {
      void import('../shared/mocks/browser').then(({ startBrowserMocks }) => startBrowserMocks());
    }
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <ApiClientProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === 'development' ? <ReactQueryDevtools initialIsOpen={false} /> : null}
          </QueryClientProvider>
        </ApiClientProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
