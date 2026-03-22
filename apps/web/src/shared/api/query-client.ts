import {
  MutationCache,
  QueryCache,
  QueryClient
} from '@tanstack/react-query';

import { notifyToast } from '../ui/toast-store';

function toMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
}

export function createAppQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        notifyToast({
          title: 'Query failed',
          description: toMessage(error),
          variant: 'error'
        });
      }
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        notifyToast({
          title: 'Action failed',
          description: toMessage(error),
          variant: 'error'
        });
      }
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1
      },
      mutations: {
        retry: 0
      }
    }
  });
}
