import { Router } from 'express';
import * as auditController from './audit.controller.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { createAuditCycleSchema, verifyAuditItemSchema } from '../../validators/audit.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), auditController.getAll);
router.get('/:id', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), auditController.getById);
router.get('/:id/report', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), auditController.getReport);

router.post('/', authorize('ADMIN', 'ASSET_MANAGER'), validate(createAuditCycleSchema), auditController.create);
router.patch('/:id/close', authorize('ADMIN', 'ASSET_MANAGER'), auditController.closeCycle);
router.post('/:id/items', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), validate(verifyAuditItemSchema), auditController.verifyItem);

export default router;
