'use client';

import { useQuery } from '@tanstack/react-query';

import { clientEnv } from '../../../shared/config/env';
import { useApiClient } from '../../../shared/api/api-client-context';
import { queryKeys } from '../../../shared/api/query-keys';
import { cartSummarySchema, type CartSummary } from '../../../shared/schemas/cart';
import { getMockState } from '../../../shared/mocks/state';

export function useCartSummary() {
  const api = useApiClient();

  return useQuery({
    queryKey: queryKeys.cart.detail,
    queryFn: async () =>
      clientEnv.NEXT_PUBLIC_USE_MSW
        ? getMockState().cart
        : api.get<CartSummary>('/api/v1/cart', cartSummarySchema)
  });
}

export function useCartCount() {
  const summary = useCartSummary();

  return {
    ...summary,
    count: summary.data?.itemCount ?? 0
  };
}
