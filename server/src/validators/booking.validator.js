import { z } from 'zod';

export const createBookingSchema = z
  .object({
    assetId: z.string().uuid('Invalid asset ID'),
    startTime: z.string().transform((val) => new Date(val)),
    endTime: z.string().transform((val) => new Date(val)),
    purpose: z.string().min(5, 'Purpose must be at least 5 characters').max(500),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'Start time must be before end time',
    path: ['startTime'],
  });

export const updateBookingSchema = z
  .object({
    startTime: z.string().transform((val) => new Date(val)).optional(),
    endTime: z.string().transform((val) => new Date(val)).optional(),
    purpose: z.string().min(5).max(500).optional(),
  })
  .refine((data) => {
    if (data.startTime && data.endTime) {
      return data.startTime < data.endTime;
    }
    return true;
  }, {
    message: 'Start time must be before end time',
    path: ['startTime'],
  });
