import { z } from 'zod';

export const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  line1: z.string().min(5),
  line2: z.string().optional(),
  ward: z.string().min(2),
  district: z.string().min(2),
  city: z.string().min(2),
  postalCode: z.string().min(3)
});

export type Address = z.infer<typeof addressSchema>;
