import { z } from 'zod';

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(2).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  roleId: z.string().uuid().optional(),
});

export const promoteSchema = z.object({
  roleId: z.string().uuid('Invalid role ID'),
});

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
});
