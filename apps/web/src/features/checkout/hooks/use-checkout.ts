'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { clientEnv } from '../../../shared/config/env';
import { useApiClient } from '../../../shared/api/api-client-context';
import { queryKeys } from '../../../shared/api/query-keys';
import {
  checkoutQuoteSchema,
  type CheckoutFormValues,
  type CheckoutQuote
} from '../../../shared/schemas/checkout';
import { getMockState } from '../../../shared/mocks/state';

export function useCheckoutQuote() {
  const api = useApiClient();

  return useQuery({
    queryKey: queryKeys.checkout.quote,
    queryFn: async () =>
      clientEnv.NEXT_PUBLIC_USE_MSW
        ? getMockState().checkoutQuote
        : api.get<CheckoutQuote>('/api/v1/checkout/quote', checkoutQuoteSchema)
  });
}

const submitResponseSchema = z.object({
  orderId: z.string(),
  status: z.enum(['created', 'pending_payment', 'placed'])
});

export type CheckoutSubmitResult = z.infer<typeof submitResponseSchema>;

export function useSubmitCheckout() {
  const api = useApiClient();

  return useMutation({
    mutationFn: async (values: CheckoutFormValues) =>
      clientEnv.NEXT_PUBLIC_USE_MSW
        ? ({
            orderId: `ord_${Math.random().toString(36).slice(2, 10)}`,
            status: 'created'
          } as CheckoutSubmitResult)
        : api.post<CheckoutSubmitResult>('/api/v1/checkout', submitResponseSchema, values)
  });
}
