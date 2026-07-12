import { z } from 'zod';

export const createTransferSchema = z.object({
  assetId: z.string().uuid('Invalid asset ID'),
  toEmployeeId: z.string().uuid('Invalid target employee ID'),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(500),
});
