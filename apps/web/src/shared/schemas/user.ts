import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().url().optional(),
  roles: z.array(z.string()).default([])
});

export type User = z.infer<typeof userSchema>;
