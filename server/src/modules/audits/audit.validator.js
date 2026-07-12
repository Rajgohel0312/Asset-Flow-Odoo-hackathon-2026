import { z } from 'zod';

export const createAuditCycleSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(255),
    departmentId: z.string().uuid('Invalid department ID').optional().nullable(),
    location: z.string().max(255).optional().nullable(),
    startDate: z.string().transform((val) => new Date(val)),
    endDate: z.string().transform((val) => new Date(val)),
  })
  .refine((data) => data.startDate < data.endDate, {
    message: 'Start date must be before end date',
    path: ['startDate'],
  });

export const verifyAuditItemSchema = z.object({
  assetId: z.string().uuid('Invalid asset ID'),
  verificationStatus: z.enum(['VERIFIED', 'MISSING', 'DAMAGED']),
  remarks: z.string().max(1000).optional().nullable(),
});
