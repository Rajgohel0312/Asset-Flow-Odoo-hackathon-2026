import { Router } from 'express';
import * as activityLogController from './activityLog.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', activityLogController.getAll);

export default router;
