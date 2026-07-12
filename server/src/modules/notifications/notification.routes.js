import { Router } from 'express';
import * as notificationController from './notification.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.getAll);
router.patch('/read-all', notificationController.readAll);
router.patch('/:id/read', notificationController.read);
router.delete('/:id', notificationController.remove);

export default router;
