import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional().nullable(),
  defaultMaintenanceDays: z.number().int().nonnegative().optional().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createAssetSchema = z.object({
  assetTag: z.string().min(2, 'Asset Tag must be at least 2 characters').max(50),
  serialNumber: z.string().max(100).optional().nullable(),
  categoryId: z.string().uuid('Invalid category ID'),
  departmentId: z.string().uuid('Invalid department ID').optional().nullable(),
  assetName: z.string().min(2, 'Asset Name must be at least 2 characters').max(255),
  purchaseDate: z
    .string()
    .transform((val) => (val ? new Date(val) : null))
    .optional()
    .nullable(),
  purchaseCost: z.number().nonnegative('Purchase cost must be greater than or equal to 0').optional().default(0),
  warrantyExpiry: z
    .string()
    .transform((val) => (val ? new Date(val) : null))
    .optional()
    .nullable(),
  location: z.string().max(255).optional().nullable(),
  condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED']).optional().default('GOOD'),
  status: z
    .enum(['AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED'])
    .optional()
    .default('AVAILABLE'),
  isBookable: z.boolean().optional().default(false),
  notes: z.string().optional().nullable(),
});

export const updateAssetSchema = createAssetSchema.partial();

export const retireAssetSchema = z.object({
  notes: z.string().min(1, 'Retirement notes/reason are required'),
});

export const disposeAssetSchema = z.object({
  notes: z.string().min(1, 'Disposal notes/reason are required'),
});
