import { z } from 'zod';

import { moneySchema } from './money';
import { productSkuSchema } from './product';

export const cartItemSchema = z.object({
  id: z.string(),
  sku: productSkuSchema,
  quantity: z.number().int().min(1),
  lineTotal: moneySchema
});

export const cartSummarySchema = z.object({
  itemCount: z.number().int().nonnegative(),
  subtotal: moneySchema,
  shippingFee: moneySchema,
  discountTotal: moneySchema,
  grandTotal: moneySchema,
  items: z.array(cartItemSchema)
});

export type CartItem = z.infer<typeof cartItemSchema>;
export type CartSummary = z.infer<typeof cartSummarySchema>;
