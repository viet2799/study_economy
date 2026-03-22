import { z } from 'zod';

import { addressSchema } from './address';
import { cartSummarySchema } from './cart';
import { moneySchema } from './money';

export const checkoutFormSchema = z.object({
  address: addressSchema,
  email: z.string().email(),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(['cod', 'card', 'bank_transfer'])
});

export const checkoutQuoteSchema = z.object({
  cart: cartSummarySchema,
  estimatedDeliveryDate: z.string(),
  payableAmount: moneySchema,
  canCheckout: z.boolean(),
  warnings: z.array(z.string())
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
export type CheckoutQuote = z.infer<typeof checkoutQuoteSchema>;
