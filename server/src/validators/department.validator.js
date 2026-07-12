import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional().nullable(),
  parentDepartmentId: z.string().uuid('Invalid parent department ID').optional().nullable(),
  departmentHeadId: z.string().uuid('Invalid department head ID').optional().nullable(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();
