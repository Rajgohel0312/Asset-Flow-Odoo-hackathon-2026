import { Router } from 'express';
import * as activityLogController from './activity-log.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), activityLogController.getAll);

export default router;
