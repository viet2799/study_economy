import { z } from 'zod';

export const moneySchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().length(3)
});

export type Money = z.infer<typeof moneySchema>;
