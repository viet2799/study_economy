export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
    me: ['auth', 'me'] as const
  },
  catalog: {
    products: (filters: Record<string, string | number | boolean | undefined> = {}) =>
      ['catalog', 'products', filters] as const,
    product: (slug: string) => ['catalog', 'product', slug] as const
  },
  cart: {
    detail: ['cart', 'detail'] as const,
    count: ['cart', 'count'] as const
  },
  checkout: {
    quote: ['checkout', 'quote'] as const
  }
};
