import { Router } from 'express';
import authRouter from './modules/auth/auth.routes.js';
import departmentRouter from './modules/departments/department.routes.js';
import employeeRouter from './modules/employees/employee.routes.js';
import assetRouter from './modules/assets/asset.routes.js';
import allocationRouter from './modules/allocations/allocation.routes.js';
import transferRouter from './modules/transfers/transfer.routes.js';
import bookingRouter from './modules/bookings/booking.routes.js';
import maintenanceRouter from './modules/maintenance/maintenance.routes.js';
import auditRouter from './modules/audits/audit.routes.js';
import dashboardRouter from './modules/dashboard/dashboard.routes.js';
import notificationRouter from './modules/notifications/notification.routes.js';
import activityLogRouter from './modules/activity-logs/activity-log.routes.js';
import reportsRouter from './modules/reports/reports.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/departments', departmentRouter);
router.use('/employees', employeeRouter);
router.use('/assets', assetRouter);
router.use('/allocations', allocationRouter);
router.use('/transfers', transferRouter);
router.use('/bookings', bookingRouter);
router.use('/maintenance', maintenanceRouter);
router.use('/audits', auditRouter);
router.use('/dashboard', dashboardRouter);
router.use('/notifications', notificationRouter);
router.use('/activity-logs', activityLogRouter);
router.use('/reports', reportsRouter);

export default router;
