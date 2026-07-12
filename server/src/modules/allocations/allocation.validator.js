import { z } from 'zod';

export const allocateAssetSchema = z.object({
  assetId: z.string().uuid('Invalid asset ID'),
  employeeId: z.string().uuid('Invalid employee ID'),
  expectedReturnDate: z
    .string()
    .transform((val) => (val ? new Date(val) : null))
    .optional()
    .nullable(),
});

export const returnAssetSchema = z.object({
  returnNotes: z.string().max(500).optional().nullable(),
});
