import { z } from 'zod';

import { moneySchema } from './money';

export const productSkuSchema = z.object({
  id: z.string(),
  skuCode: z.string(),
  name: z.string(),
  size: z.string(),
  color: z.string(),
  imageUrl: z.string().min(1),
  price: moneySchema,
  compareAtPrice: moneySchema.optional(),
  availableQty: z.number().int().nonnegative(),
  availability: z.enum(['in_stock', 'low_stock', 'out_of_stock']),
  badge: z.string().optional()
});

export const productSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  brand: z.string(),
  category: z.string(),
  description: z.string(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
  skus: z.array(productSkuSchema).min(1)
});

export type Product = z.infer<typeof productSchema>;
export type ProductSku = z.infer<typeof productSkuSchema>;
