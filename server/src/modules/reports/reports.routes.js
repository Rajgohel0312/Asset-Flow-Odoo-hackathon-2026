import { Router } from 'express';
import * as reportsController from './reports.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/assets', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), reportsController.getAssetsReport);
router.get('/maintenance', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), reportsController.getMaintenanceReport);
router.get('/departments', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), reportsController.getDepartmentReport);
router.get('/bookings', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), reportsController.getBookingsReport);
router.get('/audits', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), reportsController.getAuditReport);
router.get('/utilization', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), reportsController.getUtilizationReport);
router.get('/idle-assets', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), reportsController.getIdleAssetsReport);
router.get('/overdue', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), reportsController.getOverdueAssetsReport);

export default router;
