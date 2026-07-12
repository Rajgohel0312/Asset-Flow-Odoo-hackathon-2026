import { Router } from 'express';
import * as employeeController from './employee.controller.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { updateEmployeeSchema, promoteSchema, updateStatusSchema } from '../../validators/employee.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', employeeController.getAll);
router.get('/:id', employeeController.getById);

router.patch('/:id', validate(updateEmployeeSchema), employeeController.update);
router.patch('/:id/promote', authorize('ADMIN', 'ASSET_MANAGER'), validate(promoteSchema), employeeController.promote);
router.patch('/:id/status', authorize('ADMIN', 'ASSET_MANAGER'), validate(updateStatusSchema), employeeController.toggleStatus);

export default router;
