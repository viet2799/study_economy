'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clientEnv } from '../../../shared/config/env';
import { queryKeys } from '../../../shared/api/query-keys';
import { useApiClient } from '../../../shared/api/api-client-context';
import { productSchema, type Product } from '../../../shared/schemas/product';
import { cartSummarySchema } from '../../../shared/schemas/cart';
import { addToCart, getMockState } from '../../../shared/mocks/state';

export function useProducts() {
  const api = useApiClient();

  return useQuery({
    queryKey: queryKeys.catalog.products(),
    queryFn: async () =>
      clientEnv.NEXT_PUBLIC_USE_MSW
        ? getMockState().products
        : api.get<Product[]>('/api/v1/catalog/products', productSchema.array())
  });
}

export function useAddToCart() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      skuId,
      quantity
    }: {
      skuId: string;
      quantity: number;
    }) =>
      clientEnv.NEXT_PUBLIC_USE_MSW
        ? addToCart(skuId, quantity)
        : api.post('/api/v1/cart/items', cartSummarySchema, {
            skuId,
            quantity
          }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail });
      await queryClient.invalidateQueries({ queryKey: queryKeys.cart.count });
      await queryClient.invalidateQueries({ queryKey: queryKeys.checkout.quote });
    }
  });
}
