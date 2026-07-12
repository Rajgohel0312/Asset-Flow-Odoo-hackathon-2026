import { z } from 'zod';

export const createRequestSchema = z.object({
  assetId: z.string().uuid('Invalid asset ID'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
  issueDescription: z.string().min(5, 'Issue description must be at least 5 characters').max(1000),
  photo: z.string().url('Photo must be a valid URL').optional().nullable(),
});

export const assignTechnicianSchema = z.object({
  technicianId: z.string().uuid('Invalid technician employee ID'),
});

export const addUpdateSchema = z.object({
  comment: z.string().min(2, 'Comment must be at least 2 characters').max(500),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED']).optional(),
});
