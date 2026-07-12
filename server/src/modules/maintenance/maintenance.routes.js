import { Router } from 'express';
import * as maintenanceController from './maintenance.controller.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { createRequestSchema, assignTechnicianSchema, addUpdateSchema } from '../../validators/maintenance.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', maintenanceController.getAll);
router.get('/:id', maintenanceController.getById);

router.post('/', validate(createRequestSchema), maintenanceController.create);
router.patch('/:id/approve', authorize('ADMIN', 'ASSET_MANAGER'), maintenanceController.approve);
router.patch('/:id/reject', authorize('ADMIN', 'ASSET_MANAGER'), maintenanceController.reject);
router.patch('/:id/assign', authorize('ADMIN', 'ASSET_MANAGER'), validate(assignTechnicianSchema), maintenanceController.assignTechnician);
router.post('/:id/updates', validate(addUpdateSchema), maintenanceController.addUpdate);
router.patch('/:id/resolve', authorize('ADMIN', 'ASSET_MANAGER'), maintenanceController.resolve);

export default router;
