import { Router } from 'express';
import * as transferController from './transfer.controller.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { createTransferSchema } from '../../validators/transfer.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', transferController.getAll);
router.get('/:id', transferController.getById);

router.post('/', validate(createTransferSchema), transferController.create);
router.patch('/:id/approve', authorize('ADMIN', 'ASSET_MANAGER'), transferController.approve);
router.patch('/:id/reject', authorize('ADMIN', 'ASSET_MANAGER'), transferController.reject);

export default router;
