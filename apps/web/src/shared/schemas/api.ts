import { z } from 'zod';

export const apiEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    message: z.string(),
    status: z.literal('success'),
    statusCode: z.number(),
    path: z.string(),
    timestamp: z.string()
  });

export type ApiEnvelope<T> = {
  data: T;
  message: string;
  status: 'success';
  statusCode: number;
  path: string;
  timestamp: string;
};
