import { Router } from 'express';
import * as departmentController from './department.controller.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../../validators/department.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', departmentController.getAll);
router.get('/:id', departmentController.getById);

router.post('/', authorize('ADMIN', 'ASSET_MANAGER'), validate(createDepartmentSchema), departmentController.create);
router.patch('/:id', authorize('ADMIN', 'ASSET_MANAGER'), validate(updateDepartmentSchema), departmentController.update);
router.delete('/:id', authorize('ADMIN', 'ASSET_MANAGER'), departmentController.remove);

export default router;
