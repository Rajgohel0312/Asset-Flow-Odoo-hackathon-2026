import { Router } from 'express';
import * as allocationController from './allocation.controller.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { allocateAssetSchema, returnAssetSchema } from '../../validators/allocation.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', allocationController.getAll);
router.get('/:id', allocationController.getById);

router.post('/', authorize('ADMIN', 'ASSET_MANAGER'), validate(allocateAssetSchema), allocationController.create);
router.patch('/:id/return', authorize('ADMIN', 'ASSET_MANAGER'), validate(returnAssetSchema), allocationController.returnAsset);

export default router;
